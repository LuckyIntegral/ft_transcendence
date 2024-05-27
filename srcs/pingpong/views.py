""" This module contains the views for the pingpong app.
    Views are used to handle http requests and return responses.
"""

import random
import math
import time
from PIL import Image
from django.shortcuts import render
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpResponse
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .validators import *
from .models import *
from .utils import (
    sendVerificationEmail,
    sendTwoStepVerificationEmail,
    getUserFromToken,
    sendPasswordResetEmail,
    getCompressedPicture,
    blockChainCreateGame,
    generateToken,
)
from .utils import (
    sendVerificationEmail,
    sendTwoStepVerificationEmail,
    getUserFromToken,
    sendPasswordResetEmail,
    getCompressedPicture,
    blockChainCreateGame,
    generateToken,
    create_chat_with_notification_user,
)
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone
from datetime import timedelta
from django.db import models
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import html


# Create your views here.


def home(request):
    """This method is used to render the home page."""
    return render(request, "home.html", {})


class VerifyTokenView(APIView):
    """This view is used to verify the JWT token.
    It has following methods:
    1. post: This method is used to verify the JWT token.
    """

    def post(self, request, format=None):
        """This method is used to verify the JWT token."""
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return Response(
                {"error": "Please provide a token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "Token is valid"}, status=status.HTTP_200_OK)


class LoginView(APIView):
    """This view is used to login a user.
    It has following methods:
    1. post: This method is used to login a user.
    """

    def post(self, request, format=None):
        """This method is used to login a user."""
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Please provide all required fields"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "Incorrect password or username"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return Response(
                {"error": "Incorrect password or username"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.userprofile.isTwoStepEmailAuthEnabled:
            token = str(RefreshToken.for_user(user))
            return Response({"token": token}, status=status.HTTP_200_OK)

        return Response(
            {"status": "Proccess 2-step verification"},
            status=status.HTTP_202_ACCEPTED,
        )


class SignupView(APIView):
    """This view is used to sign up a user.
    It has following methods:
    1. post: This method is used to sign up a user.
    """

    def post(self, request, format=None):
        """This method is used to sign up a user."""
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        password_confirm = request.data.get("password_confirm")

        if not username or not email or not password or not password_confirm:
            return Response(
                {"error": "Please provide all required fields"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        displayName = username
        username = username.lower()
        email = email.lower()
        email = html.escape(email)
        if len(username) > 150 or len(email) > 150 or len(password) > 128:
            return Response(
                {"error": "Username, email, or password is too long"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username is already taken"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email is already taken"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if password != password_confirm:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            UsernameValidator().validate(username)
        except ValidationError as e:
            return Response(
                {"error": "Username should contain only alphanumeric characters"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            validate_password(password)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

        user = User.objects.create_user(username=username, email=email, password=password)
        userProfile = UserProfile.objects.create(user=user, displayName=displayName)
        create_chat_with_notification_user(user)
        return Response(
            {"status": "Successfully signed up"},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """This view is used to verify the email of a user.
    It has following methods:
    1. get: This method is used to verify the email of a user.
        TODO: shold be put bc it changes the state of the server
    """

    def get(self, request, format=None):
        """This method is used to verify the email of a user."""
        token = request.query_params.get("token")
        if not token:
            return HttpResponse("Please provide a token", status=400)
        try:
            decoded_token = RefreshToken(token)
        except (InvalidToken, TokenError):
            return HttpResponse("Invalid token", status=400)

        user_id = decoded_token["user_id"]
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return HttpResponse("User does not exist", status=404)

        if user.userprofile.emailVerified:
            return HttpResponse("Email is already verified", status=400)
        user.userprofile.emailVerified = True
        user.userprofile.save()

        return HttpResponse("Email verified successfully", status=200)


class PasswordView(APIView):
    """This view is used to change the password of a user.
    It has following methods:
    1. put: This method is used to change the password of a user.
    """

    def put(self, request, format=None):
        """This method is used to change the password of a user."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        new_password_confirm = request.data.get("new_password_confirm")

        if not old_password or not new_password or not new_password_confirm:
            return Response(
                {"error": "Please provide all required fields"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Old password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_password != new_password_confirm:
            return Response(
                {"error": "New passwords do not match"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if len(new_password) > 128:
            return Response(
                {"error": "Password is too long"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_402_PAYMENT_REQUIRED)

        user.set_password(new_password)
        user.save()

        return Response(
            {"status": "Password updated successfully"},
            status=status.HTTP_200_OK,
        )


class ProfileView(APIView):
    """This view is used to get and update the profile of a user.
    It has following methods:
    1. get: This method is used to get the profile of a user.
    2. put: This method is used to update the profile of a user.
    """

    def get(self, request, format=None):
        """This method is used to get the profile of a user."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            "username": user.username,
            "email": user.email,
            "displayName": user.userprofile.displayName,
            "emailVerified": user.userprofile.emailVerified,
            "twoStepVerificationEnabled": user.userprofile.isTwoStepEmailAuthEnabled,
            "picture": user.userprofile.picture.url,
            "pictureSmall": user.userprofile.pictureSmall.url,
        }
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, format=None):
        """This method is used to update the profile of a user."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        displayName = html.escape(request.data.get("displayName"))
        if len(displayName) > 50 or len(displayName) == 0:
            return Response(
                {"error": "Invalid display name"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        email = request.data.get("email")
        email = html.escape(email)
        email_validator = EmailValidator()
        if email is not None and len(email):
            try:
                email_validator.validate(email)
            except ValidationError:
                return Response(
                    {"error": "Invalid email address"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        try:
            cur_user = User.objects.get(email=email)
        except User.DoesNotExist:
            cur_user = None
        if cur_user is not None and cur_user.username != user.username:
            return Response(
                {"error": "Email is already taken"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if email is not None and len(email) != 0 and email != user.email:
            user.userprofile.emailVerified = False
            token = str(RefreshToken.for_user(user))
            user.userprofile.isTwoStepEmailAuthEnabled = False
            sendVerificationEmail(email, token)
        if len(email) > 254:
            return Response(
                {"error": "Invalid email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email = email
        user.userprofile.displayName = displayName
        user.save()
        user.userprofile.save()
        return Response(
            {"status": "Profile updated successfully"},
            status=status.HTTP_200_OK,
        )


class FriendsRequestsView(APIView):
    """This view is used to send, accept, and reject friend requests.
    It has three methods:
    1. get: This method is used to get all the friend requests sent to the user.
    2. post: This method is used to send a friend request to a user.
    3. put: This method is used to accept or reject a friend request.
    """

    def get(self, request):
        """This method is used to get all the friend requests sent to the user."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        page = request.query_params.get("page")
        page = 0 if not page else int(page)
        page_size = request.query_params.get("pageSize")
        page_size = 10 if not page_size else int(page_size)

        friend_request_list = FriendRequest.objects.filter(toUser=user.id).order_by(
            "fromUser__username"
        )
        request_list_count = friend_request_list.count()
        response = {
            "data": [],
            "page": 0,
            "totalPages": 0,
        }

        if request_list_count == 0:
            return Response(response, status=status.HTTP_200_OK)

        if page_size * page >= request_list_count or page < 0 or page_size < 1:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)

        response["page"] = page
        response["totalPages"] = math.ceil(request_list_count / page_size)

        friend_request_list = friend_request_list[
            page_size * page : min(page_size * (page + 1), request_list_count)
        ]

        for friend_request in friend_request_list:
            response["data"].append(
                {
                    "email": friend_request.fromUser.email,
                    "username": friend_request.fromUser.username,
                }
            )
        return Response(response, status=status.HTTP_200_OK)

    def post(self, request):
        """This method is used to send a friend request to a user."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        friend_username = request.data.get("friend_username")
        if not friend_username:
            return Response(
                {"error": "Please provide a friend username"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            friend_user = User.objects.get(username=friend_username)
            friend = UserProfile.objects.get(user=friend_user)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User does not have a profile"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if friend.id == user.id:
            return Response(
                {"error": "You cannot add yourself as a friend"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if friend in user.userprofile.friendList.all():
            return Response(
                {"error": "User is already in your friend list"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if FriendRequest.objects.filter(fromUser=user, toUser=friend_user).exists():
            return Response(
                {"error": "You have already sent a friend request to the user"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if FriendRequest.objects.filter(fromUser=friend_user, toUser=user).exists():
            return Response(
                {"error": "User has already sent you a friend request"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        friend_request = FriendRequest.objects.create(fromUser=user, toUser=friend_user)
        friend_request.save()
        return Response(
            {"status": "Friend request sent successfully"},
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        """This method is used to accept or reject a friend request."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        friend_username = request.data.get("friend_username")
        action = request.data.get("action")
        if not friend_username:
            return Response(
                {"error": "Please provide a friend username"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            friend_user = User.objects.get(username=friend_username)
            friend = UserProfile.objects.get(user=friend_user)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User does not have a profile"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not FriendRequest.objects.filter(fromUser=friend_user, toUser=user).exists():
            return Response(
                {"error": "User has not sent you a friend request"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        FriendRequest.objects.filter(fromUser=friend_user, toUser=user).delete()
        if action == "accept":
            user.userprofile.friendList.add(friend)
            user.userprofile.save()
            return Response(
                {"status": "Friend request accepted successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"status": "Friend request rejected successfully"},
            status=status.HTTP_200_OK,
        )


class FriendsView(APIView):
    """This view is used to get and remove friends.
    It has two methods:
    1. get: This method is used to get all the friends of the user.
    2. delete: This method is used to remove a friend
        from the user's friend list.
    """

    def get(self, request):
        """This method is used to get all the friends of the user."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        page = request.query_params.get("page")
        page = 0 if not page else int(page)
        page_size = request.query_params.get("pageSize")
        page_size = 10 if not page_size else int(page_size)

        friend_list = user.userprofile.friendList.all().order_by("user__username")
        friend_list = friend_list.exclude(user__username="Notifications")
        friend_list_count = friend_list.count()
        response = {
            "data": [],
            "page": 0,
            "totalPages": 0,
        }

        if friend_list_count == 0:
            return Response(response, status=status.HTTP_200_OK)

        if page_size * page >= friend_list_count or page < 0 or page_size < 1:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)

        response["page"] = page
        response["totalPages"] = math.ceil(friend_list_count / page_size)

        friend_list = friend_list[
            page_size * page : min(page_size * (page + 1), friend_list_count)
        ]

        for friend in friend_list:
            response["data"].append(
                {
                    "pictureSmall": friend.pictureSmall.url,
                    "email": friend.user.email,
                    "username": friend.user.username,
                }
            )
        return Response(response, status=status.HTTP_200_OK)

    def delete(self, request):
        """This method is used to remove a friend from the user's friend list."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        friend_username = request.data.get("friend_username")
        if not friend_username:
            return Response(
                {"error": "Please provide a friend username"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            friend_user = User.objects.get(username=friend_username)
            friend = UserProfile.objects.get(user=friend_user)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User does not have a profile"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if friend.id == user.id:
            return Response(
                {"error": "You cannot remove yourself from your friend list"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if friend not in user.userprofile.friendList.all():
            return Response(
                {"error": "User is not in your friend list"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.userprofile.friendList.remove(friend)
        user.userprofile.save()
        return Response(
            {"status": "Friend removed successfully"},
            status=status.HTTP_200_OK,
        )


class TwoStepVerificationCodeView(APIView):
    """This view is used to send and verify the 2-step verification code.
    It has following methods:
    1. put: This method is used to send the 2-step verification code.
    2. post: This method is used to verify the 2-step verification code.
    """

    def put(self, request, format=None):
        """This method is used to send the 2-step verification code."""
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            username = request.data.get("username")
            password = request.data.get("password")
            try:
                user_password_validator = UsernamePasswordValidator()
                user = user_password_validator.validate(username, password)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                token = JWTTokenValidator().validate(auth_header)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user = getUserFromToken(token)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        verification_email_code = str(random.randint(100000, 999999))
        user.userprofile.verificationEmailCode = verification_email_code
        user.userprofile.save()
        sendTwoStepVerificationEmail(user.email, verification_email_code)
        return Response(
            {"status": "Verification code sent successfully"},
            status=status.HTTP_200_OK,
        )

    def post(self, request, format=None):
        """This method is used to verify the 2-step verification code."""
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            username = request.data.get("username")
            password = request.data.get("password")
            try:
                user_password_validator = UsernamePasswordValidator()
                user = user_password_validator.validate(username, password)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                token = JWTTokenValidator().validate(auth_header)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user = getUserFromToken(token)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        verification_email_code = request.data.get("code")
        if not verification_email_code:
            return Response(
                {"error": "Please provide a verification code"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.userprofile.verificationEmailCode != verification_email_code:
            return Response(
                {"error": "Incorrect verification code"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.userprofile.verificationEmailCode = ""
        user.userprofile.save()
        return Response(
            {"status": "Verification successful"}, status=status.HTTP_200_OK
        )


class TwoStepVerification(APIView):
    """This view is used to enable and disable 2-step email verification.
    It has following methods:
    1. get: This method is used to check if 2-step email verification is enabled.
    2. put: This method is used to enable or disable 2-step email verification.
    """

    def get(self, request, format=None):
        """This method is used to check if 2-step email verification is enabled."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not user.userprofile.emailVerified:
            return Response(
                {"error": "Email is not verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.userprofile.isTwoStepEmailAuthEnabled:
            return Response(
                {"status": "2-step email verification is not enabled"},
                status=status.HTTP_202_ACCEPTED,
            )
        return Response(
            {"status": "2-step email verification enabled"},
            status=status.HTTP_200_OK,
        )

    def put(self, request, format=None):
        """This method is used to enable or disable 2-step email verification."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get("action")
        if action == None:
            return Response(
                {"error": "Please provide an action"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.userprofile.emailVerified == False:
            return Response(
                {"error": "Email is not verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.data.get("code") == None:
            return Response(
                {"error": "Please provide a code"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.userprofile.verificationEmailCode != request.data.get("code"):
            return Response(
                {"error": "Incorrect code"}, status=status.HTTP_400_BAD_REQUEST
            )

        if action == "enable":
            if user.userprofile.isTwoStepEmailAuthEnabled:
                return Response(
                    {"error": "2-step email verification is already enabled"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.userprofile.isTwoStepEmailAuthEnabled = True
            user.userprofile.save()
            return Response(
                {"status": "2-step email verification enabled"},
                status=status.HTTP_200_OK,
            )
        if action == "disable":
            if not user.userprofile.isTwoStepEmailAuthEnabled:
                return Response(
                    {"error": "2-step email verification is already disabled"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.userprofile.isTwoStepEmailAuthEnabled = False
            user.userprofile.save()
            return Response(
                {"status": "2-step email verification disabled"},
                status=status.HTTP_200_OK,
            )
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class VerificationEmailView(APIView):
    def get(self, request, format=None):
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if user.userprofile.emailVerified:
            return Response(
                {"error": "Email is verified already"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = str(RefreshToken.for_user(user))
        sendVerificationEmail(user.email, token)
        return Response(
            {"status": "Verification email sent successfully"},
            status=status.HTTP_200_OK,
        )


class ForgetPasswordView(APIView):
    def post(self, request, format=None):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Please provide an email"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if user.userprofile.emailVerified == False:
            return Response(
                {"error": "Email is not verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tokenGenerator = PasswordResetTokenGenerator()
        token = tokenGenerator.make_token(user)
        user.userprofile.passwordResetToken = token
        user.userprofile.save()
        sendPasswordResetEmail(email, token)
        return Response(
            {"status": "Password reset email sent successfully"},
            status=status.HTTP_200_OK,
        )

    def get(self, request, format=None):
        token = request.query_params.get("token")
        if not token:
            return HttpResponse(
                {"Please provide a token"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(userprofile__passwordResetToken=token)
        except (User.DoesNotExist, Exception):
            return HttpResponse({"Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        user.userprofile.passwordResetToken = ""
        user.userprofile.save()
        user.set_password("Pong-42!")
        user.save()
        return HttpResponse('Your password was set to "Pong-42!"', status=200)


class UploadPictureView(APIView):
    def post(self, request, format=None):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return Response(
                {"error": "Please provide a token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        picture = request.data.get("picture")
        if not picture:
            return Response(
                {"error": "Please provide a picture"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if picture.size > settings.MAX_UPLOAD_SIZE:
            return Response(
                {"error": "File size is too large"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            image = Image.open(picture)
            image.verify()
            image = Image.open(picture)
        except Exception:
            return Response(
                {"error": "Invalid image"}, status=status.HTTP_400_BAD_REQUEST
            )
        if (
            user.userprofile.picture != None
            and user.userprofile.picture.url != "/media/images/default.jpg"
        ):
            user.userprofile.picture.delete()
            user.userprofile.pictureSmall.delete()

        commpressedPicture = getCompressedPicture(image)
        smallImageField = user.userprofile.pictureSmall
        smallImageName = user.username + "_picture_small.jpg"
        smallImagePath = settings.MEDIA_ROOT + smallImageName

        smallImageField.save(
            smallImageName,
            InMemoryUploadedFile(
                commpressedPicture,
                None,
                smallImageName,
                "image/jpeg",
                commpressedPicture.tell,
                None,
            ),
        )
        user.userprofile.picture = picture
        user.userprofile.save()
        return Response(
            {"status": "Picture uploaded successfully"},
            status=status.HTTP_200_OK,
        )


class FriendsSearchView(APIView):
    """This view is used to search for friends.
    It has following methods:
    1. get: This method is used to search for friends using a query as a regex.
    """

    def get(self, request, format=None):
        """This method is used to search for friends."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        page_size = request.query_params.get("pageSize")
        page_size = 10 if not page_size else int(page_size)
        search_query = request.query_params.get("search_query")

        data = []
        if search_query:
            try:
                friend_list = UserProfile.objects.filter(
                    user__username__icontains=search_query
                ).order_by("user__username")
            except UserProfile.DoesNotExist:
                return Response(data, status=status.HTTP_200_OK)
            friend_list = friend_list.exclude(user__username="Notifications")
            for friend in friend_list[: min(page_size, friend_list.count())]:
                if friend.user.username == user.username:
                    continue
                data.append(
                    {
                        "email": friend.user.email,
                        "username": friend.user.username,
                        "picture": friend.pictureSmall.url,
                    }
                )
        return Response(data, status=status.HTTP_200_OK)


class LeaderboardView(APIView):
    """This view is used to get the leaderboard.
    It has following methods:
    1. get: This method is used to get the leaderboard.
    """

    def get(self, request, format=None):
        """This method is used to get the leaderboard."""
        auth_header = request.headers.get("Authorization")
        try:
            JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        page = request.query_params.get("page")
        page = 0 if not page else int(page)
        page_size = request.query_params.get("pageSize")
        page_size = 10 if not page_size else int(page_size)

        player_list = UserProfile.objects.all().order_by("-gamesWon", "user__username")
        player_list = player_list.exclude(user__username="Notifications")
        player_list_count = player_list.count()
        response = {
            "data": [],
            "page": 0,
            "totalPages": 0,
        }

        if player_list_count == 0:
            return Response(response, status=status.HTTP_200_OK)

        if page_size * page >= player_list_count or page < 0 or page_size < 1:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)

        response["page"] = page
        response["totalPages"] = math.ceil(player_list_count / page_size)

        player_list = player_list[
            page_size * page : min(page_size * (page + 1), player_list_count)
        ]

        for player in player_list:
            response["data"].append(
                {
                    "photo": player.pictureSmall.url,
                    "username": player.user.username,
                    "wins": player.gamesWon,
                    "games": player.gamesPlayed,
                }
            )

        return Response(response, status=status.HTTP_200_OK)

class UserSearchView(APIView):
    """ This view is used to search for users.
    It has following methods:
    1. get: This method is used to search for users using a query as a regex.
    """

    def get(self, request, format=None):
        """This method is used to search for users.
        The request should contain the following query parameters:
            page_size, page_index, is_friends_only, search_query
        Example:
            /api/user-search?page_size=10&page_index=0&is_friends_only=false&search_query=test
        """
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        page_size = request.query_params.get("page_size")
        if page_size and page_size.isdigit() is False:
            return Response({"error": "Invalid page_size"}, status=status.HTTP_400_BAD_REQUEST)
        page_size = 10 if not page_size else int(page_size)

        page_index = request.query_params.get("page_index")
        if page_index and page_index.isdigit() is False:
            return Response({"error": "Invalid page_index"}, status=status.HTTP_400_BAD_REQUEST)
        page_index = 0 if not page_index else int(page_index)

        is_friends_only = request.query_params.get("is_friends_only")
        is_friends_only = is_friends_only == "true"

        search_query = request.query_params.get("username")

        response = {
            "data": [],
            "page": 0,
            "totalPages": 0,
        }
        if search_query:
            user_list = []
            if is_friends_only:
                user_list = user.userprofile.friendList.filter(
                    user__username__icontains=search_query
                ).order_by("user__username")
            else:
                user_list = UserProfile.objects.filter(
                    user__username__icontains=search_query
                ).order_by("user__username")
            lower_bound = page_size * page_index
            upper_bound = min(page_size * (page_index + 1), user_list.count())
            if lower_bound >= user_list.count() or lower_bound < 0 or page_size < 1:
                return Response(response, status=status.HTTP_200_OK)
            for record in user_list[lower_bound:upper_bound]:
                if record.user.username == user.username:
                    continue
                response["data"].append(
                    {
                        "picture": record.pictureSmall.url,
                        "username": record.user.username,
                        "online": record.lastOnline > timezone.now() - timedelta(minutes=1),
                    }
                )
            response["page"] = page_index
            response["totalPages"] = math.ceil(user_list.count() / page_size)

        return Response(response, status=status.HTTP_200_OK)

class UserDetailsView(APIView):
    """This view is used to get the details of a user.
    It has following methods:
    1. get: This method is used to get the details of a user.
    """

    def get(self, request, format=None):
        """This method is used to get the details of a user."""
        auth_header = request.headers.get("Authorization")
        try:
            JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        username = request.query_params.get("username")
        if not username:
            return Response(
                {"error": "Please provide a username"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(username=username)
            userProfile = UserProfile.objects.get(user=user)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User does not have a profile"},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = {
            "username": user.username,
            "email": user.email,
            "displayName": (
                userProfile.displayName if userProfile.displayName else "no info"
            ),
            "picture": userProfile.picture.url,
            "wins": userProfile.gamesWon,
            "games": userProfile.gamesPlayed,
        }
        return Response(data, status=status.HTTP_200_OK)


class ChatView(APIView):
    """This view is used to get the chat messages.
    It has following methods:
    1. get: This method is used to get the chat messages.
    """

    def put(self, request, format=None):
        """This method is used to get the chat messages."""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            chat = Chat.objects.get(token=request.data.get("token"))
        except Chat.DoesNotExist:
            return Response(
                {"error": "Chat does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        secondUser = chat.userOne if chat.userOne != user else chat.userTwo
        data = {
            "picture": secondUser.userprofile.pictureSmall.url,
            "username": secondUser.username,
            "token": chat.token,
            "blocked": Block.objects.filter(blocker=user, blocked=secondUser).exists(),
            "myPicture": user.userprofile.pictureSmall.url,
            "messages": [],
        }
        for message in chat.messages.order_by("timestamp"):
            if message.sender != user and message.messageRecipient.isRead == False:
                message.messageRecipient.isRead = True
                message.messageRecipient.save()
            data["messages"].append(
                {
                    "message": message.message,
                    "type": "income" if message.sender != user else "outcome",
                    "timestamp": message.timestamp,
                    "sender": message.sender.username,
                    "picture": message.sender.userprofile.pictureSmall.url,
                }
            )
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        """Method to create a chat"""
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get("username")
        if not username:
            return Response(
                {"error": "Please provide a username"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            secondUser = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if secondUser == user:
            return Response(
                {"error": "You cannot chat with yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            chat = Chat.objects.get(
                Q(userOne=user, userTwo=secondUser)
                | Q(userOne=secondUser, userTwo=user)
            )
        except Chat.DoesNotExist:
            chatToken = generateToken()
            while Chat.objects.filter(token=chatToken).exists():
                chatToken = generateToken()
            chat = Chat.objects.create(
                userOne=user, userTwo=secondUser, token=chatToken
            )
            chat.save()
        return Response({"token": chat.token}, status=status.HTTP_200_OK)


class MessagesView(APIView):
    def get(self, request, format=None):
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        chats = Chat.objects.filter(Q(userOne=user) | Q(userTwo=user))
        try:
            notification_user = User.objects.get(username="Notifications")
            notification_user.userprofile.lastOnline = timezone.now()
            notification_user.userprofile.save()
        except User.DoesNotExist:
            print("Notifications user does not exist")
        data = []
        for chat in chats:
            secondUserUsername = (
                chat.userOne.username if chat.userOne != user else chat.userTwo.username
            )
            secondUser = User.objects.get(username=secondUserUsername)
            secondUserLastOnline = secondUser.userprofile.lastOnline
            secondUserPicture = secondUser.userprofile.pictureSmall.url
            lastMessage = chat.messages.order_by("-timestamp").first()
            if lastMessage is not None:
                data.append(
                    {
                        "username": (
                            chat.userOne.username
                            if chat.userOne != user
                            else chat.userTwo.username
                        ),
                        "isOnline": (
                            True
                            if secondUserLastOnline
                            > timezone.now() - timedelta(minutes=1)
                            else False
                        ),
                        "lastOnline": secondUserLastOnline,
                        "picture": secondUserPicture,
                        "isRead": (
                            lastMessage.messageRecipient.isRead
                            if lastMessage.sender != user
                            else True
                        ),
                        "token": chat.token,
                        "lastTimestamp": lastMessage.timestamp,
                    }
                )
            else:
                data.append(
                    {
                        "username": (
                            chat.userOne.username
                            if chat.userOne != user
                            else chat.userTwo.username
                        ),
                        "isOnline": (
                            True
                            if secondUserLastOnline
                            > timezone.now() - timedelta(minutes=1)
                            else False
                        ),
                        "lastOnline": secondUserLastOnline,
                        "picture": secondUserPicture,
                        "isRead": True,
                        "token": chat.token,
                        "lastTimestamp": chat.timestamp,
                    }
                )
        if len(data) > 0:
            data.sort(key=lambda x: x["lastTimestamp"], reverse=True)
        return Response(data, status=status.HTTP_200_OK)


class BlockUserView(APIView):
    """This view is used to block a user.
    It has following methods:
    1. put: This method is used to unblock/block a user."""

    def put(self, request, format=None):
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        username = request.data.get("username")
        if not username:
            return Response(
                {"error": "Please provide a username"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            secondUser = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if secondUser == user:
            return Response(
                {"error": "You cannot block yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if secondUser.username == "Notifications":
            return Response(
                {"error": "You cannot block the Notifications user", "button": "Unblock"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blockRel = Block.objects.filter(blocker=user, blocked=secondUser)
        if blockRel.exists():
            blockRel.delete()
            return Response(
                {"status": "User unblocked successfully", "button": "Block"},
                status=status.HTTP_200_OK,
            )
        block = Block.objects.create(blocker=user, blocked=secondUser)
        return Response(
            {"status": "User blocked successfully", "button": "Unblock"},
            status=status.HTTP_200_OK,
        )


class PongLobbyView(APIView):

    def post(self, request, format=None):
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            userHost = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        usernameGuest = request.data.get("username")
        try:
            userGuest = User.objects.get(username=usernameGuest)
        except User.DoesNotExist as e:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if userHost == userGuest:
            return Response(
                {"error": "You cannot play with yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Block.objects.filter(blocker=userGuest, blocked=userHost).exists():
            return Response(
                {"error": "User has blocked you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lobbyId = generateToken()
        while PongLobby.objects.filter(token=lobbyId).exists():
            lobbyId = generateToken()
        PongLobby.objects.create(token=lobbyId, host=userHost, guest=userGuest)
        data = {"token": lobbyId}
        return Response(data, status=status.HTTP_201_CREATED)


class TournamentLobbyView(APIView):

    def all_users_exists(self, users) -> bool:
        if len(users) != len(set(users)):
            return False
        for user in users:
            if not User.objects.filter(username=user).exists():
                return False
        return True

    def post(self, request, format=None):
        auth_header = request.headers.get("Authorization")
        try:
            token = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = getUserFromToken(token)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        tournament_id = generateToken()
        while TournamentLobby.objects.filter(token=tournament_id).exists():
            tournament_id = generateToken()

        users = [
            request.data.get("player1"),
            request.data.get("player2"),
            request.data.get("player3"),
            request.data.get("player4"),
        ]
        if not self.all_users_exists(users):
            return Response({"error": "Nice try"}, status=status.HTTP_400_BAD_REQUEST)
        first_game_token = generateToken()
        while PongLobby.objects.filter(token=first_game_token).exists():
            first_game_token = generateToken()
        second_game_token = generateToken()
        while PongLobby.objects.filter(token=second_game_token).exists():
            second_game_token = generateToken()

        final_game_token = generateToken()
        while PongLobby.objects.filter(token=final_game_token).exists():
            final_game_token = generateToken()

        player1 = User.objects.get(username=users[0])
        player2 = User.objects.get(username=users[1])
        player3 = User.objects.get(username=users[2])
        player4 = User.objects.get(username=users[3])

        lower_bracket = PongLobby.objects.create(
            token=first_game_token,
            host=player1,
            guest=player2
        )
        upper_bracket = PongLobby.objects.create(
            token=second_game_token,
            host=player3,
            guest=player4
        )
        final = PongLobby.objects.create(
            token=final_game_token
        )
        TournamentLobby.objects.create(
            token=tournament_id,
            upper_bracket=upper_bracket,
            lower_bracket=lower_bracket,
            final=final
        )
        return Response({"token": tournament_id}, status=status.HTTP_201_CREATED)
