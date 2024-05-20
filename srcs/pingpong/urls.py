""" This module contains the urls for the pingpong app. """

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

from pingpong.views import (
    SignupView,
    ProfileView,
    PasswordView,
    VerifyEmailView,
    VerifyTokenView,
    TwoStepVerificationCodeView,
    LoginView,
    TwoStepVerification,
    FriendsView,
    FriendsRequestsView,
    VerificationEmailView,
    UploadPictureView,
    ForgetPasswordView,
    FriendsSearchView,
    LeaderboardView,
    UserDetailsView,
    ChatView,
    MessagesView,
    BlockUserView,
)


urlpatterns = [
    path("", views.home, name="home"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("api/login/", LoginView.as_view(), name="login"),
    path(
        "api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path(
        "api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"
    ),
    path("api/profile/", ProfileView.as_view(), name="edit_profile"),
    path("api/password/", PasswordView.as_view(), name="change_password"),
    path("api/verify-token/", VerifyTokenView.as_view(), name="verify_token"),
    path("api/friends/", FriendsView.as_view(), name="friend_list"),
    path(
        "api/friends-requests/",
        FriendsRequestsView.as_view(),
        name="friend_request_list",
    ),
    path(
        "api/send-verification-code-email/",
        TwoStepVerificationCodeView.as_view(),
        name="send_verification_email",
    ),
    path(
        "api/two-step-verification/",
        TwoStepVerification.as_view(),
        name="two_step_verification",
    ),
    path(
        "api/send-verification-email/",
        VerificationEmailView.as_view(),
        name="verification_email",
    ),
    path(
        "reset-password/", ForgetPasswordView.as_view(), name="reset_password"
    ),
    path(
        "api/upload-picture/",
        UploadPictureView.as_view(),
        name="upload_picture",
    ),
    path(
        "api/friends-search/",
        FriendsSearchView.as_view(),
        name="friends_search",
    ),
    path("api/leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path(
        "api/user-details/",
        UserDetailsView.as_view(),
        name="user_details_page",
    ),
    path("api/chat/", ChatView.as_view(), name="chat"),
    path("api/messages/", MessagesView.as_view(), name="messages"),
    path("api/users/block/", BlockUserView.as_view(), name="block_user"),
    path("", views.home, name="home"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("api/login/", LoginView.as_view(), name="login"),
    path(
        "api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path(
        "api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"
    ),
    path("api/profile/", ProfileView.as_view(), name="edit_profile"),
    path("api/password/", PasswordView.as_view(), name="change_password"),
    path("api/verify-token/", VerifyTokenView.as_view(), name="verify_token"),
    path("api/friends/", FriendsView.as_view(), name="friend_list"),
    path(
        "api/friends-requests/",
        FriendsRequestsView.as_view(),
        name="friend_request_list",
    ),
    path(
        "api/send-verification-code-email/",
        TwoStepVerificationCodeView.as_view(),
        name="send_verification_email",
    ),
    path(
        "api/two-step-verification/",
        TwoStepVerification.as_view(),
        name="two_step_verification",
    ),
    path(
        "api/send-verification-email/",
        VerificationEmailView.as_view(),
        name="verification_email",
    ),
    path(
        "reset-password/", ForgetPasswordView.as_view(), name="reset_password"
    ),
    path(
        "api/upload-picture/",
        UploadPictureView.as_view(),
        name="upload_picture",
    ),
    path(
        "api/friends-search/",
        FriendsSearchView.as_view(),
        name="friends_search",
    ),
    path("api/leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path(
        "api/user-details/",
        UserDetailsView.as_view(),
        name="user_details_page",
    ),
    path("api/chat/", ChatView.as_view(), name="chat"),
    path("api/messages/", MessagesView.as_view(), name="messages"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
