import pytest
from io import StringIO
from django.core.management import call_command
from django.contrib.sites.models import Site

@pytest.mark.django_db
class TestFixSiteDomainsCommand:

    def test_updates_default_site(self):
        site = Site.objects.get(pk=1)
        site.domain = 'example.com'
        site.name = 'example.com'
        site.save()
        
        out = StringIO()
        call_command('fix_site_domains', stdout=out)
        
        site.refresh_from_db()
        
        assert site.domain == 'www.bloomprint.com.au'
        assert site.name == 'www.bloomprint.com.au'
        assert "Successfully updated site domain" in out.getvalue()

    def test_site_already_updated(self):
        site = Site.objects.get(pk=1)
        site.domain = 'www.bloomprint.com.au'
        site.name = 'www.bloomprint.com.au'
        site.save()
        
        err = StringIO()
        call_command('fix_site_domains', stderr=err)
        
        assert "Could not find a site with domain 'example.com'" in err.getvalue()
