import pytest

from events.serializers.order_serializer import OrderSerializer
from events.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestOrderSerializerGeocoding:
    def test_address_change_triggers_geocoding(self, mocker):
        geocode = mocker.patch('events.utils.geocoding.geocode_order', return_value='street')
        order = OrderFactory(recipient_suburb='Fremantle', latitude=-32.05, longitude=115.74)

        serializer = OrderSerializer(order, data={'recipient_suburb': 'Rockingham'}, partial=True)
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        geocode.assert_called_once()

    def test_unchanged_address_does_not_re_geocode(self, mocker):
        """A geocode costs a rate-limited second; don't spend it on a card message edit."""
        geocode = mocker.patch('events.utils.geocoding.geocode_order', return_value='street')
        order = OrderFactory(recipient_suburb='Rockingham', latitude=-32.28, longitude=115.73)

        serializer = OrderSerializer(order, data={'card_message': 'Happy birthday'}, partial=True)
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        geocode.assert_not_called()

    def test_same_value_resubmitted_does_not_re_geocode(self, mocker):
        geocode = mocker.patch('events.utils.geocoding.geocode_order', return_value='street')
        order = OrderFactory(recipient_suburb='Rockingham', latitude=-32.28, longitude=115.73)

        serializer = OrderSerializer(order, data={'recipient_suburb': 'Rockingham'}, partial=True)
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        geocode.assert_not_called()

    def test_order_missing_coordinates_is_geocoded_on_any_save(self, mocker):
        """Backfills orders that predate geocoding the next time they are touched."""
        geocode = mocker.patch('events.utils.geocoding.geocode_order', return_value='suburb')
        order = OrderFactory(recipient_suburb='Rockingham', latitude=None, longitude=None)

        serializer = OrderSerializer(order, data={'card_message': 'Hello'}, partial=True)
        assert serializer.is_valid(), serializer.errors
        serializer.save()

        geocode.assert_called_once()

    def test_geocode_failure_does_not_break_the_save(self, mocker):
        """A checkout must not fail because Nominatim is down."""
        mocker.patch('events.utils.geocoding.geocode_order', return_value=None)
        order = OrderFactory(recipient_suburb='Fremantle')

        serializer = OrderSerializer(order, data={'recipient_suburb': 'Rockingham'}, partial=True)
        assert serializer.is_valid(), serializer.errors
        saved = serializer.save()

        assert saved.recipient_suburb == 'Rockingham'
