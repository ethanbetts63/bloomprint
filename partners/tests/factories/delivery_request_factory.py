import factory
from factory.django import DjangoModelFactory
from partners.models import DeliveryRequest
from .business_account_factory import BusinessAccountFactory
from events.tests.factories.event_factory import EventFactory
from django.utils import timezone
from datetime import timedelta

class DeliveryRequestFactory(DjangoModelFactory):
    class Meta:
        model = DeliveryRequest

    event = factory.SubFactory(EventFactory)
    business_account = factory.SubFactory(BusinessAccountFactory)
    status = 'pending'
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(hours=24))
