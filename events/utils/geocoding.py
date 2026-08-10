"""
Address geocoding via Nominatim (OpenStreetMap).

Nominatim is free and needs no key, which is why it is used here rather than a
paid provider. The trade is its usage policy, which this module is built to
respect: at most one request per second, and a User-Agent that identifies the
application with a contact address. Ignoring either gets the server's IP
blocked, so the rate limit is enforced here rather than left to callers.

Coordinates matter because florist matching is purely a distance test. An order
without them can never reach a florist, so a geocode failure is worth surfacing
to an admin rather than swallowing.
"""
import logging
import threading
import time

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
REQUEST_TIMEOUT_SECONDS = 10

# Nominatim's usage policy allows one request per second. A little headroom
# keeps clock jitter from turning into a violation.
MIN_SECONDS_BETWEEN_REQUESTS = 1.1

_rate_limit_lock = threading.Lock()
_last_request_at = 0.0


def _user_agent():
    """
    Nominatim requires a User-Agent identifying the app, with a contact address.
    A generic one (or requests' default) is grounds for being blocked.
    """
    contact = getattr(settings, 'ADMIN_EMAIL', None)
    return f'BloomPrint/1.0 ({contact})'


def _throttled_get(params):
    """Serialises calls across threads so the one-per-second policy holds."""
    global _last_request_at

    with _rate_limit_lock:
        elapsed = time.monotonic() - _last_request_at
        if elapsed < MIN_SECONDS_BETWEEN_REQUESTS:
            time.sleep(MIN_SECONDS_BETWEEN_REQUESTS - elapsed)

        try:
            response = requests.get(
                NOMINATIM_URL,
                params={**params, 'format': 'jsonv2', 'limit': 1},
                headers={'User-Agent': _user_agent()},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        finally:
            _last_request_at = time.monotonic()

    response.raise_for_status()
    return response.json()


def _query(params):
    """Returns (lat, lng) for the first result, or None."""
    # Drop empty values: Nominatim treats an empty component as a real
    # constraint and will fail to match rather than ignore it.
    params = {key: value for key, value in params.items() if value}
    if not params:
        return None

    try:
        results = _throttled_get(params)
    except requests.RequestException as exc:
        logger.warning("Nominatim request failed for %s: %s", params, exc)
        return None
    except ValueError as exc:
        logger.warning("Nominatim returned invalid JSON for %s: %s", params, exc)
        return None

    if not results:
        return None

    try:
        return float(results[0]['lat']), float(results[0]['lon'])
    except (KeyError, TypeError, ValueError) as exc:
        logger.warning("Nominatim result missing usable coordinates for %s: %s", params, exc)
        return None


def geocode_address(street=None, suburb=None, city=None, state=None, postcode=None, country=None):
    """
    Resolves an address to (latitude, longitude, precision), or None.

    Tries the full street address first. If that misses — a new estate, a unit
    number Nominatim doesn't hold, a typo — it retries with only the suburb,
    which almost always resolves. A suburb centroid is precise to a few hundred
    metres, which is immaterial against service radii measured in kilometres,
    and far better than no coordinates at all.

    `precision` is 'street' or 'suburb', so callers can tell an exact match from
    a fallback.
    """
    country = country or 'Australia'
    locality = suburb or city

    if street:
        coords = _query({
            'street': street,
            'city': locality,
            'state': state,
            'postalcode': postcode,
            'country': country,
        })
        if coords:
            return coords[0], coords[1], 'street'

    # Fall back to the suburb. Postcode is included because AU suburb names
    # repeat across states, and dropped from the retry below if it is the thing
    # preventing a match.
    if locality or postcode:
        coords = _query({
            'city': locality,
            'state': state,
            'postalcode': postcode,
            'country': country,
        })
        if coords:
            return coords[0], coords[1], 'suburb'

        coords = _query({'city': locality, 'state': state, 'country': country})
        if coords:
            return coords[0], coords[1], 'suburb'

    logger.warning(
        "Could not geocode address: street=%r suburb=%r city=%r state=%r postcode=%r country=%r",
        street, suburb, city, state, postcode, country,
    )
    return None


def geocode_order(order, save=True):
    """
    Geocodes an order's recipient address onto order.latitude/longitude.

    Returns the precision string on success, None on failure. Never raises: a
    geocode failure must not take down a checkout or abort a backfill run.
    """
    result = geocode_address(
        street=order.recipient_street_address,
        suburb=order.recipient_suburb,
        city=order.recipient_city,
        state=order.recipient_state,
        postcode=order.recipient_postcode,
        country=order.recipient_country,
    )
    if result is None:
        return None

    latitude, longitude, precision = result
    order.latitude = latitude
    order.longitude = longitude
    if save:
        order.save(update_fields=['latitude', 'longitude', 'updated_at'])
    return precision
