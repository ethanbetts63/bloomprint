from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.utils.admin_messages import send_manual_email


MAX_ATTACHMENTS = 10
MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024  # Mailgun's total limit is 25 MB.
MAX_TOTAL_ATTACHMENT_SIZE = 24 * 1024 * 1024


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

        uploads = request.FILES.getlist('attachments')
        if len(uploads) > MAX_ATTACHMENTS:
            return Response(
                {'attachments': [f'Attach no more than {MAX_ATTACHMENTS} files.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total_size = sum(upload.size for upload in uploads)
        if any(upload.size > MAX_ATTACHMENT_SIZE for upload in uploads) or total_size > MAX_TOTAL_ATTACHMENT_SIZE:
            return Response(
                {'attachments': ['Attachments must be at most 20 MB each and 24 MB in total.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attachments = [
            (
                Path(upload.name).name or 'attachment',
                upload.read(),
                upload.content_type or mimetypes.guess_type(upload.name)[0] or 'application/octet-stream',
            )
            for upload in uploads
        ]
        notification = send_manual_email(
            to=to, subject=subject, body=body, attachments=attachments,
        )
        if notification.status != 'sent':
            return Response(
                {'detail': 'Email could not be sent. The failed attempt was recorded.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'detail': f'Email sent to {to}.'})
import mimetypes
from pathlib import Path
