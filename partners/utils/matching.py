"""
Distance matching between orders and florists.

One predicate, read from both ends: `eligible_florists_for_event` powers the
fan-out when an order is paid for, and `claimable_events_for_florist` powers the
claim board. They must agree — a florist who receives the email and then can't
see the order on their board is worse than no email at all.
"""
import math
from datetime import date

from django.db.models import Q

from partners.models import BusinessAccount, DeliveryRequest

EARTH_RADIUS_KM = 6371

# No florist serves a radius larger than this, so the bounding-box prefilter can
# never exclude a genuine match. Enforced by BusinessAccount.service_radius_km's
# own max of 500 in the registration serializer.
MAX_SERVICE_RADIUS_KM = 500


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points on Earth, in kilometres."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _degree_box(latitude, longitude, radius_km):
    """
    Lat/lng bounds that fully contain a radius_km circle around a point.

    Haversine can't run in SQL, so this narrows the candidate set in the
    database before the exact test runs in Python. It over-selects at the
    corners, which is fine — the haversine pass rejects those.
    """
    lat_delta = radius_km / 111.0
    # Longitude degrees shrink toward the poles. Clamp the cosine so a point
    # near a pole widens the box instead of dividing by ~zero.
    cos_lat = max(math.cos(math.radians(latitude)), 0.01)
    lng_delta = radius_km / (111.0 * cos_lat)
    return (
        latitude - lat_delta, latitude + lat_delta,
        longitude - lng_delta, longitude + lng_delta,
    )


def event_is_claimable(event):
    """An event is claimable while it is scheduled, future-dated, and unclaimed."""
    if event.status != 'scheduled':
        return False
    if event.delivery_date < date.today():
        return False
    return not DeliveryRequest.objects.filter(event=event, status='accepted').exists()


def eligible_florists_for_event(event):
    """
    Active florists whose service area covers this event's delivery address.

    Returns [] when the order has no coordinates — an ungeocoded address is
    unmatchable, and silently returning every florist would be worse.
    """
    order = event.order
    if order.latitude is None or order.longitude is None:
        return []

    min_lat, max_lat, min_lng, max_lng = _degree_box(
        order.latitude, order.longitude, MAX_SERVICE_RADIUS_KM
    )

    candidates = BusinessAccount.objects.filter(
        account_type='florist',
        status='active',
        latitude__isnull=False,
        longitude__isnull=False,
        latitude__gte=min_lat, latitude__lte=max_lat,
        longitude__gte=min_lng, longitude__lte=max_lng,
    )

    return [
        florist for florist in candidates
        if haversine_km(order.latitude, order.longitude,
                        florist.latitude, florist.longitude) <= florist.service_radius_km
    ]


def florist_covers_event(florist, event):
    """Whether this one florist's service area covers this one event."""
    order = event.order
    if order.latitude is None or order.longitude is None:
        return False
    if florist.latitude is None or florist.longitude is None:
        return False
    distance = haversine_km(
        order.latitude, order.longitude, florist.latitude, florist.longitude
    )
    return distance <= florist.service_radius_km


def claimable_events_for_florist(florist):
    """
    Unclaimed, future, scheduled events inside this florist's service area.

    Returns a list rather than a queryset: the radius test is Python-side, so
    it cannot be expressed as a filter. Callers paginate the list.
    """
    from events.models import Event

    if florist.latitude is None or florist.longitude is None:
        return []

    min_lat, max_lat, min_lng, max_lng = _degree_box(
        florist.latitude, florist.longitude, florist.service_radius_km
    )

    claimed_event_ids = DeliveryRequest.objects.filter(
        status='accepted'
    ).values_list('event_id', flat=True)

    candidates = Event.objects.filter(
        status='scheduled',
        delivery_date__gte=date.today(),
        order__latitude__isnull=False,
        order__longitude__isnull=False,
        order__latitude__gte=min_lat, order__latitude__lte=max_lat,
        order__longitude__gte=min_lng, order__longitude__lte=max_lng,
    ).exclude(
        Q(id__in=claimed_event_ids)
    ).select_related('order').order_by('delivery_date', 'id')

    return [event for event in candidates if florist_covers_event(florist, event)]
