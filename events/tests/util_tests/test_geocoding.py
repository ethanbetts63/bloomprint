import pytest
import requests

from events.tests.factories.order_factory import OrderFactory
from events.utils import geocoding
from events.utils.geocoding import geocode_address, geocode_order

ROCKINGHAM_RESULT = [{'lat': '-32.2842129', 'lon': '115.7380348'}]


@pytest.fixture(autouse=True)
def no_rate_limit_sleep(mocker):
    """The throttle is real in production; sleeping through it in tests is not."""
    mocker.patch('events.utils.geocoding.time.sleep')


def mock_get(mocker, side_effect=None, json_payload=None):
    """Patches requests.get and returns the mock for call inspection."""
    def build_response(payload):
        response = mocker.MagicMock()
        response.json.return_value = payload
        response.raise_for_status.return_value = None
        return response

    if side_effect is not None:
        return mocker.patch('events.utils.geocoding.requests.get', side_effect=side_effect)
    return mocker.patch(
        'events.utils.geocoding.requests.get', return_value=build_response(json_payload)
    )


class TestGeocodeAddress:
    def test_street_match_returns_street_precision(self, mocker):
        mock_get(mocker, json_payload=ROCKINGHAM_RESULT)

        lat, lng, precision = geocode_address(
            street='1 Read Street', suburb='Rockingham', state='WA',
            postcode='6168', country='Australia',
        )

        assert (lat, lng) == (-32.2842129, 115.7380348)
        assert precision == 'street'

    def test_falls_back_to_suburb_when_street_misses(self, mocker):
        """The requested behaviour: retry without the street number and name."""
        get = mock_get(mocker, side_effect=[
            _response(mocker, []),                  # street attempt misses
            _response(mocker, ROCKINGHAM_RESULT),   # suburb attempt hits
        ])

        lat, lng, precision = geocode_address(
            street='999 Nonexistent Way', suburb='Rockingham', state='WA',
            postcode='6168', country='Australia',
        )

        assert (lat, lng) == (-32.2842129, 115.7380348)
        assert precision == 'suburb'
        assert get.call_count == 2
        # The fallback must not carry the street through, or it repeats the miss.
        assert 'street' not in get.call_args_list[1].kwargs['params']

    def test_second_fallback_drops_the_postcode(self, mocker):
        get = mock_get(mocker, side_effect=[
            _response(mocker, []),                  # street
            _response(mocker, []),                  # suburb + postcode
            _response(mocker, ROCKINGHAM_RESULT),   # suburb without postcode
        ])

        result = geocode_address(
            street='999 Nonexistent Way', suburb='Rockingham', state='WA',
            postcode='9999', country='Australia',
        )

        assert result[2] == 'suburb'
        assert 'postalcode' not in get.call_args_list[2].kwargs['params']

    def test_returns_none_when_everything_misses(self, mocker):
        mock_get(mocker, json_payload=[])

        assert geocode_address(street='X', suburb='Y', state='WA') is None

    def test_defaults_country_to_australia(self, mocker):
        get = mock_get(mocker, json_payload=ROCKINGHAM_RESULT)

        geocode_address(street='1 Read Street', suburb='Rockingham')

        assert get.call_args.kwargs['params']['country'] == 'Australia'

    def test_empty_components_are_dropped_not_sent_blank(self, mocker):
        """Nominatim treats a blank component as a constraint and fails to match."""
        get = mock_get(mocker, json_payload=ROCKINGHAM_RESULT)

        geocode_address(street='1 Read Street', suburb='Rockingham', state='', postcode='')

        params = get.call_args.kwargs['params']
        assert 'state' not in params
        assert 'postalcode' not in params

    def test_sends_identifying_user_agent(self, mocker):
        """Nominatim blocks clients that do not identify themselves."""
        get = mock_get(mocker, json_payload=ROCKINGHAM_RESULT)

        geocode_address(street='1 Read Street', suburb='Rockingham')

        assert 'BloomPrint' in get.call_args.kwargs['headers']['User-Agent']

    def test_network_failure_returns_none_rather_than_raising(self, mocker):
        mock_get(mocker, side_effect=requests.Timeout('too slow'))

        assert geocode_address(street='1 Read Street', suburb='Rockingham') is None

    def test_malformed_result_returns_none(self, mocker):
        mock_get(mocker, json_payload=[{'no_lat_here': True}])

        assert geocode_address(street='1 Read Street', suburb='Rockingham') is None

    def test_no_address_at_all_makes_no_request(self, mocker):
        get = mock_get(mocker, json_payload=ROCKINGHAM_RESULT)

        assert geocode_address() is None
        get.assert_not_called()


def _response(mocker, payload):
    response = mocker.MagicMock()
    response.json.return_value = payload
    response.raise_for_status.return_value = None
    return response


@pytest.mark.django_db
class TestGeocodeOrder:
    def test_writes_coordinates_to_the_order(self, mocker):
        mock_get(mocker, json_payload=ROCKINGHAM_RESULT)
        order = OrderFactory(recipient_suburb='Rockingham', recipient_state='WA')

        precision = geocode_order(order)

        order.refresh_from_db()
        assert precision == 'street'
        assert order.latitude == -32.2842129
        assert order.longitude == 115.7380348

    def test_failure_leaves_coordinates_null_and_does_not_raise(self, mocker):
        mock_get(mocker, json_payload=[])
        order = OrderFactory(recipient_suburb='Nowhere')

        assert geocode_order(order) is None

        order.refresh_from_db()
        assert order.latitude is None

    def test_save_false_leaves_the_row_untouched(self, mocker):
        mock_get(mocker, json_payload=ROCKINGHAM_RESULT)
        order = OrderFactory(recipient_suburb='Rockingham')

        geocode_order(order, save=False)

        assert order.latitude == -32.2842129
        order.refresh_from_db()
        assert order.latitude is None


@pytest.mark.django_db
class TestRateLimiting:
    def test_consecutive_requests_are_throttled(self, mocker):
        """The one-per-second policy is enforced here, not left to callers."""
        sleep = mocker.patch('events.utils.geocoding.time.sleep')
        mock_get(mocker, json_payload=ROCKINGHAM_RESULT)

        geocode_address(street='1 Read Street', suburb='Rockingham')
        geocode_address(street='2 Read Street', suburb='Rockingham')

        assert sleep.called
