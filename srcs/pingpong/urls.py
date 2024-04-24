from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from pingpong.views import SignupView, VerifyTokenView

urlpatterns = [
    path('', views.home, name='home'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/signup/', SignupView.as_view(), name='signup'),
    path('api/verify-token/', VerifyTokenView.as_view(), name='verify_token'),
]