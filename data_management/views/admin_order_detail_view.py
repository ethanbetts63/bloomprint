from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from events.models import Order
from data_management.serializers.admin_order_detail_serializer import AdminOrderDetailSerializer


class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            order = (
                Order.objects
                .prefetch_related('events')
                .get(pk=pk)
            )
        except Order.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(AdminOrderDetailSerializer(order).data)
