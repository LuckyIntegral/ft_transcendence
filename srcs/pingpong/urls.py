from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from pingpong.views import SignupView, VerifyTokenView, ProfileView, PasswordView

urlpatterns = [
    path('', views.home, name='home'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/signup/', SignupView.as_view(), name='signup'),
    path('api/verify-token/', VerifyTokenView.as_view(), name='verify_token'),
	path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/profile/', ProfileView.as_view(), name='edit_profile'),
	path('api/password/', PasswordView.as_view(), name='change_password')
]