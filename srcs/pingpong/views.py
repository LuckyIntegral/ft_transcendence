from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
from .validators import *

from .models import *


# Create your views here.

def home(request):
	return render(request, 'home.html', {})

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


class VerifyTokenView(APIView):
	def post(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		if not authHeader or authHeader == '':
			return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			tokenType, tokenKey = authHeader.split(' ')
			if (tokenType.lower() != 'bearer'):
				return Response({'error': 'Token is invalid'}, status=status.HTTP_400_BAD_REQUEST)
			token = Token.objects.get(key=tokenKey)
		except:
			return Response({'error': 'Token is invalid'}, status=status.HTTP_400_BAD_REQUEST)
		return Response({'status': 'Token is valid'}, status=status.HTTP_200_OK)

class ProfileView(APIView):
	def put(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		user.userprofile.displayName = request.data.get('displayName')
		phoneNumber = request.data.get('phoneNumber')
		phoneValidator = PhoneNumberValidator()
		if (not phoneNumber or phoneNumber == ''):
			try:
				phoneValidator.validate(phoneNumber)
				user.userprofile.phonenumber = phoneNumber
			except ValidationError:
				return Response({'error': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)

		user.email = request.data.get('email')
		emailValidator = EmailValidator()
		if (not user.email or user.email == ''):
			try:
				emailValidator.validate(user.email)
			except ValidationError:
				return Response({'error': 'Invalid email address'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			curUser = UserProfile.objects.get(email=user.email)
		except:
			curUser = None
		if curUser != None and curUser.username != user.username:
			return Response({'error': 'Email is already taken'}, status=status.HTTP_400_BAD_REQUEST)
		user.save()

		return Response({'status': 'Profile updated successfully'}, status=status.HTTP_200_OK)