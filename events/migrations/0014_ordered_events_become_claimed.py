from django.db import migrations


def ordered_to_claimed(apps, schema_editor):
    """
    'ordered' meant Bloomprint had sourced the flowers by hand. Under the claim
    board the florist who claimed the delivery makes it, so the equivalent state
    is 'claimed'.

    An 'ordered' event with no claim row is one an admin was handling manually.
    It still becomes 'claimed' so it stays out of the board — it is already
    being dealt with, and putting it back in front of florists would double-book
    it. Those show as claimed-by-nobody in admin, which is the honest reading.
    """
    Event = apps.get_model('events', 'Event')
    Event.objects.filter(status='ordered').update(status='claimed')

    # Claiming only started writing the event status in this release. Anything
    # already claimed under the previous build still reads 'scheduled', which
    # would put a taken delivery back on the board for someone else to claim.
    Event.objects.filter(
        status='scheduled',
        delivery_requests__status='accepted',
    ).update(status='claimed')


def claimed_to_ordered(apps, schema_editor):
    Event = apps.get_model('events', 'Event')
    Event.objects.filter(status='claimed').update(status='ordered')


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0013_alter_event_status'),
    ]

    operations = [
        migrations.RunPython(ordered_to_claimed, claimed_to_ordered),
    ]
