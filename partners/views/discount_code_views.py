from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from partners.models import DiscountCode, Partner


class DiscountCodeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            partner = Partner.objects.get(user=request.user)
        except Partner.DoesNotExist:
            return Response({'error': 'Not a partner.'}, status=status.HTTP_404_NOT_FOUND)

        if partner.partner_type != 'non_delivery':
            return Response(
                {'error': 'Discount codes are only available to affiliate partners.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        name = request.data.get('name', '').strip() or partner.business_name
        code = DiscountCode.generate_code(name)
        dc = DiscountCode.objects.create(partner=partner, code=code, discount_amount=5)

        return Response({
            'id': dc.id,
            'code': dc.code,
            'discount_amount': str(dc.discount_amount),
            'is_active': dc.is_active,
            'total_uses': 0,
            'created_at': dc.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)
