from decimal import Decimal

import pytest
from django.conf import settings
from rest_framework import serializers

from events.serializers.order_serializer import OrderSerializer


class TestOrderSerializerBudgetValidation:
    def test_rejects_budget_below_minimum(self):
        serializer = OrderSerializer()

        with pytest.raises(serializers.ValidationError, match=r"Budget must be at least \$65"):
            serializer.validate_budget(Decimal("64.99"))

    def test_accepts_budget_at_minimum(self):
        serializer = OrderSerializer()

        assert serializer.validate_budget(Decimal("65.00")) == Decimal("65.00")

    def test_delivery_included_threshold_is_configured(self):
        assert settings.DELIVERY_INCLUDED_THRESHOLD == 100
