from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from events.models import Event
from data_management.serializers.admin_event_serializer import AdminEventSerializer


class AdminEventDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            event = (
                Event.objects
                .select_related('order')
                .get(pk=pk)
            )
        except Event.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(AdminEventSerializer(event).data)
