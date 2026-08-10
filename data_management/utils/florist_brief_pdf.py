"""Builds the printable florist brief for a single delivery event.

The brief is what an admin hands to a florist in person: the delivery details,
the customer's brief, and — the part the florist actually cares about — the
amount they have to spend on flowers once Bloomprint's commission is out.
"""

from decimal import Decimal
from functools import lru_cache
from io import BytesIO
from pathlib import Path

from django.conf import settings
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(settings.BASE_DIR)
ASSETS = ROOT / "frontend" / "src" / "assets"
LOGO_PATH = ASSETS / "bloomprint_logo.png"
FONT_DIR = ASSETS / "fonts" / "Playfair_Display" / "static"

# Deliberately monochrome: the brief is printed and faxed around florist shops,
# and a tinted panel with a coloured edge bar survives neither well.
WHITE = colors.white
INK = colors.HexColor("#171717")
BODY = colors.HexColor("#44403c")
MUTED = colors.HexColor("#78716c")
LINE = colors.HexColor("#d4d4d4")

# Playfair for display type to match the site, Helvetica for everything else.
DISPLAY = "Helvetica-Bold"
DISPLAY_REGULAR = "Helvetica"


@lru_cache(maxsize=1)
def _register_fonts():
    """Register Playfair Display if it is on disk, else fall back to Helvetica."""
    global DISPLAY, DISPLAY_REGULAR
    try:
        pdfmetrics.registerFont(TTFont("Playfair", str(FONT_DIR / "PlayfairDisplay-Regular.ttf")))
        pdfmetrics.registerFont(TTFont("Playfair-Bold", str(FONT_DIR / "PlayfairDisplay-Bold.ttf")))
        DISPLAY = "Playfair-Bold"
        DISPLAY_REGULAR = "Playfair"
    except Exception:
        # A missing font file must never stop an admin printing a brief.
        pass
    return DISPLAY, DISPLAY_REGULAR


def money(amount) -> str:
    if amount is None:
        return "—"
    return f"${Decimal(amount).quantize(Decimal('0.01')):,.2f}"


def wrap(text, font, size, max_width):
    """Greedy word wrap, returning a list of lines."""
    if not text:
        return []
    lines = []
    for paragraph in str(text).splitlines():
        if not paragraph.strip():
            lines.append("")
            continue
        words, current = paragraph.split(), ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if stringWidth(candidate, font, size) <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def draw_paragraph(pdf, text, x, y, width, font, size, leading, colour, max_lines=None):
    """Draw wrapped text downward from y. Returns the y below the last line."""
    lines = wrap(text, font, size, width)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .,") + "…"
    pdf.setFont(font, size)
    pdf.setFillColor(colour)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def draw_qr(pdf, value, x, y, size):
    qr = QrCodeWidget(value)
    qr.barLevel = "H"
    qr.barFillColor = INK
    bounds = qr.getBounds()
    qr_width = bounds[2] - bounds[0]
    qr_height = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / qr_width, 0, 0, size / qr_height, 0, 0])
    drawing.add(qr)
    drawing.drawOn(pdf, x, y)


def _recipient_address(order):
    parts = [
        order.recipient_street_address,
        order.recipient_suburb,
        order.recipient_city,
        " ".join(p for p in [order.recipient_state, order.recipient_postcode] if p),
    ]
    return [p for p in parts if p and str(p).strip()]


def _delivery_area(order):
    """Suburb and state only — what a florist needs to judge the drive."""
    parts = [order.recipient_suburb or order.recipient_city, order.recipient_state]
    return ", ".join(part for part in parts if part) or "—"


def _full_name(first, last):
    return f"{first or ''} {last or ''}".strip() or "—"


def _long_date(value):
    """'Tuesday 4 August 2026' — built without %-d, which Windows does not support."""
    return f"{value:%A} {value.day} {value:%B %Y}"


