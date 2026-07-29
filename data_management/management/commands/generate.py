from django.core.management.base import BaseCommand
from data_management.utils.generation_utils.terms_generator import TermsUpdateOrchestrator
from data_management.utils.archive_db.database_archiver import DatabaseArchiver
from data_management.utils.generation_utils.admin_user_generator import AdminUserGenerator

class Command(BaseCommand):
    help = 'Generates data for the application. Use flags to specify what to generate.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--terms',
            action='store_true',
            help='Generate Terms and Conditions from HTML data files.',
        )
        parser.add_argument(
            '--archive',
            action='store_true',
            help='Archive the current database state to JSON files.',
        )
        parser.add_argument(
            '--admin_user',
            type=str,
            metavar='PASSWORD',
            help='Create the default admin user, account, and discount code. Provide the password as the argument.',
        )

    def handle(self, *args, **options):
        something_generated = False

        if options['terms']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Starting Terms and Conditions generation...'))
            orchestrator = TermsUpdateOrchestrator(command=self)
            orchestrator.run()

        if options['archive']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Starting database archive...'))
            archiver = DatabaseArchiver(command=self)
            archiver.run()

        if options['admin_user']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Setting up admin user...'))
            generator = AdminUserGenerator(command=self, password=options['admin_user'])
            generator.run()

        if not something_generated:
            self.stdout.write(self.style.WARNING(
                'No generation flag specified. Please use --terms, --archive, or --admin_user.'
            ))


