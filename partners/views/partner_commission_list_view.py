from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from partners.models import Partner
from partners.serializers.partner_dashboard_serializer import CommissionSerializer


class PartnerCommissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
        except Partner.DoesNotExist:
            return Response({"error": "Not a partner."}, status=status.HTTP_404_NOT_FOUND)

        commissions = partner.commissions.order_by('-created_at')
        return Response(CommissionSerializer(commissions, many=True).data)
