import factory
from factory.django import DjangoModelFactory
from partners.models import BusinessAccount
from users.tests.factories.user_factory import UserFactory

class BusinessAccountFactory(DjangoModelFactory):
    class Meta:
        model = BusinessAccount

    user = factory.SubFactory(UserFactory)
    account_type = 'affiliate'
    status = 'active'
    business_name = factory.Faker('company')
    phone = factory.Faker('phone_number')
