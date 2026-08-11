from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.utils.florist_outreach import build_outreach_draft, send_florist_outreach
from events.models import Event


class AdminFloristOutreachView(APIView):
    """
    Compose and send a hand-written pitch about one delivery to one florist.

    GET returns the prefilled draft; POST sends the operator's edited version.
    The recipient is deliberately not prefilled — the whole point is that admin
    is reaching out to a florist we have no record of, whose address they found
    themselves. The compose page is the safety gate.
    """
    permission_classes = [IsAdminUser]

    def _event_or_none(self, pk):
        return Event.objects.select_related('order').filter(pk=pk).first()

    def get(self, request, pk):
        event = self._event_or_none(pk)
        if event is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(build_outreach_draft(event))

    def post(self, request, pk):
        event = self._event_or_none(pk)
        if event is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        to = (request.data.get('to') or '').strip()
        try:
            validate_email(to)
        except ValidationError:
            return Response(
                {'to': ['Enter a valid florist email address.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = (request.data.get('subject') or '').strip()
        body = (request.data.get('body') or '').strip()
        if not subject or not body:
            return Response(
                {'detail': 'Subject and email body are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        brief_variant = (request.data.get('brief_variant') or 'request').strip()
        if brief_variant not in ('request', 'claimed'):
            return Response(
                {'brief_variant': ['Choose either the PII-limited or full brief.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notification = send_florist_outreach(
            event, to=to, subject=subject, body=body, brief_variant=brief_variant,
        )
        if notification.status != 'sent':
            return Response(
                {'detail': 'Email could not be sent. The failed attempt was recorded.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'detail': f'Outreach sent to {to}.'})
