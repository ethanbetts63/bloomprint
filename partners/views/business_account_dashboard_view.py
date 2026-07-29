from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from partners.models import BusinessAccount
from partners.serializers import BusinessAccountDashboardSerializer


class BusinessAccountDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            account = BusinessAccount.objects.get(user=request.user)
        except BusinessAccount.DoesNotExist:
            return Response(
                {"error": "No florist or affiliate account was found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BusinessAccountDashboardSerializer(account)
        return Response(serializer.data)
