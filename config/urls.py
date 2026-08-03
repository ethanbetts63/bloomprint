"""
URL configuration for bloomprint project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from users.views.token_views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
)
from django.contrib.sitemaps.views import sitemap
from .sitemaps import StaticViewSitemap

sitemaps = {
    'static': StaticViewSitemap,
}

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/data/", include("data_management.urls")),
    path("api/events/", include("events.urls")),
    path("api/business-accounts/", include("partners.urls")),
    path("api/marketing/", include("marketing.urls")),

    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),

    path('api/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/logout/', LogoutView.as_view(), name='token_logout'),

    re_path(r'^(?!api/|admin/|sitemap\.xml).*$', TemplateView.as_view(template_name="index.html")),
]
