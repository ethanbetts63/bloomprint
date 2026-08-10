import pytest
from datetime import date, timedelta

from events.tests.factories.event_factory import EventFactory
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from partners.tests.factories.delivery_request_factory import DeliveryRequestFactory
from partners.utils.matching import (
    claimable_events_for_florist,
    eligible_florists_for_event,
    event_is_claimable,
    florist_covers_event,
    haversine_km,
)

# Rockingham WA and a point ~7km north of it.
ROCKINGHAM = (-32.2767, 115.7297)
NEARBY = (-32.2140, 115.7297)


def florist_at(lat, lng, radius_km=10, **kwargs):
    kwargs.setdefault('status', 'active')
    return BusinessAccountFactory(
        account_type='florist',
        latitude=lat, longitude=lng, service_radius_km=radius_km, **kwargs
    )


def event_at(lat, lng, **kwargs):
    defaults = {'delivery_date': date.today() + timedelta(days=5), 'status': 'scheduled'}
    defaults.update(kwargs)
    return EventFactory(order__latitude=lat, order__longitude=lng, **defaults)


class TestHaversine:
    def test_distance_between_known_points(self):
        distance = haversine_km(*ROCKINGHAM, *NEARBY)
        assert 6.5 < distance < 7.5

    def test_zero_distance_to_self(self):
        assert haversine_km(*ROCKINGHAM, *ROCKINGHAM) == pytest.approx(0, abs=0.001)


@pytest.mark.django_db
class TestEligibleFloristsForEvent:
    def test_florist_in_radius_is_eligible(self):
        florist = florist_at(*ROCKINGHAM, radius_km=10)
        event = event_at(*NEARBY)
        assert florist in eligible_florists_for_event(event)

    def test_florist_outside_radius_is_not_eligible(self):
        florist_at(*ROCKINGHAM, radius_km=5)
        event = event_at(*NEARBY)
        assert eligible_florists_for_event(event) == []

    def test_ungeocoded_order_matches_nobody(self):
        """The bug that made the old matcher a no-op: no coords must mean no match."""
        florist_at(*ROCKINGHAM, radius_km=500)
        event = EventFactory(order__latitude=None, order__longitude=None)
        assert eligible_florists_for_event(event) == []

    def test_pending_florist_is_not_eligible(self):
        florist_at(*ROCKINGHAM, status='pending')
        event = event_at(*ROCKINGHAM)
        assert eligible_florists_for_event(event) == []

    def test_affiliate_is_not_eligible(self):
        BusinessAccountFactory(
            account_type='affiliate', status='active',
            latitude=ROCKINGHAM[0], longitude=ROCKINGHAM[1],
        )
        event = event_at(*ROCKINGHAM)
        assert eligible_florists_for_event(event) == []

    def test_all_covering_florists_are_returned_not_just_nearest(self):
        """The whole point of the board: it is a fan-out, not a winner-take-all pick."""
        near = florist_at(*NEARBY, radius_km=10)
        far = florist_at(*ROCKINGHAM, radius_km=50)
        event = event_at(*NEARBY)
        eligible = eligible_florists_for_event(event)
        assert set(eligible) == {near, far}


@pytest.mark.django_db
class TestEventIsClaimable:
    def test_scheduled_future_unclaimed_event_is_claimable(self):
        assert event_is_claimable(event_at(*ROCKINGHAM)) is True

    def test_past_event_is_not_claimable(self):
        event = event_at(*ROCKINGHAM, delivery_date=date.today() - timedelta(days=1))
        assert event_is_claimable(event) is False

    def test_cancelled_event_is_not_claimable(self):
        assert event_is_claimable(event_at(*ROCKINGHAM, status='cancelled')) is False

    def test_already_claimed_event_is_not_claimable(self):
        event = event_at(*ROCKINGHAM)
        DeliveryRequestFactory(event=event, status='accepted')
        assert event_is_claimable(event) is False


@pytest.mark.django_db
class TestClaimableEventsForFlorist:
    def test_board_shows_event_in_radius(self):
        florist = florist_at(*ROCKINGHAM, radius_km=10)
        event = event_at(*NEARBY)
        assert event in claimable_events_for_florist(florist)

    def test_board_hides_event_outside_radius(self):
        florist = florist_at(*ROCKINGHAM, radius_km=5)
        event_at(*NEARBY)
        assert claimable_events_for_florist(florist) == []

    def test_board_hides_claimed_event(self):
        florist = florist_at(*ROCKINGHAM, radius_km=10)
        event = event_at(*NEARBY)
        DeliveryRequestFactory(event=event, status='accepted')
        assert claimable_events_for_florist(florist) == []

    def test_board_hides_ungeocoded_orders(self):
        florist = florist_at(*ROCKINGHAM, radius_km=500)
        EventFactory(order__latitude=None, order__longitude=None)
        assert claimable_events_for_florist(florist) == []

    def test_florist_without_coords_sees_nothing(self):
        florist = BusinessAccountFactory(
            account_type='florist', status='active', latitude=None, longitude=None
        )
        event_at(*ROCKINGHAM)
        assert claimable_events_for_florist(florist) == []

    def test_board_is_ordered_by_delivery_date(self):
        florist = florist_at(*ROCKINGHAM, radius_km=10)
        later = event_at(*ROCKINGHAM, delivery_date=date.today() + timedelta(days=20))
        sooner = event_at(*ROCKINGHAM, delivery_date=date.today() + timedelta(days=2))
        assert claimable_events_for_florist(florist) == [sooner, later]

    def test_matches_eligible_florists_from_the_other_direction(self):
        """The two predicates must agree, or florists get emails about invisible jobs."""
        florist = florist_at(*ROCKINGHAM, radius_km=10)
        event = event_at(*NEARBY)
        assert florist in eligible_florists_for_event(event)
        assert event in claimable_events_for_florist(florist)
        assert florist_covers_event(florist, event) is True
