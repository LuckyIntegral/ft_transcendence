from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from pingpong.views import SignupView, ProfileView, PasswordView, VerifyEmailView

urlpatterns = [
    path('', views.home, name='home'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/signup/', SignupView.as_view(), name='signup'),
	path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/profile/', ProfileView.as_view(), name='edit_profile'),
	path('api/password/', PasswordView.as_view(), name='change_password'),
	path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
]