from django.urls import path
from .views import (
    RegisterView, 
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminUserViewSet
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('admin/users/', AdminUserViewSet.as_view(), name='admin-users'),
]
