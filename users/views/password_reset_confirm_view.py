from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from users.models import User
from users.serializers.password_reset_confirm_serializer import PasswordResetConfirmSerializer

class PasswordResetConfirmView(APIView):
    """
    View to handle the actual password reset, after the user has clicked
    the link in their email.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, uidb64, token, *args, **kwargs):
        """
        Resets the user's password if the token is valid.
        """
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and (user.is_staff or user.is_superuser or hasattr(user, 'business_account')) and default_token_generator.check_token(user, token):
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response(
                {"detail": "Your password has been reset successfully. You can now log in with your new password."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )
