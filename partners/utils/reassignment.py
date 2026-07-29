import math
from django.utils import timezone
from datetime import timedelta
from partners.models import BusinessAccount, DeliveryRequest


def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points on Earth in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def reassign_delivery_request(event, excluded_business_account_ids=None):
    if excluded_business_account_ids is None:
        excluded_business_account_ids = []

    existing_business_account_ids = DeliveryRequest.objects.filter(
        event=event
    ).values_list('business_account_id', flat=True)
    all_excluded = set(excluded_business_account_ids) | set(existing_business_account_ids)

    order = event.order
    delivery_lat = getattr(order, 'latitude', None)
    delivery_lng = getattr(order, 'longitude', None)

    if delivery_lat is None or delivery_lng is None:
        print(f"WARNING: Event {event.id} order has no coordinates. Cannot match delivery account.")
        return None

    candidates = BusinessAccount.objects.filter(
        account_type='florist',
        status='active',
        latitude__isnull=False,
        longitude__isnull=False,
    ).exclude(id__in=all_excluded)

    best_account = None
    best_distance = float('inf')

    for account in candidates:
        distance = haversine_km(delivery_lat, delivery_lng, account.latitude, account.longitude)
        if distance <= account.service_radius_km and distance < best_distance:
            best_account = account
            best_distance = distance

    if not best_account:
        print(f"WARNING: No available delivery account for Event {event.id}. Flagging for admin.")
        return None

    expires_at = timezone.make_aware(
        timezone.datetime.combine(event.delivery_date, timezone.datetime.min.time())
    ) - timedelta(hours=48)

    dr = DeliveryRequest.objects.create(
        event=event,
        business_account=best_account,
        first_notified_at=timezone.now(),
        expires_at=expires_at,
    )

    print(f"Reassigned Event {event.id} to Business account {best_account.id} (DeliveryRequest {dr.id})")
    return dr
