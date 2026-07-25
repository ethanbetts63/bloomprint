from django.urls import path
from .views.user_profile_view import UserProfileView
from .views.delete_user_view import DeleteUserView
from .views.change_password_view import ChangePasswordView
from .views.password_reset_request_view import PasswordResetRequestView
from .views.password_reset_confirm_view import PasswordResetConfirmView

app_name = 'users'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('delete/', DeleteUserView.as_view(), name='delete-user'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
