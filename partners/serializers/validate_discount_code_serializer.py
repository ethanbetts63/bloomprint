from rest_framework import serializers
from partners.models import DiscountCode


class ValidateDiscountCodeSerializer(serializers.Serializer):
    """
    Applies (or clears) a discount code on an order the caller has already been
    authorized for. It deliberately takes no order id: the caller passes the
    order in, so this cannot be pointed at someone else's.
    """
    code = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def _lookup(self, code):
        return DiscountCode.objects.select_related('partner', 'partner__user').get(
            code=code, is_active=True
        )

    def validate_code(self, value):
        if not value:
            return value

        try:
            discount_code = self._lookup(value)
        except DiscountCode.DoesNotExist:
            raise serializers.ValidationError("This discount code does not exist.")

        if discount_code.partner.status != 'active':
            raise serializers.ValidationError("This discount code is not currently valid.")

        return value

    def apply_discount(self, order):
        code = self.validated_data.get('code', '')

        if not code:
            order.discount_code = None
            order.discount_amount = 0
            order.save()
            return {
                'code': None,
                'discount_amount': '0.00',
                'partner_name': None,
                'new_total_amount': str(order.total_amount),
            }

        discount_code = self._lookup(code)
        order.discount_code = discount_code
        order.discount_amount = discount_code.discount_amount
        order.save()

        if not order.referred_by_partner:
            order.referred_by_partner = discount_code.partner
            order.save(update_fields=['referred_by_partner'])

        return {
            'code': discount_code.code,
            'discount_amount': str(discount_code.discount_amount),
            'partner_name': discount_code.partner.business_name or 'Partner',
            'new_total_amount': str(order.total_amount),
        }
