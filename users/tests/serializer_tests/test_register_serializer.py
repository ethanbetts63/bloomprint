import pytest
from rest_framework import serializers
from users.serializers.register_serializer import RegisterSerializer
from users.models import User

@pytest.mark.django_db
def test_register_serializer_valid_data():
    """
    Tests that the RegisterSerializer creates a user with valid data.
    """
    user_data = {
        "email": "test@example.com",
        "password": "strongpassword123",
        "first_name": "Test",
        "last_name": "User",
    }
    serializer = RegisterSerializer(data=user_data)
    assert serializer.is_valid(raise_exception=True)
    user = serializer.save()

    assert user.email == "test@example.com"
    assert user.first_name == "Test"
    assert user.last_name == "User"
    assert user.check_password("strongpassword123")
    assert user.is_active is True

@pytest.mark.django_db
def test_register_serializer_duplicate_email():
    """
    Tests that the serializer raises a ValidationError if the email already exists.
    """
    User.objects.create_user(
        username="duplicate@example.com",
        email="duplicate@example.com",
        password="password123"
    )
    
    user_data = {
        "email": "duplicate@example.com",
        "password": "newpassword123",
        "first_name": "New",
        "last_name": "User",
    }
    serializer = RegisterSerializer(data=user_data)
    with pytest.raises(serializers.ValidationError) as excinfo:
        serializer.is_valid(raise_exception=True)
    
    assert "email" in excinfo.value.detail

@pytest.mark.django_db
def test_register_serializer_ignores_guest_email():
    """
    Guest-checkout placeholder rows reuse the buyer's email but are not real
    accounts, so they must not block a genuine registration with that email.
    """
    User.objects.create_user(
        username="guest-abc123@checkout.invalid",
        email="buyer@example.com",
    )

    user_data = {
        "email": "buyer@example.com",
        "password": "newpassword123",
        "first_name": "Real",
        "last_name": "Buyer",
    }
    serializer = RegisterSerializer(data=user_data)
    assert serializer.is_valid(raise_exception=True)
    user = serializer.save()

    assert user.email == "buyer@example.com"
    assert user.username == "buyer@example.com"

@pytest.mark.django_db
def test_register_serializer_missing_fields():
    """
    Tests that the serializer raises a ValidationError if required fields are missing.
    """
    serializer = RegisterSerializer(data={})
    with pytest.raises(serializers.ValidationError):
        serializer.is_valid(raise_exception=True)

@pytest.mark.django_db
def test_register_serializer_password_hashing():
    """
    Tests that the password is correctly hashed during user creation.
    """
    user_data = {
        "email": "hash_test@example.com",
        "password": "strongpassword123",
        "first_name": "Hash",
        "last_name": "Test",
    }
    serializer = RegisterSerializer(data=user_data)
    assert serializer.is_valid(raise_exception=True)
    user = serializer.save()
    
    assert user.password != "strongpassword123"
    assert user.check_password("strongpassword123")

@pytest.mark.django_db
def test_register_serializer_data_property():
    """
    Tests that the 'data' property of the serializer is accessible after validation.
    """
    user_data = {
        "email": "test@example.com",
        "password": "strongpassword123",
        "first_name": "Test",
        "last_name": "User",
    }
    serializer = RegisterSerializer(data=user_data)
    assert serializer.is_valid(raise_exception=True)
    assert 'password' not in serializer.data
