import factory
from factory.django import DjangoModelFactory
from factory import Faker
from events.models import Order


class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order

    status = 'pending_payment'
    billing_mode = 'one_time'
    budget = Faker('pydecimal', left_digits=2, right_digits=2, positive=True, min_value=50, max_value=99)
    frequency = Faker('random_element', elements=['weekly', 'fortnightly', 'monthly', 'annually'])
    currency = 'aud'
    start_date = Faker('future_date')
    recipient_first_name = Faker('first_name')
    recipient_last_name = Faker('last_name')
    recipient_street_address = Faker('address')
    recipient_suburb = Faker('city')
    recipient_city = Faker('city')
    recipient_state = Faker('state_abbr')
    recipient_postcode = Faker('postcode')
    recipient_country = Faker('country_code')
    delivery_notes = Faker('paragraph')
