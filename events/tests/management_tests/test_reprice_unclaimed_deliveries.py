import pytest
from decimal import Decimal
from io import StringIO

from django.core.management import call_command

from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory


@pytest.fixture
def rate_5(settings):
    settings.FLORIST_COMMISSION_RATE = '0.05'
    settings.DELIVERY_INCLUDED_THRESHOLD = 65
    settings.DELIVERY_FEE = 20


def priced_at_old_rate(status='scheduled'):
    """An event snapshotted when the rate was 10%."""
    event = EventFactory(status=status, order__budget=Decimal('100'))
    event.platform_commission = Decimal('10.00')
    event.florist_budget = Decimal('90.00')
    event.save(update_fields=['platform_commission', 'florist_budget'])
    return event


def run(*args):
    out = StringIO()
    call_command('reprice_unclaimed_deliveries', *args, stdout=out)
    return out.getvalue()


@pytest.mark.django_db
@pytest.mark.usefixtures('rate_5')
class TestRepriceUnclaimedDeliveries:
    def test_reprices_an_unclaimed_delivery(self):
        event = priced_at_old_rate()

        run()

        event.refresh_from_db()
        assert event.platform_commission == Decimal('5.00')
        assert event.florist_budget == Decimal('95.00')

    def test_leaves_a_claimed_delivery_alone(self):
        """The florist accepted the job on the figure it already carries."""
        event = priced_at_old_rate(status='claimed')
        DeliveryRequestFactory(
            event=event,
            business_account=BusinessAccountFactory(account_type='florist'),
            status='accepted',
        )

        run()

        event.refresh_from_db()
        assert event.platform_commission == Decimal('10.00')
        assert event.florist_budget == Decimal('90.00')

    def test_leaves_a_delivered_delivery_alone(self):
        event = priced_at_old_rate(status='delivered')

        run()

        event.refresh_from_db()
        assert event.florist_budget == Decimal('90.00')

    def test_dry_run_writes_nothing(self):
        event = priced_at_old_rate()

        output = run('--dry-run')

        event.refresh_from_db()
        assert event.florist_budget == Decimal('90.00')
        assert 'Dry run' in output

    def test_reports_the_net_change_to_florists(self):
        priced_at_old_rate()

        output = run('--dry-run')

        # 5% instead of 10% on a $100 budget hands the florist $5 more.
        assert '$5.00 more' in output

    def test_is_idempotent(self):
        event = priced_at_old_rate()

        run()
        second = run()

        event.refresh_from_db()
        assert event.florist_budget == Decimal('95.00')
        assert 'already priced at the current rate' in second

    def test_skips_an_order_with_no_budget(self):
        EventFactory(status='scheduled', order__budget=None)

        assert 'already priced' in run()

    def test_respects_limit(self):
        first = priced_at_old_rate()
        second = priced_at_old_rate()

        run('--limit', '1')

        first.refresh_from_db()
        second.refresh_from_db()
        repriced = [e for e in (first, second) if e.florist_budget == Decimal('95.00')]
        assert len(repriced) == 1
