from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from pingpong.views import SignupView, ProfileView, PasswordView, VerifyEmailView, VerifyTokenView
from pingpong.views import TwoStepVerificationCodeView, LoginView, TwoStepVerification

urlpatterns = [
    path('', views.home, name='home'),
	path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
	path('api/login/', views.LoginView.as_view(), name='login'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/signup/', SignupView.as_view(), name='signup'),
	path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/profile/', ProfileView.as_view(), name='edit_profile'),
	path('api/password/', PasswordView.as_view(), name='change_password'),
	path('api/verify-token/', VerifyTokenView.as_view(), name='verify_token'),
	path('api/send-verification-code-email/', TwoStepVerificationCodeView.as_view(), name='send_verification_email'),
	path('api/login/', LoginView.as_view(), name='login'),
	path('api/two-step-verification/', TwoStepVerification.as_view(), name='two_step_verification'),
]