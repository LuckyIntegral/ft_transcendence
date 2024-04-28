from django.shortcuts import render
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import UntypedToken, RefreshToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
from .validators import *

from .models import *


# Create your views here.

def home(request):
	return render(request, 'home.html', {})

class VerifyTokenView(APIView):
	def post(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		if not authHeader:
			return Response({'error': 'Please provide a token'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		return Response({'status': 'Token is valid'}, status=status.HTTP_200_OK)

class SignupView(APIView):
	def post(self, request, format=None):
		username = request.data.get('username')
		email = request.data.get('email')
		password = request.data.get('password')
		password_confirm = request.data.get('password_confirm')

		if not username or not email or not password or not password_confirm:
			return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)
		if User.objects.filter(username=username).exists():
			return Response({'error': 'Username is already taken'}, status=status.HTTP_400_BAD_REQUEST)
		if User.objects.filter(email=email).exists():
			return Response({'error': 'Email is already taken'}, status=status.HTTP_400_BAD_REQUEST)
		if password != password_confirm:
			return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			validate_password(password)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

		user = User.objects.create_user(username=username, email=email, password=password)
		userProfile = UserProfile.objects.create(user=user)

		return Response({'status': 'Successfully signed up'}, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
	def get(self, request, format=None):
		token = request.query_params.get('token')
		if not token:
			return HttpResponse('Please provide a token', status=400)
		try:
			decoded_token = RefreshToken(token)
		except (InvalidToken, TokenError) as e:
			return HttpResponse('Invalid token', status=400)

		user_id = decoded_token['user_id']
		try:
			user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return HttpResponse('User does not exist', status=404)

		if user.userprofile.emailVerified:
			return HttpResponse('Email is already verified', status=400)
		user.userprofile.emailVerified = True
		user.userprofile.save()

		return HttpResponse('Email verified successfully', status=200)

class PasswordView(APIView):
	def put(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		old_password = request.data.get('old_password')
		new_password = request.data.get('new_password')
		new_password_confirm = request.data.get('new_password_confirm')

		if not old_password or not new_password or not new_password_confirm:
			return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)
		if not user.check_password(old_password):
			return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
		if new_password != new_password_confirm:
			return Response({'error': 'New passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			validate_password(new_password)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

		user.set_password(new_password)
		user.save()

		return Response({'status': 'Password updated successfully'}, status=status.HTTP_200_OK)

class ProfileView(APIView):
	def get(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		data = {
			'username': user.username,
			'email': user.email,
			'displayName': user.userprofile.displayName,
			'phoneNumber': user.userprofile.phoneNumber,
			'emailVerified' : user.userprofile.emailVerified
		}
		return Response(data, status=status.HTTP_200_OK)

	def put(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		user.userprofile.displayName = request.data.get('displayName')
		phoneNumber = request.data.get('phoneNumber')
		phoneValidator = PhoneNumberValidator()
		if (phoneNumber != None and len(phoneNumber) != 0):
			try:
				phoneValidator.validate(phoneNumber)
				user.userprofile.phoneNumber = phoneNumber
			except ValidationError:
				return Response({'error': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)

		email = request.data.get('email')
		emailValidator = EmailValidator()
		if (email != None and len(email)):
			try:
				emailValidator.validate(email)
			except ValidationError:
				return Response({'error': 'Invalid email address'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			curUser = UserProfile.objects.get(email=email)
		except:
			curUser = None
		if curUser != None and curUser.username != user.username:
			return Response({'error': 'Email is already taken'}, status=status.HTTP_400_BAD_REQUEST)
		if (email != None and len(email) != 0 and email != user.email):
			user.userprofile.emailVerified = False
			token = str(RefreshToken.for_user(user))
			send_mail(
				'Email Verification',
				'Verify your email address by clicking the link below: http://localhost:8000/verify-email?token=' + token,
				'admin@localhost',
				[email],
				fail_silently=False,
			)
		user.email = email
		user.save()
		user.userprofile.save()
		return Response({'status': 'Profile updated successfully'}, status=status.HTTP_200_OK)

class FriendsRequestsView(APIView):
    """ This view is used to send, accept, and reject friend requests.
        It has three methods:
        1. get: This method is used to get all the friend requests sent to the user.
        2. post: This method is used to send a friend request to a user.
        3. put: This method is used to accept or reject a friend request.
    """
    def get(self, request):
        """ This method is used to get all the friend requests sent to the user.
            It first validates the JWT token.
            It then gets all the friend requests sent to the user.
            It then creates a list of dictionaries with the email and username
                of the users who sent the friend requests.
            It then returns the list of dictionaries as a response.
        """
        auth_header = request.headers.get('Authorization')
        try:
            user = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        friend_request_list = FriendRequest.objects.filter(toUser=user.id)
        data = []
        for friend_request in friend_request_list:
            data.append({
                'email': friend_request.fromUser.email,
                'username': friend_request.fromUser.username,
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        """ This method is used to send a friend request to a user.
            It first validates the JWT token.
            It then gets the friend username from the request data.
            It then checks if the friend username is provided.
            It then gets the friend user and friend user profile.
            It then checks if the friend user is the same as the user.
            It then checks if the friend is already in the user's friend list.
            It then checks if the user has already sent a friend request
                to the friend user.
            It then checks if the friend user has already sent a friend request
                to the user.
            It then creates a friend request and saves it.
            It then returns a response with the status 'Friend request sent successfully'.
        """
        auth_header = request.headers.get('Authorization')
        try:
            user = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        friend_username = request.data.get('friend_username')
        if not friend_username:
            return Response({'error': 'Please provide a friend username'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            friend_user = User.objects.get(username=friend_username)
            friend = UserProfile.objects.get(user=friend_user)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User does not have a profile'}, status=status.HTTP_404_NOT_FOUND)
        if friend.id == user.id:
            return Response({'error': 'You cannot add yourself as a friend'}, status=status.HTTP_400_BAD_REQUEST)
        if friend in user.userprofile.friendList.all():
            return Response({'error': 'User is already in your friend list'}, status=status.HTTP_400_BAD_REQUEST)
        if FriendRequest.objects.filter(fromUser=user, toUser=friend_user).exists():
            return Response({'error': 'You have already sent a friend request to the user'}, status=status.HTTP_400_BAD_REQUEST)
        if FriendRequest.objects.filter(fromUser=friend_user, toUser=user).exists():
            return Response({'error': 'User has already sent you a friend request'}, status=status.HTTP_400_BAD_REQUEST)
        friend_request = FriendRequest.objects.create(fromUser=user, toUser=friend_user)
        friend_request.save()
        return Response({'status': 'Friend request sent successfully'}, status=status.HTTP_200_OK)

    def put(self, request):
        """ This method is used to accept or reject a friend request.
            It first validates the JWT token.
            It then gets the friend username and action from the request data.
            It then checks if the friend username is provided.
            It then gets the friend user and friend user profile.
            It then checks if the friend user is the same as the user.
            It then checks if the user has received a friend request from the friend user.
            It then deletes the friend request.

            If the action is 'accept':
                It adds the friend user to the user's friend list.
                It then returns a response with the status 'Friend request accepted successfully'.

            If the action is 'reject':
                It then returns a response with the status 'Friend request rejected successfully'.
        """
        auth_header = request.headers.get('Authorization')
        try:
            user = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        friend_username = request.data.get('friend_username')
        action = request.data.get('action')
        if not friend_username:
            return Response({'error': 'Please provide a friend username'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            friend_user = User.objects.get(username=friend_username)
            friend = UserProfile.objects.get(user=friend_user)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User does not have a profile'}, status=status.HTTP_404_NOT_FOUND)
        if not FriendRequest.objects.filter(fromUser=friend_user, toUser=user).exists():
            return Response({'error': 'User has not sent you a friend request'}, status=status.HTTP_400_BAD_REQUEST)
        FriendRequest.objects.filter(fromUser=friend_user, toUser=user).delete()
        if action == 'accept':
            user.userprofile.friendList.add(friend)
            user.userprofile.save()
            return Response({'status': 'Friend request accepted successfully'}, status=status.HTTP_200_OK)
        return Response({'status': 'Friend request rejected successfully'}, status=status.HTTP_200_OK)

class FriendsView(APIView):
    """ This view is used to get and remove friends.
        It has two methods:
        1. get: This method is used to get all the friends of the user.
        2. delete: This method is used to remove a friend
            from the user's friend list.
    """
    def get(self, request):
        """ This method is used to get all the friends of the user.
            It first validates the JWT token.
            It then gets all the friends of the user.
            It then creates a list of dictionaries with the email and username
                of the friends.
            It then returns the list of dictionaries as a response.
        """
        auth_header = request.headers.get('Authorization')
        try:
            user = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        friend_list = user.userprofile.friendList.all()
        data = []
        for friend in friend_list:
            data.append({
                'email': friend.user.email,
                'username': friend.user.username,
            })
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request):
        """ This method is used to remove a friend from the user's friend list.
            It first validates the JWT token.
            It then gets the friend username from the request data.
            It then checks if the friend username is provided.
            It then gets the friend user and friend user profile.
            It then checks if the friend user is the same as the user.
            It then checks if the friend is in the user's friend list.
            It then removes the friend from the user's friend list.
            It then returns a response with the status 'Friend removed successfully'.
        """
        auth_header = request.headers.get('Authorization')
        try:
            user = JWTTokenValidator().validate(auth_header)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        friend_username = request.data.get('friend_username')
        if not friend_username:
            return Response({'error': 'Please provide a friend username'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            friend_user = User.objects.get(username=friend_username)
            friend = UserProfile.objects.get(user=friend_user)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User does not have a profile'}, status=status.HTTP_404_NOT_FOUND)
        if friend.id == user.id:
            return Response({'error': 'You cannot remove yourself from your friend list'}, status=status.HTTP_400_BAD_REQUEST)
        if friend not in user.userprofile.friendList.all():
            return Response({'error': 'User is not in your friend list'}, status=status.HTTP_400_BAD_REQUEST)
        user.userprofile.friendList.remove(friend)
        user.userprofile.save()
        return Response({'status': 'Friend removed successfully'}, status=status.HTTP_200_OK)
