from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.conf import settings
from django.middleware.csrf import get_token


def _set_auth_cookies(response, access_token, refresh_token=None, request=None):
    """
    Attaches JWT tokens as HttpOnly cookies to the response.
    Secure flag is off in DEBUG mode to allow local development over HTTP.
    """
    if request is not None:
        get_token(request)

    secure = not settings.DEBUG
    access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
    refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())

    response.set_cookie(
        key=settings.AUTH_COOKIE,
        value=str(access_token),
        max_age=access_max_age,
        httponly=True,
        secure=secure,
        samesite='Lax',
    )
    if refresh_token is not None:
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value=str(refresh_token),
            max_age=refresh_max_age,
            httponly=True,
            secure=secure,
            samesite='Lax',
        )


class CookieTokenObtainPairView(APIView):
    """
    Accepts email/password credentials and, on success, sets JWT tokens as
    HttpOnly cookies rather than returning them in the response body.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = TokenObtainPairSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {'detail': 'No active account found with the given credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = serializer.user
        if not (user.is_staff or user.is_superuser or hasattr(user, 'business_account')):
            return Response(
                {'detail': 'Customer orders are accessed using the private link sent by email.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access_token = serializer.validated_data['access']
        refresh_token = serializer.validated_data['refresh']

        response = Response({'detail': 'Login successful.'})
        _set_auth_cookies(response, access_token, refresh_token, request=request)
        return response


class CookieTokenRefreshView(APIView):
    """
    Reads the refresh token from its HttpOnly cookie and, if valid, issues
    a new access token (and rotated refresh token) as HttpOnly cookies.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not found.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        access_token = serializer.validated_data['access']
        new_refresh = serializer.validated_data.get('refresh')

        response = Response({'detail': 'Token refreshed.'})
        _set_auth_cookies(response, access_token, new_refresh)
        return response


class LogoutView(APIView):
    """
    Clears the JWT auth cookies, effectively logging the user out.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({'detail': 'Logged out successfully.'})
        response.delete_cookie(settings.AUTH_COOKIE)
        response.delete_cookie(settings.AUTH_COOKIE_REFRESH)
        return response
