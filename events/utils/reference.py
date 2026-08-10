"""Human-quotable, non-sequential references for customer- and florist-facing use.

Database primary keys leak volume: a florist handed "Delivery #1" learns exactly
how many deliveries Bloomprint has ever done. References are random rather than
offset-sequential, so two of them reveal nothing about what happened in between.
"""

import secrets

# Crockford-style: no 0/O, 1/I/L or U, so a reference read down the phone or
# copied off a printed sheet cannot be transcribed into a different one.
ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
DEFAULT_LENGTH = 6
DEFAULT_PREFIX = 'BP'


def generate_reference(prefix=DEFAULT_PREFIX, length=DEFAULT_LENGTH):
    """Returns a reference like 'BP-K4F9Q2'. 30^6 is ~729 million per prefix."""
    body = ''.join(secrets.choice(ALPHABET) for _ in range(length))
    return f'{prefix}-{body}'


def generate_unique_reference(model, field='reference', prefix=DEFAULT_PREFIX,
                              length=DEFAULT_LENGTH, attempts=10):
    """
    Returns a reference not already used by `model`.

    The column's unique constraint is the real guarantee — this only keeps the
    odds of hitting it negligible.
    """
    for _ in range(attempts):
        candidate = generate_reference(prefix, length)
        if not model.objects.filter(**{field: candidate}).exists():
            return candidate
    raise RuntimeError(
        f'Could not generate a unique {model.__name__}.{field} in {attempts} attempts.'
    )
