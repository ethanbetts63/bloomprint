from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from partners.models import BusinessAccount
from partners.serializers import BusinessAccountUpdateSerializer


class BusinessAccountUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            account = BusinessAccount.objects.get(user=request.user)
        except BusinessAccount.DoesNotExist:
            return Response(
                {"error": "No florist or affiliate account was found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BusinessAccountUpdateSerializer(account, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
