from importlib import import_module

import pytest
from django.apps import apps as global_apps
from django.utils import timezone

from users.tests.factories.user_factory import UserFactory
from events.tests.factories.order_factory import OrderFactory
from data_management.tests.factories.notification_factory import NotificationFactory
from data_management.tests.factories.terms_and_conditions_factory import TermsAndConditionsFactory
from data_management.models import TermsAcceptance
from events.models import Order
from data_management.models import Notification

backfill = import_module(
    'events.migrations.0005_backfill_customer_from_guest'
).backfill_customer_data


@pytest.mark.django_db
def test_backfill_copies_guest_data_onto_orders():
    guest = UserFactory(
        username='guest-abc@checkout.invalid',
        email='buyer@example.com',
        first_name='Buyer',
        last_name='Person',
    )
    guest.stripe_customer_id = 'cus_guest1'
    guest.save()
    order = OrderFactory(user=guest, customer_email=None, stripe_customer_id=None)

    real = UserFactory(username='realstaff', email='staff@example.com', is_staff=True)
    real_order = OrderFactory(user=real, customer_email=None)

    backfill(global_apps, None)

    order.refresh_from_db()
    assert order.customer_email == 'buyer@example.com'
    assert order.customer_first_name == 'Buyer'
    assert order.customer_last_name == 'Person'
    assert order.stripe_customer_id == 'cus_guest1'

    # Non-guest orders are left untouched.
    real_order.refresh_from_db()
    assert real_order.customer_email is None


@pytest.mark.django_db
def test_backfill_sets_notification_recipient_email():
    guest = UserFactory(username='guest-def@checkout.invalid', email='buyer2@example.com')
    note = NotificationFactory(
        recipient_type='customer',
        recipient_user=guest,
        recipient_partner=None,
        recipient_email=None,
    )

    backfill(global_apps, None)

    note.refresh_from_db()
    assert note.recipient_email == 'buyer2@example.com'


@pytest.mark.django_db
def test_backfill_folds_terms_acceptance_into_order():
    guest = UserFactory(username='guest-ghi@checkout.invalid', email='buyer3@example.com')
    order = OrderFactory(user=guest, terms_accepted_at=None, accepted_terms=None)
    terms = TermsAndConditionsFactory(terms_type='customer', version='1.0')
    acceptance = TermsAcceptance.objects.create(user=guest, terms=terms)

    backfill(global_apps, None)

    order.refresh_from_db()
    assert order.terms_accepted_at == acceptance.accepted_at
    assert order.accepted_terms_id == terms.id
