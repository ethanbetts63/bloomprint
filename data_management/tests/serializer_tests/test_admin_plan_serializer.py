import pytest
from data_management.serializers.admin_plan_serializer import AdminPlanSerializer
from events.tests.factories.order_factory import OrderFactory

@pytest.mark.django_db
def test_admin_plan_serializer_upfront():
    """
    Test AdminPlanSerializer correctly identifies an upfront plan.
    """
    plan = OrderFactory(billing_mode='one_time', customer_email='buyer@example.com')
    serializer = AdminPlanSerializer(plan)
    data = serializer.data
    assert data['plan_type'] == 'one_time'
    assert data['status'] == plan.status
    assert data['customer_email'] == plan.customer_email

@pytest.mark.django_db
def test_admin_plan_serializer_subscription():
    """
    Test AdminPlanSerializer correctly identifies a subscription plan.
    """
    plan = OrderFactory(billing_mode='recurring', )
    serializer = AdminPlanSerializer(plan)
    data = serializer.data
    assert data['plan_type'] == 'recurring'
