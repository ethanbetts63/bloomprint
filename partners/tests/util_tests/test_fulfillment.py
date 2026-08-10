import pytest
from decimal import Decimal

from events.tests.factories.event_factory import EventFactory
from partners.models import Commission
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.utils.fulfillment import create_fulfillment_payable


def claimed_event(budget, **kwargs):
    event = EventFactory(order__budget=Decimal(budget), **kwargs)
    florist = BusinessAccountFactory(account_type='florist', status='active')
    DeliveryRequestFactory(event=event, business_account=florist, status='accepted')
    return event, florist


@pytest.fixture
def fixed_rates(settings):
    """Pin the money rules so the expected figures below cannot drift."""
    settings.FLORIST_COMMISSION_RATE = '0.10'
    settings.DELIVERY_INCLUDED_THRESHOLD = 65
    settings.DELIVERY_FEE = 20


@pytest.mark.django_db
@pytest.mark.usefixtures('fixed_rates')
class TestFulfillmentAmount:
    def test_pays_the_florist_total_not_the_customer_budget(self):
        """
        The bug this replaces paid `budget`, which gave away the whole
        commission above the delivery threshold and underpaid below it.
        """
        event, _ = claimed_event('100')

        commission = create_fulfillment_payable(event)

        # $100 budget, 10% commission, delivery included at/above $65.
        assert commission.amount == Decimal('90.00')
        assert commission.amount != event.order.budget

    def test_below_the_threshold_the_delivery_fee_is_added(self):
        """A $50 order owes $45 of flowers plus the $20 fee the brief promised."""
        event, _ = claimed_event('50')

        commission = create_fulfillment_payable(event)

        assert commission.amount == Decimal('65.00')

    def test_amount_matches_the_brief(self):
        """The florist must be paid exactly what the PDF told them."""
        event, _ = claimed_event('150')

        commission = create_fulfillment_payable(event)

        assert commission.amount == event.money_breakdown()['florist_total']


@pytest.mark.django_db
class TestFulfillmentPayable:
    def test_pays_the_florist_who_claimed_it(self):
        event, florist = claimed_event('100')

        commission = create_fulfillment_payable(event)

        assert commission.business_account == florist
        assert commission.commission_type == 'fulfillment'
        assert commission.status == 'pending'
        assert event.reference in commission.note

    def test_is_idempotent(self):
        """Both the florist and an admin can mark the same delivery delivered."""
        event, _ = claimed_event('100')

        first = create_fulfillment_payable(event)
        second = create_fulfillment_payable(event)

        assert first.pk == second.pk
        assert Commission.objects.filter(event=event, commission_type='fulfillment').count() == 1

    def test_unclaimed_event_creates_nothing(self):
        event = EventFactory(order__budget=Decimal('100'))

        assert create_fulfillment_payable(event) is None
        assert not Commission.objects.filter(event=event).exists()
