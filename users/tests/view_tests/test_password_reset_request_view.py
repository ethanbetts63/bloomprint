import pytest
from rest_framework.test import APIClient
from users.tests.factories.user_factory import UserFactory
from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
class TestPasswordResetRequestView:
    """
    Only staff, superusers and partners hold passwords, so only they can be
    sent a reset link. Customers reach their orders via an emailed link.
    """

    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory(email='test@example.com', is_staff=True)
        self.url = '/api/users/password-reset/request/'

    def test_customer_is_not_sent_a_reset_email(self, mocker):
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email')
        UserFactory(email='customer@example.com')

        response = self.client.post(self.url, {'email': 'customer@example.com'}, format='json')

        assert response.status_code == 200
        mock_send_email.assert_not_called()

    def test_request_with_valid_email_sends_email(self, mocker):
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email', return_value=True)
        
        response = self.client.post(self.url, {'email': 'test@example.com'}, format='json')
        
        assert response.status_code == 200
        mock_send_email.assert_called_once_with(self.user)
        
        self.user.refresh_from_db()
        assert self.user.password_reset_last_sent_at is not None

    def test_reset_sent_when_guest_rows_share_the_email(self, mocker):
        """
        Guest-checkout placeholder rows reuse the buyer's email. The reset
        request must still resolve to the single eligible account instead of
        raising MultipleObjectsReturned.
        """
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email', return_value=True)
        for i in range(3):
            UserFactory(username=f'guest-{i}@checkout.invalid', email='test@example.com')

        response = self.client.post(self.url, {'email': 'test@example.com'}, format='json')

        assert response.status_code == 200
        mock_send_email.assert_called_once_with(self.user)

    def test_request_with_non_existent_email_does_not_send(self, mocker):
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email')
        
        response = self.client.post(self.url, {'email': 'nonexistent@example.com'}, format='json')
        
        assert response.status_code == 200
        mock_send_email.assert_not_called()

    def test_request_with_invalid_email_does_not_send(self, mocker):
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email')
        
        response = self.client.post(self.url, {'email': 'not-an-email'}, format='json')
        
        assert response.status_code == 200
        mock_send_email.assert_not_called()

    def test_rate_limiting_prevents_frequent_sends(self, mocker):
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email', return_value=True)
        
        self.client.post(self.url, {'email': 'test@example.com'}, format='json')
        assert mock_send_email.call_count == 1
        
        response = self.client.post(self.url, {'email': 'test@example.com'}, format='json')
        assert response.status_code == 200
        assert mock_send_email.call_count == 1

    def test_rate_limiting_allows_sends_after_timeout(self, mocker):
        mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email', return_value=True)
        
        self.user.password_reset_last_sent_at = timezone.now() - timedelta(seconds=61)
        self.user.save()
        
        response = self.client.post(self.url, {'email': 'test@example.com'}, format='json')
        
        assert response.status_code == 200
        mock_send_email.assert_called_once_with(self.user)


@pytest.mark.django_db
def test_request_with_inactive_user_does_not_send(mocker):
    """
    Tests that a password reset is not sent for an inactive user.
    """
    from rest_framework.test import APIClient
    client = APIClient()
    from users.tests.factories.user_factory import UserFactory
    inactive_user = UserFactory(email='inactive@example.com', is_active=False)
    mock_send_email = mocker.patch('users.views.password_reset_request_view.send_password_reset_email')
    
    url = '/api/users/password-reset/request/'
    response = client.post(url, {'email': 'inactive@example.com'}, format='json')
    
    assert response.status_code == 200
    mock_send_email.assert_not_called()
