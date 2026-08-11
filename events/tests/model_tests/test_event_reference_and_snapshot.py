import pytest
from decimal import Decimal

from events.models import Event
from events.tests.factories.event_factory import EventFactory
from events.tests.factories.order_factory import OrderFactory
from events.utils.reference import ALPHABET, generate_reference, generate_unique_reference


class TestGenerateReference:
    def test_has_the_expected_shape(self):
        reference = generate_reference()
        prefix, _, body = reference.partition('-')
        assert prefix == 'BP'
        assert len(body) == 6

    def test_uses_only_unambiguous_characters(self):
        """No 0/O, 1/I/L or U, so a reference cannot be misread off a printed sheet."""
        for _ in range(200):
            body = generate_reference().split('-')[1]
            assert set(body) <= set(ALPHABET)
            assert not (set(body) & set('01OILU'))

    def test_is_not_sequential(self):
        references = {generate_reference() for _ in range(500)}
        assert len(references) > 490


@pytest.mark.django_db
class TestEventReference:
    def test_reference_is_generated_on_creation(self):
        event = EventFactory()
        assert event.reference
        assert event.reference.startswith('BP-')

    def test_references_are_unique_across_events(self):
        references = {EventFactory().reference for _ in range(15)}
        assert len(references) == 15

    def test_reference_is_stable_across_saves(self):
        event = EventFactory()
        original = event.reference
        event.status = 'ordered'
        event.save()
        event.refresh_from_db()
        assert event.reference == original

    def test_an_explicit_reference_is_respected(self):
        event = EventFactory(reference='BP-TESTME')
        assert event.reference == 'BP-TESTME'

    def test_unique_generator_avoids_a_taken_reference(self, mocker):
        EventFactory(reference='BP-AAAAAA')
        mocker.patch(
            'events.utils.reference.generate_reference',
            side_effect=['BP-AAAAAA', 'BP-BBBBBB'],
        )
        assert generate_unique_reference(Event) == 'BP-BBBBBB'


@pytest.fixture
def rate_10(settings):
    """
    Pin the rate at 10%.

    These assert the snapshot holds specific figures, so they must not move when
    the business rate is changed — the point being tested is that the snapshot
    freezes, not what it freezes to.
    """
    settings.FLORIST_COMMISSION_RATE = '0.10'


@pytest.mark.django_db
@pytest.mark.usefixtures('rate_10')
class TestEventMoneySnapshot:
    def test_snapshots_the_florist_money_at_creation(self):
        order = OrderFactory(budget=Decimal('140.00'), status='active')
        event = EventFactory(order=order)

        assert event.platform_commission == Decimal('14.00')
        assert event.florist_budget == Decimal('126.00')

    def test_florist_total_adds_the_delivery_fee(self):
        # Below the threshold, so a delivery fee is charged on top.
        order = OrderFactory(budget=Decimal('60.00'))
        event = EventFactory(order=order)

        assert event.florist_budget == Decimal('54.00')
        assert event.delivery_fee == Decimal('20.00')
        assert event.florist_total == Decimal('74.00')

    def test_delivery_fee_is_zero_when_absorbed_by_the_budget(self):
        order = OrderFactory(budget=Decimal('120.00'))
        event = EventFactory(order=order)

        assert event.delivery_fee == Decimal('0.00')
        assert event.florist_total == event.florist_budget

    def test_snapshot_does_not_move_when_the_order_budget_changes(self):
        """A florist was promised a figure; repricing the order must not rewrite it."""
        order = OrderFactory(budget=Decimal('140.00'), status='pending_payment')
        event = EventFactory(order=order)

        order.budget = Decimal('300.00')
        order.save()
        event.refresh_from_db()

        assert event.florist_budget == Decimal('126.00')

    def test_handles_an_order_with_no_budget(self):
        order = OrderFactory(budget=None)
        event = EventFactory(order=order)

        assert event.florist_budget == Decimal('0.00')
        assert event.platform_commission == Decimal('0.00')
        assert event.florist_total == Decimal('0.00')
