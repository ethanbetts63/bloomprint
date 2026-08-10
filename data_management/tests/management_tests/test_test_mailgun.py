import pytest
from io import StringIO
from unittest.mock import patch, MagicMock
from django.core.management import call_command

@pytest.mark.django_db
class TestTestMailgunCommand:

    @pytest.fixture(autouse=True)
    def mailgun_settings(self, settings):
        settings.MAILGUN_DOMAIN = 'mg.example.com'
        settings.MAILGUN_API_KEY = 'key-test'

    @patch('data_management.management.commands.test_mailgun.requests.post')
    def test_mailgun_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '{"message": "Queued. Thank you."}'
        mock_post.return_value = mock_response

        out = StringIO()
        call_command('test_mailgun', stdout=out)

        mock_post.assert_called_once()

        output = out.getvalue()
        assert "Successfully sent email!" in output
        assert 'Queued. Thank you.' in output

    @patch('data_management.management.commands.test_mailgun.requests.post')
    def test_mailgun_uses_configured_domain(self, mock_post):
        mock_post.return_value = MagicMock(status_code=200, text='{}')

        call_command('test_mailgun', stdout=StringIO())

        url = mock_post.call_args.args[0]
        assert 'mg.example.com' in url

    @patch('data_management.management.commands.test_mailgun.requests.post')
    def test_mailgun_failure(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = '{"message": "Forbidden"}'
        mock_post.return_value = mock_response

        err = StringIO()
        call_command('test_mailgun', stderr=err)

        mock_post.assert_called_once()

        error_output = err.getvalue()
        assert "Failed to send email" in error_output
        assert "Status code: 401" in error_output
        assert "Forbidden" in error_output

    @patch('data_management.management.commands.test_mailgun.requests.post')
    def test_mailgun_missing_config_does_not_send(self, mock_post, settings):
        settings.MAILGUN_API_KEY = None

        err = StringIO()
        call_command('test_mailgun', stderr=err)

        mock_post.assert_not_called()
        assert "must both be set" in err.getvalue()
