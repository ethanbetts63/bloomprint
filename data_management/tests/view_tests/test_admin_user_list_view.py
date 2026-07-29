import pytest
from rest_framework.test import APIClient
from users.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestAdminUserListView:
    def setup_method(self):
        self.client = APIClient()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=self.admin)

    def _url(self):
        return '/api/data/admin/users/'

    def test_returns_all_users(self):
        UserFactory()
        UserFactory()
        response = self.client.get(self._url())
        assert response.status_code == 200
        # At least 3 (admin + 2 created)
        assert response.data['count'] >= 3

    def test_search_by_email(self):
        target = UserFactory(email='findme@example.com')
        UserFactory(email='other@example.com')
        response = self.client.get(self._url(), {'search': 'findme'})
        emails = [u['email'] for u in response.data['results']]
        assert 'findme@example.com' in emails

    def test_search_by_first_name(self):
        target = UserFactory(first_name='Findable', last_name='Person')
        UserFactory(first_name='Other')
        response = self.client.get(self._url(), {'search': 'Findable'})
        ids = [u['id'] for u in response.data['results']]
        assert target.pk in ids

    def test_search_by_last_name(self):
        target = UserFactory(last_name='UniqueSurname')
        UserFactory(last_name='CommonSurname')
        response = self.client.get(self._url(), {'search': 'UniqueSurname'})
        ids = [u['id'] for u in response.data['results']]
        assert target.pk in ids

    def test_requires_admin(self):
        non_admin = UserFactory(is_staff=False, is_superuser=False)
        client = APIClient()
        client.force_authenticate(user=non_admin)
        response = client.get(self._url())
        assert response.status_code == 403

    def test_search_excludes_non_matching(self):
        UserFactory(email='unique99@example.com')
        UserFactory(email='other@example.com')
        response = self.client.get(self._url(), {'search': 'unique99'})
        emails = [u['email'] for u in response.data['results']]
        assert 'other@example.com' not in emails
