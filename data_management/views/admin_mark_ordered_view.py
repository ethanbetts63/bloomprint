from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from events.models import Event
from data_management.serializers.admin_event_serializer import AdminEventSerializer
from data_management.models import Notification
from data_management.utils.notification_factory import create_admin_delivery_day_notifications


class AdminMarkOrderedView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            event = (
                Event.objects
                .select_related('order')
                .get(pk=pk)
            )
        except Event.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if event.status != 'scheduled':
            return Response(
                {'detail': f"Cannot mark as ordered: event status is '{event.status}', expected 'scheduled'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ordered_at = request.data.get('ordered_at')
        ordering_evidence_text = request.data.get('ordering_evidence_text', '')

        if not ordered_at:
            return Response({'detail': "'ordered_at' is required."}, status=status.HTTP_400_BAD_REQUEST)

        event.status = 'ordered'
        event.ordered_at = ordered_at
        event.ordering_evidence_text = ordering_evidence_text
        event.save()

        Notification.objects.filter(related_event=event, status='pending').update(status='cancelled')

        create_admin_delivery_day_notifications(event)

        return Response(AdminEventSerializer(event).data)
