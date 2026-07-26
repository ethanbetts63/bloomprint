import factory
from factory.django import DjangoModelFactory
from partners.models import Payout, PayoutLineItem
from .partner_factory import PartnerFactory
from django.utils import timezone

class PayoutFactory(DjangoModelFactory):
    class Meta:
        model = Payout

    partner = factory.SubFactory(PartnerFactory)
    payout_type = 'commission'
    amount = factory.Faker('pydecimal', left_digits=3, right_digits=2, min_value=10, max_value=500)
    status = 'pending'
    period_start = factory.LazyFunction(lambda: timezone.now().date())
    period_end = factory.LazyFunction(lambda: timezone.now().date())

class PayoutLineItemFactory(DjangoModelFactory):
    class Meta:
        model = PayoutLineItem

    payout = factory.SubFactory(PayoutFactory)
    commission = None
    delivery_request = None
    amount = factory.Faker('pydecimal', left_digits=2, right_digits=2, min_value=1, max_value=50)
    description = factory.Faker('sentence')
