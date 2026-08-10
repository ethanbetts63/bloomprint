from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from events.models import Event
from data_management.serializers.admin_event_serializer import AdminEventSerializer


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cutoff = date.today() + timedelta(days=14)

        unclaimed_qs = (
            Event.objects
            .filter(status='scheduled', delivery_date__lte=cutoff)
            .select_related('order')
            .order_by('delivery_date')
        )

        claimed_qs = (
            Event.objects
            .filter(status='claimed')
            .select_related('order')
            .order_by('delivery_date')
        )

        delivered_qs = (
            Event.objects
            .filter(status='delivered')
            .select_related('order')
            .order_by('-delivered_at')[:50]
        )

        return Response({
            'unclaimed': AdminEventSerializer(unclaimed_qs, many=True).data,
            'claimed': AdminEventSerializer(claimed_qs, many=True).data,
            'delivered': AdminEventSerializer(delivered_qs, many=True).data,
        })
