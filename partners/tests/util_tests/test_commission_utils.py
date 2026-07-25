import pytest
from decimal import Decimal
from partners.utils.commission_utils import process_referral_commission, get_referral_commission_amount
from partners.models import Commission
from partners.tests.factories.partner_factory import PartnerFactory
from users.tests.factories.user_factory import UserFactory
from payments.tests.factories.payment_factory import PaymentFactory
from events.tests.factories.order_factory import OrderFactory

@pytest.mark.django_db
class TestCommissionUtils:
    def test_process_referral_commission_success(self):
        partner = PartnerFactory(partner_type='non_delivery')
        plan = OrderFactory(
            billing_mode='one_time', user=None, budget=75,
            referred_by_partner=partner, customer_email='c@example.com',
        )
        payment = PaymentFactory(user=None, order=plan, status='succeeded')

        process_referral_commission(payment)

        commission = Commission.objects.get(payment=payment)
        assert commission.partner == partner
        assert commission.amount == Decimal('5')
        assert commission.commission_type == 'referral'

    def test_process_referral_commission_no_partner(self):
        plan = OrderFactory(
            billing_mode='one_time', user=None, budget=100,
            referred_by_partner=None, customer_email='c@example.com',
        )
        payment = PaymentFactory(user=None, order=plan, status='succeeded')

        process_referral_commission(payment)
        assert Commission.objects.count() == 0

    def test_process_referral_commission_delivery_partner_skipped(self):
        partner = PartnerFactory(partner_type='delivery')
        plan = OrderFactory(
            billing_mode='one_time', user=None, budget=100,
            referred_by_partner=partner, customer_email='c@example.com',
        )
        payment = PaymentFactory(user=None, order=plan, status='succeeded')

        process_referral_commission(payment)
        assert Commission.objects.count() == 0

    def test_process_referral_commission_limit_exceeded(self):
        partner = PartnerFactory(partner_type='non_delivery')
        plan = OrderFactory(
            billing_mode='one_time', user=None, budget=100,
            referred_by_partner=partner, customer_email='c@example.com',
        )

        # Three previous succeeded payments on orders sharing this email.
        for _ in range(3):
            prior = OrderFactory(user=None, budget=100, customer_email='c@example.com')
            PaymentFactory(user=None, order=prior, status='succeeded')

        # 4th succeeded payment
        payment = PaymentFactory(user=None, order=plan, status='succeeded')

        process_referral_commission(payment)
        assert Commission.objects.count() == 0


@pytest.mark.django_db
class TestReferralCommissionTiers:
    def test_budget_under_100(self):
        assert get_referral_commission_amount(Decimal('50')) == Decimal('5')
        assert get_referral_commission_amount(Decimal('99.99')) == Decimal('5')

    def test_budget_under_150(self):
        assert get_referral_commission_amount(Decimal('100')) == Decimal('10')
        assert get_referral_commission_amount(Decimal('149.99')) == Decimal('10')

    def test_budget_under_200(self):
        assert get_referral_commission_amount(Decimal('150')) == Decimal('15')
        assert get_referral_commission_amount(Decimal('199.99')) == Decimal('15')

    def test_budget_under_250(self):
        assert get_referral_commission_amount(Decimal('200')) == Decimal('20')
        assert get_referral_commission_amount(Decimal('249.99')) == Decimal('20')

    def test_budget_250_and_above(self):
        assert get_referral_commission_amount(Decimal('250')) == Decimal('25')
        assert get_referral_commission_amount(Decimal('500')) == Decimal('25')

    def test_tiered_commission_applied_to_payment(self):
        partner = PartnerFactory(partner_type='non_delivery')
        plan = OrderFactory(
            billing_mode='one_time', user=None, budget=175,
            referred_by_partner=partner, customer_email='c@example.com',
        )
        payment = PaymentFactory(user=None, order=plan, status='succeeded')

        process_referral_commission(payment)

        commission = Commission.objects.get(payment=payment)
        assert commission.amount == Decimal('15')
