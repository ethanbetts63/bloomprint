import pytest
from data_management.serializers.admin_event_serializer import AdminEventSerializer
from events.tests.factories.event_factory import EventFactory
from events.tests.factories.order_factory import OrderFactory

@pytest.mark.django_db
def test_admin_event_serializer_fields():
    """
    Test that AdminEventSerializer correctly serializes event and related order fields.
    """
    order = OrderFactory(billing_mode='one_time',
        budget=100.00,
        customer_email="jane.buyer@example.com",
        recipient_first_name="Jane",
        recipient_last_name="Doe",
        delivery_notes="Leave at door",
        flower_notes="Occasion / vibe: Romance",
    )

    event = EventFactory(order=order)
    
    serializer = AdminEventSerializer(event)
    data = serializer.data
    
    assert data['id'] == event.id
    assert data['order_id'] == order.id
    assert float(data['budget']) == 100.00
    assert data['recipient_first_name'] == "Jane"
    assert data['recipient_last_name'] == "Doe"
    assert data['delivery_notes'] == "Leave at door"
    assert data['order_type'] == "One-time"
    assert data['flower_notes'] == "Occasion / vibe: Romance"
    assert data['customer_email'] == order.customer_email
