import pytest
from partners.utils.reassignment import reassign_delivery_request
from partners.tests.factories.business_account_factory import BusinessAccountFactory
from events.tests.factories.event_factory import EventFactory

@pytest.mark.django_db
def test_reassign_delivery_request_fails_without_coords():
    event = EventFactory()
    # order is created by factory, and Order has no lat/lng fields
    dr = reassign_delivery_request(event)
    assert dr is None

@pytest.mark.django_db
def test_reassign_delivery_request_success_if_coords_existed(mocker):
    # Since Order has no lat/lng, we have to mock getattr or the object
    event = EventFactory()
    order = event.order
    mocker.patch.object(order, 'latitude', -33.8688, create=True)
    mocker.patch.object(order, 'longitude', 151.2093, create=True)
    
    # Sydney florist
    account = BusinessAccountFactory(
        account_type='florist',
        status='active',
        latitude=-33.8600,
        longitude=151.2000,
        service_radius_km=10
    )
    
    dr = reassign_delivery_request(event)
    assert dr is not None
    assert dr.business_account == account
