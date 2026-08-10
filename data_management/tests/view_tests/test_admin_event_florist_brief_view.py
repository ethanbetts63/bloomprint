import pytest
from decimal import Decimal

from rest_framework.test import APIClient

from events.tests.factories.event_factory import EventFactory
from events.tests.factories.order_factory import OrderFactory
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestAdminEventFloristBriefView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def _url(self, event_id):
        return f'/api/data/admin/events/{event_id}/florist-brief/'

    def test_returns_a_pdf(self):
        event = EventFactory()
        response = self.client.get(self._url(event.id))

        assert response.status_code == 200
        assert response['Content-Type'] == 'application/pdf'
        assert response.content.startswith(b'%PDF-')

    def test_served_as_a_download_named_by_reference(self):
        event = EventFactory()
        response = self.client.get(self._url(event.id))

        disposition = response['Content-Disposition']
        assert disposition.startswith('attachment;')
        assert event.reference.lower() in disposition

    def test_shows_the_reference_and_not_the_primary_key(self):
        """The sheet must never reveal how many deliveries Bloomprint has done."""
        from pypdf import PdfReader
        from io import BytesIO

        order = OrderFactory(budget=Decimal('140.00'))
        event = EventFactory(order=order, reference='BP-ZZZZZZ')
        response = self.client.get(self._url(event.id))

        text = PdfReader(BytesIO(response.content)).pages[0].extract_text()
        assert 'BP-ZZZZZZ' in text
        assert 'DELIVERY #' not in text.upper()
        assert f'Order #{order.pk}' not in text

    def test_shows_the_florist_money_not_just_the_customer_budget(self):
        from pypdf import PdfReader
        from io import BytesIO

        order = OrderFactory(budget=Decimal('140.00'))
        event = EventFactory(order=order)
        response = self.client.get(self._url(event.id))

        text = PdfReader(BytesIO(response.content)).pages[0].extract_text()
        assert '$126.00' in text   # what the florist has to spend
        assert '$140.00' in text   # the customer's budget, shown for transparency
        assert '$14.00' in text    # Bloomprint's commission

    def test_requires_admin(self):
        event = EventFactory()
        self.client.force_authenticate(user=UserFactory(is_staff=False))
        response = self.client.get(self._url(event.id))

        assert response.status_code == 403

    def test_requires_authentication(self):
        event = EventFactory()
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url(event.id))

        assert response.status_code in (401, 403)

    def test_unknown_event_returns_404(self):
        response = self.client.get(self._url(999999))
        assert response.status_code == 404

    def test_renders_when_the_optional_brief_fields_are_empty(self):
        """A bare order must still produce a printable page, not a 500."""
        order = OrderFactory(
            budget=Decimal('80.00'), occasion=None, flower_notes=None,
            delivery_notes=None, preferred_delivery_time=None,
        )
        event = EventFactory(order=order, message=None)
        response = self.client.get(self._url(event.id))

        assert response.status_code == 200
        assert response.content.startswith(b'%PDF-')

    def test_renders_when_the_order_has_no_budget(self):
        order = OrderFactory(budget=None)
        event = EventFactory(order=order)
        response = self.client.get(self._url(event.id))

        assert response.status_code == 200
        assert response.content.startswith(b'%PDF-')

    def test_does_not_leak_the_customer_email_into_the_pdf(self):
        """The sheet is handed to a third party, so it carries the recipient only."""
        order = OrderFactory(customer_email='buyer@example.com')
        event = EventFactory(order=order)
        response = self.client.get(self._url(event.id))

        assert b'buyer@example.com' not in response.content
