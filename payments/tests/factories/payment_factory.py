import factory
from factory.django import DjangoModelFactory
from factory import Faker, SubFactory
from payments.models import Payment
from events.tests.factories.order_factory import OrderFactory

class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    order = SubFactory(OrderFactory)
    stripe_payment_intent_id = Faker('uuid4')
    amount = Faker('pydecimal', left_digits=2, right_digits=2, positive=True)
    status = 'succeeded'
