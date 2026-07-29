import math
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from events.models import Event
from partners.models import BusinessAccount, DeliveryRequest
from partners.utils.reassignment import reassign_delivery_request, haversine_km


class Command(BaseCommand):
    help = 'Process delivery notifications: create requests, send reminders, handle expirations'

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.date()

        target_date_14 = today + timedelta(days=14)
        events_needing_request = Event.objects.filter(
            delivery_date=target_date_14,
            status='scheduled',
        ).exclude(
            delivery_requests__isnull=False
        ).select_related('order')

        for event in events_needing_request:
            order = event.order

            delivery_lat = getattr(order, 'latitude', None)
            delivery_lng = getattr(order, 'longitude', None)

            if delivery_lat is None or delivery_lng is None:
                self.stdout.write(self.style.WARNING(
                    f"Event {event.id} order has no coordinates. Skipping."
                ))
                continue

            chosen_account = None

            referred_affiliate = order.referred_by_affiliate
            if (referred_affiliate and referred_affiliate.account_type == 'florist'
                    and referred_affiliate.status == 'active'
                    and referred_affiliate.latitude is not None
                    and referred_affiliate.longitude is not None):
                distance = haversine_km(
                    delivery_lat, delivery_lng,
                    referred_affiliate.latitude, referred_affiliate.longitude
                )
                if distance <= referred_affiliate.service_radius_km:
                    chosen_account = referred_affiliate

            if not chosen_account:
                candidates = BusinessAccount.objects.filter(
                    account_type='florist',
                    status='active',
                    latitude__isnull=False,
                    longitude__isnull=False,
                )
                best_distance = float('inf')
                for account in candidates:
                    distance = haversine_km(
                        delivery_lat, delivery_lng,
                        account.latitude, account.longitude
                    )
                    if distance <= account.service_radius_km and distance < best_distance:
                        chosen_account = account
                        best_distance = distance

            if not chosen_account:
                self.stdout.write(self.style.WARNING(
                    f"No delivery account found for Event {event.id}. Flagging for admin."
                ))
                continue

            expires_at = timezone.make_aware(
                timezone.datetime.combine(event.delivery_date, timezone.datetime.min.time())
            ) - timedelta(hours=48)

            dr = DeliveryRequest.objects.create(
                event=event,
                business_account=chosen_account,
                first_notified_at=now,
                expires_at=expires_at,
            )
            self.stdout.write(self.style.SUCCESS(
                f"Created DeliveryRequest {dr.id} for Event {event.id} → Business account {chosen_account.id}"
            ))

        target_date_7 = today + timedelta(days=7)
        pending_requests_7 = DeliveryRequest.objects.filter(
            status='pending',
            event__delivery_date=target_date_7,
            first_notified_at__isnull=False,
            second_notified_at__isnull=True,
        )

        for dr in pending_requests_7:
            dr.second_notified_at = now
            dr.save()
            self.stdout.write(self.style.SUCCESS(
                f"Sent second notification for DeliveryRequest {dr.id}"
            ))

        expired_requests = DeliveryRequest.objects.filter(
            status='pending',
            expires_at__lt=now,
        )

        for dr in expired_requests:
            dr.status = 'expired'
            dr.save()
            self.stdout.write(self.style.WARNING(
                f"DeliveryRequest {dr.id} expired. Triggering reassignment."
            ))
            reassign_delivery_request(dr.event, excluded_business_account_ids=[dr.business_account_id])

        self.stdout.write(self.style.SUCCESS('Delivery notifications processed successfully.'))
