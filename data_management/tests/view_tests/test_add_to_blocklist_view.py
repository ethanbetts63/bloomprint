import pytest
from django.core.signing import Signer
from django.urls import reverse
from rest_framework.test import APIClient
from data_management.models import BlockedEmail

signer = Signer()
pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def test_add_to_blocklist_invalid_signature(api_client):
    url = reverse('data_management:add_to_blocklist', kwargs={'signed_email': 'invalid-signature'})
    response = api_client.get(url)
    assert response.status_code == 400

def test_add_to_blocklist_success(api_client):
    email_to_block = 'test@example.com'
    signed_email = signer.sign(email_to_block)
    url = reverse('data_management:add_to_blocklist', kwargs={'signed_email': signed_email})

    assert not BlockedEmail.objects.filter(email=email_to_block).exists()

    response = api_client.get(url)

    assert response.status_code == 302
    assert response.url == 'https://www.bloomprint.com.au/blocklist-success/'
    assert BlockedEmail.objects.filter(email=email_to_block).exists()

def test_add_to_blocklist_idempotent(api_client):
    email_to_block = 'idempotent@example.com'
    signed_email = signer.sign(email_to_block)
    url = reverse('data_management:add_to_blocklist', kwargs={'signed_email': signed_email})

    response1 = api_client.get(url)
    assert response1.status_code == 302
    assert BlockedEmail.objects.filter(email=email_to_block).count() == 1

    response2 = api_client.get(url)
    assert response2.status_code == 302
    assert BlockedEmail.objects.filter(email=email_to_block).count() == 1
