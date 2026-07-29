import stripe
from decimal import Decimal
from datetime import date, timedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from partners.models import (
    BusinessAccount, Commission, DeliveryRequest,
    Payout, PayoutLineItem,
)

stripe.api_key = settings.STRIPE_SECRET_KEY


class Command(BaseCommand):
    help = 'Process business account payouts via Stripe Connect'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['fulfillment', 'commission'],
            required=True,
            help='Type of payout to process',
        )

    def handle(self, *args, **options):
        payout_type = options['type']

        if payout_type == 'fulfillment':
            self.process_fulfillment_payouts()
        elif payout_type == 'commission':
            self.process_commission_payouts()

    def process_fulfillment_payouts(self):
        today = date.today()
        accounts = BusinessAccount.objects.filter(
            account_type='florist',
            stripe_connect_onboarding_complete=True,
        )

        for account in accounts:
            delivered_requests = DeliveryRequest.objects.filter(
                business_account=account,
                status='accepted',
                event__status='delivered',
            ).exclude(
                payout_line_item__isnull=False
            ).select_related('event', 'event__order')

            if not delivered_requests.exists():
                continue

            total_amount = Decimal('0')
            line_items_data = []

            for dr in delivered_requests:
                budget = getattr(dr.event.order, 'budget', Decimal('0'))
                total_amount += budget
                line_items_data.append({
                    'delivery_request': dr,
                    'amount': budget,
                    'description': f"Delivery for Event {dr.event_id} on {dr.event.delivery_date}",
                })

            if total_amount <= 0:
                continue

            with transaction.atomic():
                payout = Payout.objects.create(
                    business_account=account,
                    payout_type='fulfillment',
                    amount=total_amount,
                    status='processing',
                    period_start=today - timedelta(days=7),
                    period_end=today,
                )

                for item_data in line_items_data:
                    PayoutLineItem.objects.create(
                        payout=payout,
                        delivery_request=item_data['delivery_request'],
                        amount=item_data['amount'],
                        description=item_data['description'],
                    )

                try:
                    transfer = stripe.Transfer.create(
                        amount=int(total_amount * 100),
                        currency='usd',
                        destination=account.stripe_connect_account_id,
                        metadata={'payout_id': payout.id},
                    )
                    payout.stripe_transfer_id = transfer.id
                    payout.status = 'completed'
                    payout.save()
                    self.stdout.write(self.style.SUCCESS(
                        f"Fulfillment payout ${total_amount} to Business account {account.id} completed."
                    ))
                except stripe.error.StripeError as e:
                    payout.status = 'failed'
                    payout.note = str(e)
                    payout.save()
                    self.stdout.write(self.style.ERROR(
                        f"Fulfillment payout to Business account {account.id} failed: {e}"
                    ))

    def process_commission_payouts(self):
        today = date.today()
        accounts = BusinessAccount.objects.filter(
            stripe_connect_onboarding_complete=True,
        )

        for account in accounts:
            approved_commissions = Commission.objects.filter(
                business_account=account,
                status='approved',
            ).exclude(
                payout_line_item__isnull=False
            )

            if not approved_commissions.exists():
                continue

            total_amount = Decimal('0')
            line_items_data = []

            for commission in approved_commissions:
                total_amount += commission.amount
                line_items_data.append({
                    'commission': commission,
                    'amount': commission.amount,
                    'description': f"{commission.commission_type} commission #{commission.id}",
                })

            if total_amount <= 0:
                continue

            with transaction.atomic():
                payout = Payout.objects.create(
                    business_account=account,
                    payout_type='commission',
                    amount=total_amount,
                    status='processing',
                    period_start=today - timedelta(days=30),
                    period_end=today,
                )

                for item_data in line_items_data:
                    PayoutLineItem.objects.create(
                        payout=payout,
                        commission=item_data['commission'],
                        amount=item_data['amount'],
                        description=item_data['description'],
                    )

                try:
                    transfer = stripe.Transfer.create(
                        amount=int(total_amount * 100),
                        currency='usd',
                        destination=account.stripe_connect_account_id,
                        metadata={'payout_id': payout.id},
                    )
                    payout.stripe_transfer_id = transfer.id
                    payout.status = 'completed'
                    payout.save()

                    approved_commissions.update(status='paid')

                    self.stdout.write(self.style.SUCCESS(
                        f"Commission payout ${total_amount} to Business account {account.id} completed."
                    ))
                except stripe.error.StripeError as e:
                    payout.status = 'failed'
                    payout.note = str(e)
                    payout.save()
                    self.stdout.write(self.style.ERROR(
                        f"Commission payout to Business account {account.id} failed: {e}"
                    ))
