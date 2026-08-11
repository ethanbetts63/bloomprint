import pytest
from decimal import Decimal

from events.utils.fee_calc import calculate_florist_commission, calculate_florist_payout


@pytest.fixture
def rate_10(settings):
    """
    Pin the rate at 10%.

    The arithmetic below is what these tests are about, so it must not depend on
    whatever FLORIST_COMMISSION_RATE happens to be configured to — that is a
    business decision that changes, and changing it should not break the tests
    that prove the maths.
    """
    settings.FLORIST_COMMISSION_RATE = '0.10'


@pytest.mark.usefixtures('rate_10')
class TestFloristPayoutCalc:
    def test_commission_is_the_configured_percent_of_the_budget(self):
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


class TestRateIsConfigurable:
    """The rate itself is a setting, not a constant baked into the maths."""

    @pytest.mark.parametrize('rate,commission,payout', [
        ('0.05', Decimal('10.00'), Decimal('190.00')),
        ('0.10', Decimal('20.00'), Decimal('180.00')),
        ('0.15', Decimal('30.00'), Decimal('170.00')),
    ])
    def test_rate_is_driven_by_settings(self, settings, rate, commission, payout):
        settings.FLORIST_COMMISSION_RATE = rate
        assert calculate_florist_commission(Decimal('200.00')) == commission
        assert calculate_florist_payout(Decimal('200.00')) == payout

    def test_the_sum_holds_at_any_rate(self, settings):
        settings.FLORIST_COMMISSION_RATE = '0.05'
        budget = Decimal('87.35')
        assert calculate_florist_commission(budget) + calculate_florist_payout(budget) == budget
