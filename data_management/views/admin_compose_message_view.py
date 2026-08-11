from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.utils.admin_messages import send_manual_email


class AdminComposeMessageView(APIView):
    """Send a staff-written email that is not associated with a delivery."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        to = (request.data.get('to') or '').strip()
        try:
            validate_email(to)
        except ValidationError:
            return Response(
                {'to': ['Enter a valid email address.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = (request.data.get('subject') or '').strip()
        body = (request.data.get('body') or '').strip()
        if not subject or not body:
            return Response(
                {'detail': 'Subject and email body are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notification = send_manual_email(to=to, subject=subject, body=body)
        if notification.status != 'sent':
            return Response(
                {'detail': 'Email could not be sent. The failed attempt was recorded.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'detail': f'Email sent to {to}.'})
