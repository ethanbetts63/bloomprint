import pytest
from decimal import Decimal

from django.test import override_settings

from events.utils.fee_calc import calculate_florist_commission, calculate_florist_payout


class TestFloristPayoutCalc:
    def test_commission_is_ten_percent_of_the_budget(self):
        assert calculate_florist_commission(Decimal('140.00')) == Decimal('14.00')

    def test_payout_is_the_budget_less_commission(self):
        assert calculate_florist_payout(Decimal('140.00')) == Decimal('126.00')

    def test_commission_and_payout_sum_to_the_budget(self):
        budget = Decimal('87.35')
        assert calculate_florist_commission(budget) + calculate_florist_payout(budget) == budget

    def test_rounds_to_cents(self):
        # 10% of 65.55 is 6.555, which must not leak sub-cent precision.
        assert calculate_florist_commission(Decimal('65.55')) == Decimal('6.56')
        assert calculate_florist_payout(Decimal('65.55')) == Decimal('58.99')

    @pytest.mark.parametrize('budget', [None, Decimal('0.00')])
    def test_no_budget_yields_zero(self, budget):
        assert calculate_florist_commission(budget) == Decimal('0.00')
        assert calculate_florist_payout(budget) == Decimal('0.00')

    @override_settings(FLORIST_COMMISSION_RATE='0.10')
    def test_rate_is_driven_by_settings(self):
        assert calculate_florist_commission(Decimal('200.00')) == Decimal('20.00')
        assert calculate_florist_payout(Decimal('200.00')) == Decimal('180.00')
