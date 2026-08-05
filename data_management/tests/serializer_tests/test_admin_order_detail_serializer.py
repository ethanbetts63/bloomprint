import pytest
from data_management.serializers.admin_order_detail_serializer import AdminOrderDetailSerializer
from events.tests.factories.order_factory import OrderFactory
from events.tests.factories.event_factory import EventFactory

@pytest.mark.django_db
def test_admin_order_detail_serializer_one_time_order():
    """
    Test that AdminOrderDetailSerializer correctly serializes a one-time order.
    """
    plan = OrderFactory(billing_mode='one_time', budget=50.00, flower_notes="No lilies")

    # Create associated events
    event1 = EventFactory(order=plan, delivery_date="2023-01-01", status="delivered")
    event2 = EventFactory(order=plan, delivery_date="2023-02-01", status="scheduled")

    serializer = AdminOrderDetailSerializer(plan)
    data = serializer.data

    assert data['id'] == plan.id
    assert data['order_type'] == 'one_time'
    assert data['flower_notes'] == "No lilies"
    assert len(data['events']) == 2
    # Check ordering of events
    assert data['events'][0]['id'] == event1.id
    assert data['events'][1]['id'] == event2.id
    assert float(data['budget']) == 50.00

@pytest.mark.django_db
def test_admin_order_detail_serializer_recurring_order():
    """
    Test that AdminOrderDetailSerializer correctly serializes a recurring order.
    """
    plan = OrderFactory(billing_mode='recurring', budget=75.00)

    serializer = AdminOrderDetailSerializer(plan)
    data = serializer.data

    assert data['id'] == plan.id
    assert data['order_type'] == 'recurring'
    assert float(data['budget']) == 75.00
