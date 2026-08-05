import pytest
from data_management.serializers.admin_order_serializer import AdminOrderSerializer
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
def test_admin_order_serializer_one_time():
    """order_type mirrors billing_mode for a one-time order."""
    order = OrderFactory(billing_mode='one_time', customer_email='buyer@example.com')
    data = AdminOrderSerializer(order).data
    assert data['order_type'] == 'one_time'
    assert data['status'] == order.status
    assert data['customer_email'] == order.customer_email


@pytest.mark.django_db
def test_admin_order_serializer_recurring():
    """order_type mirrors billing_mode for a recurring (subscription) order."""
    order = OrderFactory(billing_mode='recurring')
    data = AdminOrderSerializer(order).data
    assert data['order_type'] == 'recurring'
