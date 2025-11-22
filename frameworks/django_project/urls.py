"""
URL Configuration for django_project
Phase 13: Framework Misconfigurations
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Import taint flow views for Angular cross-boundary testing
from . import taint_views

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

    # Taint flow routes for Angular cross-boundary testing
    path('api/users/search', taint_views.search_users, name='search_users'),
    path('api/users/<int:user_id>', taint_views.user_detail, name='user_detail'),
    path('api/users/<int:user_id>/avatar', taint_views.upload_avatar, name='upload_avatar'),
    path('api/users/<int:user_id>/notification', taint_views.render_notification, name='render_notification'),
    path('api/admin/exec', taint_views.admin_exec, name='admin_exec'),
    path('api/webhooks/register', taint_views.register_webhook, name='register_webhook'),
    path('api/users/create', taint_views.create_user, name='create_user'),
    path('api/files/read', taint_views.read_file, name='read_file'),
]

# Serving media files in production (insecure)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom 404 and 500 handlers that might expose information
handler404 = 'django_project.views.custom_404'
handler500 = 'django_project.views.custom_500'