def build_florist_brief(event, variant: str = "claimed") -> bytes:
    """
    Render the one-page A4 brief for an event and return the PDF bytes.

    Two variants, because the same document goes to different audiences:

    - ``request`` — sent to every florist whose service area covers the
      delivery, before anyone has claimed it. Shows the suburb, the date, the
      brief and the money, and nothing that identifies the recipient. A dozen
      florists may receive this and never claim, and an emailed PDF cannot be
      taken back, so the recipient's name, street address, delivery notes and
      card message are withheld until someone commits.
    - ``claimed`` — sent to the florist who claimed it, and downloaded by admin.
      The full brief: everything needed to actually make and deliver the order.
    """
    if variant not in ("request", "claimed"):
        raise ValueError(f"Unknown brief variant {variant!r}; expected 'request' or 'claimed'.")

    is_request = variant == "request"
    display, display_regular = _register_fonts()
    order = event.order

    # Not named `money` — that is the currency formatter defined above, and
    # shadowing it turns every drawString into a TypeError.
    breakdown = event.money_breakdown()
    budget = breakdown['budget']
    commission = breakdown['platform_commission']
    flower_spend = breakdown['florist_budget']
    delivery_fee = breakdown['delivery_fee']
    florist_total = breakdown['florist_total']
    rate_label = breakdown['commission_rate']

    buffer = BytesIO()
    page_width, page_height = A4
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle(f"Bloomprint florist brief — {event.reference}")
    pdf.setAuthor("Bloomprint")
    pdf.setSubject(f"Delivery brief for {event.delivery_date:%d %B %Y}")

    pdf.setFillColor(WHITE)
    pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)

    margin = 42
    content_width = page_width - margin * 2

    # ---- Header -------------------------------------------------------------
    header_y = page_height - 96
    if LOGO_PATH.exists():
        logo_size = 54
        pdf.drawImage(
            ImageReader(str(LOGO_PATH)),
            margin,
            header_y - 6,
            width=logo_size,
            height=logo_size,
            preserveAspectRatio=True,
            mask="auto",
        )
        text_x = margin + logo_size + 14
    else:
        text_x = margin

    pdf.setFont(display, 23)
    pdf.setFillColor(INK)
    pdf.drawString(text_x, header_y + 26, "Bloomprint")
    pdf.setFont("Helvetica", 9.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(text_x, header_y + 11, "Delivery available to claim" if is_request else "Florist brief")

    # The reference, never the primary key — and no order number at all: the
    # florist has no relationship with the order, only with this delivery.
    pdf.setFont("Helvetica-Bold", 13)
    pdf.setFillColor(INK)
    pdf.drawRightString(page_width - margin, header_y + 26, event.reference or "—")
    pdf.setFont("Helvetica", 8.5)
    pdf.setFillColor(MUTED)
    pdf.drawRightString(
        page_width - margin, header_y + 11,
        "Quote this reference",
    )

    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(1)
    pdf.line(margin, header_y - 12, page_width - margin, header_y - 12)

    # ---- The money panel ----------------------------------------------------
    panel_height = 118
    panel_y = header_y - 22 - panel_height
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.8)
    pdf.roundRect(margin, panel_y, content_width, panel_height, 10, fill=0, stroke=1)

    pad = 22
    pdf.setFont("Helvetica-Bold", 8.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(margin + pad, panel_y + panel_height - 26, "FLOWERS TO THE VALUE OF")

    pdf.setFont(display, 42)
    pdf.setFillColor(INK)
    pdf.drawString(margin + pad, panel_y + panel_height - 72, money(flower_spend))

    pdf.setFont("Helvetica", 9)
    pdf.setFillColor(BODY)
    pdf.drawString(
        margin + pad,
        panel_y + 22,
        "Design freely to this value — no set recipe, no stem count, no vase requirement.",
    )

    # Breakdown, right-aligned inside the panel.
    rows = [("Customer's budget", money(budget)), (f"Bloomprint commission ({rate_label})", f"−{money(commission)}")]
    if delivery_fee > 0:
        rows.append(("Delivery fee (paid to you in full)", f"+{money(delivery_fee)}"))
    else:
        rows.append(("Delivery", "Included in the budget"))
    rows.append(("Total", money(florist_total)))

    row_y = panel_y + panel_height - 28
    value_x = page_width - margin - pad
    label_x = value_x - 108
    for index, (label, value) in enumerate(rows):
        final = index == len(rows) - 1
        if final:
            pdf.setStrokeColor(LINE)
            pdf.setLineWidth(0.8)
            pdf.line(label_x - 96, row_y + 12, value_x, row_y + 12)
            row_y -= 4
        pdf.setFont("Helvetica-Bold" if final else "Helvetica", 8.5)
        pdf.setFillColor(INK if final else MUTED)
        pdf.drawRightString(label_x, row_y, label)
        pdf.setFont("Helvetica-Bold" if final else "Helvetica", 9 if final else 8.5)
        pdf.setFillColor(INK if final else BODY)
        pdf.drawRightString(value_x, row_y, value)
        row_y -= 15

    # ---- Two columns: delivery details, and the brief -----------------------
    columns_top = panel_y - 30
    gutter = 22
    column_width = (content_width - gutter) / 2
    right_x = margin + column_width + gutter

    def section_heading(text, x, y, width):
        pdf.setFont("Helvetica-Bold", 8.5)
        pdf.setFillColor(MUTED)
        pdf.drawString(x, y, text.upper())
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.8)
        pdf.line(x, y - 8, x + width, y - 8)
        return y - 24

    def field(label, value, x, y, width, max_lines=4):
        pdf.setFont("Helvetica", 7.5)
        pdf.setFillColor(MUTED)
        pdf.drawString(x, y, label.upper())
        return draw_paragraph(
            pdf, value or "—", x, y - 13, width, "Helvetica", 10, 13, INK, max_lines=max_lines
        ) - 8

    # Left column — delivery.
    y = section_heading("Delivery", margin, columns_top, column_width)
    y = field("Deliver on", _long_date(event.delivery_date), margin, y, column_width)
    if order.preferred_delivery_time:
        y = field("Preferred time", order.preferred_delivery_time.replace("_", " ").title(), margin, y, column_width)

    if is_request:
        # Area only. Enough to judge the drive, nothing that identifies anyone.
        y = field("Area", _delivery_area(order), margin, y, column_width)
        y = field(
            "Full address",
            "Released when you claim this delivery.",
            margin, y, column_width, max_lines=2,
        )
    else:
        y = field(
            "Recipient",
            _full_name(order.recipient_first_name, order.recipient_last_name),
            margin, y, column_width,
        )
        address_lines = _recipient_address(order)
        y = field("Address", "\n".join(address_lines) if address_lines else "—", margin, y, column_width, max_lines=5)
        if order.delivery_notes:
            y = field("Delivery notes", order.delivery_notes, margin, y, column_width, max_lines=5)

    # Right column — the brief.
    ry = section_heading("The brief", right_x, columns_top, column_width)
    ry = field("Occasion", order.get_occasion_display() if order.occasion else "Not specified", right_x, ry, column_width)
    ry = field("Flower preferences", order.flower_notes, right_x, ry, column_width, max_lines=8)

    if not is_request:
        # The florist writes the card, so they need to know who it is from. The
        # buyer's name is the one piece of customer detail on this sheet — no
        # contact details, and never on the request variant.
        ry = field(
            "Card from",
            _full_name(order.customer_first_name, order.customer_last_name),
            right_x, ry, column_width,
        )

    if event.message and not is_request:
        ry = field("Card message", f"“{event.message}”", right_x, ry, column_width, max_lines=6)

    # ---- Terms strip --------------------------------------------------------
    # Sits directly under whichever column runs longer, so a short brief does not
    # leave a hole in the middle of the page.
    qr_panel_height = 132
    qr_panel_y = margin + 26
    strip_height = 74  # fits three lines in the narrowest cell without touching the border
    strip_y = max(min(y, ry) - 18 - strip_height, qr_panel_y + qr_panel_height + 18)

    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.8)
    pdf.roundRect(margin, strip_y, content_width, strip_height, 8, fill=0, stroke=1)

    terms = [
        ("Deliver as you", "Your logo, your card, your name at the door — not ours."),
        ("We handle refunds", "Any complaint comes to us. We sort the refund or redelivery."),
        ("Match it, or decline", "Get as close to the preferences as you reasonably can. If you can't, decline."),
    ]
    cell_width = content_width / 3
    for index, (title, detail) in enumerate(terms):
        cell_x = margin + cell_width * index + 18
        if index:
            pdf.setStrokeColor(LINE)
            pdf.line(margin + cell_width * index, strip_y + 12, margin + cell_width * index, strip_y + strip_height - 12)
        pdf.setFont("Helvetica-Bold", 9.5)
        pdf.setFillColor(INK)
        pdf.drawString(cell_x, strip_y + strip_height - 25, title)
        draw_paragraph(
            pdf, detail, cell_x, strip_y + strip_height - 40, cell_width - 34,
            "Helvetica", 8, 10.5, MUTED,
        )

    # ---- QR panel -----------------------------------------------------------
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.8)
    pdf.roundRect(margin, qr_panel_y, content_width, qr_panel_height, 10, fill=1, stroke=1)

    # The QR sends the florist where they actually need to go next: an
    # unclaimed delivery is a pitch to a florist who may not have an account
    # yet, while a claimed one goes to someone who does and needs to manage it.
    if is_request:
        qr_url = settings.FLORIST_SIGNUP_URL
        qr_title = "Claim this delivery"
        qr_copy = (
            "Scan to claim it on your dashboard. First to claim gets it, and the full "
            "address and card message unlock straight away. New to Bloomprint? Set your "
            "own coverage, claim only the orders you want, and keep your own branding — "
            "no monthly fees, no penalties for passing."
        )
    else:
        qr_url = settings.FLORIST_LOGIN_URL
        qr_title = "Log in"
        qr_copy = (
            "This delivery is yours. Scan to log in, review the full details, and mark it "
            "delivered once it is done. Quote the reference above on your invoice."
        )

    qr_size = 96
    qr_x = margin + 20
    qr_y = qr_panel_y + (qr_panel_height - qr_size) / 2
    draw_qr(pdf, qr_url, qr_x, qr_y, qr_size)

    text_left = qr_x + qr_size + 22
    text_width = content_width - (text_left - margin) - 20
    ty = qr_panel_y + qr_panel_height - 34
    pdf.setFont(display, 16)
    pdf.setFillColor(INK)
    pdf.drawString(text_left, ty, qr_title)
    ty -= 18
    ty = draw_paragraph(pdf, qr_copy, text_left, ty, text_width, "Helvetica", 9, 12.5, BODY)
    pdf.setFont("Helvetica", 7.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(text_left, qr_panel_y + 16, qr_url)

    # ---- Footer -------------------------------------------------------------
    pdf.setFont("Helvetica", 7.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(margin, margin - 8, "Bloomprint — bloomprint.com.au")
    # The buyer's name appears on the claimed variant so the florist can sign
    # the card, but never their contact details, and never any internal ID:
    # this sheet goes to a third party.
    pdf.drawRightString(page_width - margin, margin - 8, f"Invoice against {event.reference}")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
