import factory
from factory.django import DjangoModelFactory
from partners.models import DeliveryRequest
from .business_account_factory import BusinessAccountFactory
from events.tests.factories.event_factory import EventFactory


class DeliveryRequestFactory(DjangoModelFactory):
    class Meta:
        model = DeliveryRequest

    event = factory.SubFactory(EventFactory)
    business_account = factory.SubFactory(BusinessAccountFactory)
    status = 'accepted'
