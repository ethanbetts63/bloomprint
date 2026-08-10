from decimal import Decimal

from django.core.management.base import BaseCommand

from events.models import Event
from events.utils.fee_calc import (
    calculate_florist_commission,
    calculate_florist_payout,
    commission_rate_label,
)


class Command(BaseCommand):
    help = (
        'Re-prices unclaimed deliveries at the current FLORIST_COMMISSION_RATE. '
        'Only touches events still on the claim board — anything a florist has '
        'claimed keeps the figures it was promised.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would change without writing anything.',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Maximum number of deliveries to re-price.',
        )

    def handle(self, *args, **options):
        # 'scheduled' is the whole safety condition. A claimed or delivered
        # event carries a figure a florist accepted the job on, and a rate
        # change must never rewrite that. An unclaimed one has promised nobody
        # anything, so it should quote the rate that is actually in force.
        queryset = (
            Event.objects
            .filter(status='scheduled')
            .select_related('order')
            .order_by('delivery_date', 'id')
        )
        if options['limit']:
            queryset = queryset[:options['limit']]

        rate = commission_rate_label()
        self.stdout.write(f'Current commission rate: {rate}')

        changed = []
        for event in queryset:
            budget = event.order.budget
            if not budget:
                continue

            new_commission = calculate_florist_commission(budget)
            new_florist_budget = calculate_florist_payout(budget)
            if (event.platform_commission == new_commission
                    and event.florist_budget == new_florist_budget):
                continue

            changed.append({
                'event': event,
                'old_florist': event.florist_budget,
                'new_florist': new_florist_budget,
                'old_commission': event.platform_commission,
                'new_commission': new_commission,
            })

        if not changed:
            self.stdout.write(self.style.SUCCESS(
                'Every unclaimed delivery is already priced at the current rate.'
            ))
            return

        for row in changed:
            event = row['event']
            self.stdout.write(
                f"  {event.reference}  florist {row['old_florist']} -> {row['new_florist']}"
                f"   our cut {row['old_commission']} -> {row['new_commission']}"
            )

        delta = sum(
            (row['new_florist'] or Decimal('0')) - (row['old_florist'] or Decimal('0'))
            for row in changed
        )
        direction = 'more' if delta > 0 else 'less'
        self.stdout.write(
            f'{len(changed)} unclaimed deliveries would change. '
            f'Net ${abs(delta)} {direction} payable to florists.'
        )

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('Dry run - nothing was written.'))
            return

        for row in changed:
            event = row['event']
            event.platform_commission = row['new_commission']
            event.florist_budget = row['new_florist']
            event.save(update_fields=['platform_commission', 'florist_budget', 'updated_at'])

        self.stdout.write(self.style.SUCCESS(f'Re-priced {len(changed)} unclaimed deliveries at {rate}.'))
        self.stdout.write(self.style.WARNING(
            'Fan-out emails already sent quote the old figure. The claim board, '
            'the job sheet and any new brief now show the new one.'
        ))
