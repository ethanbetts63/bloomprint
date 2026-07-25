import pytest
from payments.models import Payment
from payments.tests.factories.payment_factory import PaymentFactory

@pytest.mark.django_db
def test_payment_creation():
    """
    Tests that a Payment instance can be created successfully.
    """
    payment = PaymentFactory()
    assert isinstance(payment, Payment)
    assert payment.order is not None
    assert payment.stripe_payment_intent_id is not None
    assert payment.amount is not None
    assert payment.status is not None

@pytest.mark.django_db
def test_payment_str_method():
    """
    Tests the __str__ method of the Payment model.
    """
    payment = PaymentFactory()
    expected_str = f"Payment {payment.id} for order {payment.order_id} - {payment.status}"
    assert str(payment) == expected_str