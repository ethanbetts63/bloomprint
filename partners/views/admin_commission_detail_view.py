from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from partners.models import Commission
from partners.serializers.admin_commission_detail_serializer import AdminCommissionDetailSerializer


class AdminCommissionDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            commission = Commission.objects.select_related('business_account', 'business_account__user').get(pk=pk)
        except Commission.DoesNotExist:
            return Response({'detail': 'Commission not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCommissionDetailSerializer(commission)
        return Response(serializer.data)
