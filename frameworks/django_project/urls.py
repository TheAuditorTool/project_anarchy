"""
URL Configuration for django_project
Phase 13: Framework Misconfigurations
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin site enabled with default URL (security issue)
    path('admin/', admin.site.urls),
    
    # Debug toolbar exposed in production (when DEBUG=True)
    # This would normally be wrapped in if settings.DEBUG
    path('__debug__/', include('debug_toolbar.urls')),
    
    # API endpoints without versioning
    path('api/', include('api.urls')),
    
    # Sensitive endpoints without protection
    path('api/users/', include('users.urls')),
    path('api/auth/', include('auth.urls')),
]

# Serving media files in production (insecure)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom 404 and 500 handlers that might expose information
handler404 = 'django_project.views.custom_404'
handler500 = 'django_project.views.custom_500'