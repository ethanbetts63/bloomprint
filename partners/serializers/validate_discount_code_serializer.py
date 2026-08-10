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
        return DiscountCode.objects.select_related('business_account', 'business_account__user').get(
            code=code, is_active=True
        )

    def validate_code(self, value):
        if not value:
            return value

        try:
            discount_code = self._lookup(value)
        except DiscountCode.DoesNotExist:
            raise serializers.ValidationError("This discount code does not exist.")

        if discount_code.business_account.status != 'active':
            raise serializers.ValidationError("This discount code is not currently valid.")

        # Codes belong to affiliates only. Registration no longer issues them to
        # florists, but legacy florist codes still exist in the DB and must not
        # redeem.
        if discount_code.business_account.account_type != 'affiliate':
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
                'business_account_name': None,
                'new_total_amount': str(order.total_amount),
            }

        discount_code = self._lookup(code)
        order.discount_code = discount_code
        order.discount_amount = discount_code.discount_amount
        order.save()

        if not order.referred_by_affiliate:
            order.referred_by_affiliate = discount_code.business_account
            order.save(update_fields=['referred_by_affiliate'])

        return {
            'code': discount_code.code,
            'discount_amount': str(discount_code.discount_amount),
            'business_account_name': discount_code.business_account.business_name or 'Affiliate',
            'new_total_amount': str(order.total_amount),
        }
