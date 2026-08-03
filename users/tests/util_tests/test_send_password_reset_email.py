import pytest
from unittest.mock import MagicMock
from users.utils.send_password_reset_email import send_password_reset_email
from users.tests.factories.user_factory import UserFactory
from data_management.tests.factories.blocked_email_factory import BlockedEmailFactory

@pytest.mark.django_db
def test_send_password_reset_email_success(mocker):
    """
    Test that send_password_reset_email successfully sends an email when the user is not blocked.
    """
    user = UserFactory()
    
    mock_post = mocker.patch('users.utils.send_password_reset_email.requests.post')
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    result = send_password_reset_email(user)
    
    assert result is True
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert kwargs['data']['to'] == [user.email]
    assert kwargs['data']['subject'] == "Reset Your Bloom Print Password"

@pytest.mark.django_db
def test_send_password_reset_email_blocked_user(mocker):
    """
    Test that send_password_reset_email does not send an email if the user is blocked.
    """
    user = UserFactory()
    BlockedEmailFactory(email=user.email)

    mock_post = mocker.patch('users.utils.send_password_reset_email.requests.post')

    result = send_password_reset_email(user)
    
    assert result is False
    mock_post.assert_not_called()

@pytest.mark.django_db
def test_send_password_reset_email_api_failure(mocker):
    """
    Test that send_password_reset_email returns False if the Mailgun API fails.
    """
    user = UserFactory()
    
    mock_post = mocker.patch('users.utils.send_password_reset_email.requests.post')
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_post.return_value = mock_response

    result = send_password_reset_email(user)
    
    assert result is False
    mock_post.assert_called_once()

@pytest.mark.django_db
def test_send_password_reset_email_exception(mocker):
    """
    Test that send_password_reset_email returns False and handles exceptions gracefully.
    """
    user = UserFactory()
    
    mock_post = mocker.patch('users.utils.send_password_reset_email.requests.post')
    mock_post.side_effect = Exception("Mailgun API Error")

    result = send_password_reset_email(user)
    
    assert result is False
    mock_post.assert_called_once()
