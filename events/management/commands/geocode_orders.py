from django.core.management.base import BaseCommand

from events.models import Order
from events.utils.geocoding import geocode_order


class Command(BaseCommand):
    help = (
        'Geocodes orders that have no coordinates. Orders without coordinates '
        'cannot be matched to a florist, so they never reach the claim board.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Maximum number of orders to geocode in this run.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Re-geocode every order, including ones that already have coordinates.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would be geocoded without calling Nominatim or writing.',
        )

    def handle(self, *args, **options):
        queryset = Order.objects.all()
        if not options['all']:
            queryset = queryset.filter(latitude__isnull=True)
        queryset = queryset.order_by('id')

        if options['limit']:
            queryset = queryset[:options['limit']]

        total = queryset.count()
        if not total:
            self.stdout.write(self.style.SUCCESS('No orders need geocoding.'))
            return

        # Nominatim allows one request per second and geocode_order sleeps to
        # honour that, so a large backfill is slow by design. Say so up front
        # rather than looking hung.
        self.stdout.write(
            f'Geocoding {total} order(s). Rate limited to ~1/second, so this will '
            f'take roughly {total * 1.1 / 60:.1f} minutes.'
        )

        if options['dry_run']:
            for order in queryset:
                self.stdout.write(f'  would geocode Order {order.id}: {self._describe(order)}')
            return

        street_hits = suburb_hits = failures = 0

        for order in queryset:
            precision = geocode_order(order)
            if precision == 'street':
                street_hits += 1
                self.stdout.write(f'  Order {order.id}: {order.latitude}, {order.longitude} (street)')
            elif precision == 'suburb':
                suburb_hits += 1
                self.stdout.write(self.style.WARNING(
                    f'  Order {order.id}: {order.latitude}, {order.longitude} (suburb fallback)'
                ))
            else:
                failures += 1
                self.stdout.write(self.style.ERROR(
                    f'  Order {order.id}: FAILED — {self._describe(order)}'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'Done. {street_hits} exact, {suburb_hits} suburb fallback, {failures} failed.'
        ))
        if failures:
            self.stdout.write(self.style.WARNING(
                f'{failures} order(s) still have no coordinates and will not reach any '
                f'florist. Check their addresses.'
            ))

    def _describe(self, order):
        parts = [
            order.recipient_street_address, order.recipient_suburb,
            order.recipient_state, order.recipient_postcode,
        ]
        return ', '.join(part for part in parts if part) or '(no address)'
