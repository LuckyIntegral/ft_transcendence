import random
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

class LoginView(APIView):
	def post(self, request, format=None):
		username = request.data.get('username')
		password = request.data.get('password')

		if not username or not password:
			return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)
		
		try:
			user = User.objects.get(username=username)
		except User.DoesNotExist:
			return Response({'error': 'Incorrect password or username'}, status=status.HTTP_400_BAD_REQUEST)
		
		if not user.check_password(password):
			return Response({'error': 'Incorrect password or username'}, status=status.HTTP_400_BAD_REQUEST)
		
		if not user.userprofile.isTwoStepEmailAuthEnabled:
			token = str(RefreshToken.for_user(user))
			return Response({'token': token}, status=status.HTTP_200_OK)
		
		return Response({'status': 'Proccess 2-step verification'}, status=status.HTTP_202_ACCEPTED)

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
			'emailVerified' : user.userprofile.emailVerified,
			'twoStepVerificationEnabled': user.userprofile.isTwoStepEmailAuthEnabled,
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

class TwoStepVerificationCodeView(APIView):
	def put(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		if not authHeader:
			username = request.data.get('username')
			password = request.data.get('password')
			try:
				userPasswordValidator = UsernamePasswordValidator()
				user = userPasswordValidator.validate(username, password)
			except ValidationError as e:
				return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		else:
			try:
				user = JWTTokenValidator().validate(authHeader)
			except ValidationError as e:
				return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

		verificationEmailCode = str(random.randint(100000, 999999))
		user.userprofile.verificationEmailCode = verificationEmailCode
		user.userprofile.save()
		send_mail(
			'2-Step Verification Code',
			'Your 2-step verification code is: ' + verificationEmailCode,
			'admin@localhost',
			[user.email],
			fail_silently=False,
		)
		print('Verification code sent successfully')
		return Response({'status': 'Verification code sent successfully'}, status=status.HTTP_200_OK)
	
	def post(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		if not authHeader:
			username = request.data.get('username')
			password = request.data.get('password')
			print(username)
			print(password)
			try:
				userPasswordValidator = UsernamePasswordValidator()
				user = userPasswordValidator.validate(username, password)
			except ValidationError as e:
				return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		else:
			try:
				user = JWTTokenValidator().validate(authHeader)
			except ValidationError as e:
				return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		verificationEmailCode = request.data.get('code')
		if not verificationEmailCode:
			return Response({'error': 'Please provide a verification code'}, status=status.HTTP_400_BAD_REQUEST)
		if user.userprofile.verificationEmailCode != verificationEmailCode:
			return Response({'error': 'Incorrect verification code'}, status=status.HTTP_400_BAD_REQUEST)
		user.userprofile.verificationEmailCode = ""
		user.userprofile.save()
		return Response({'status': 'Verification successful'}, status=status.HTTP_200_OK)

class TwoStepVerification(APIView):
	def get(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		if not user.userprofile.emailVerified:
			return Response({'error': 'Email is not verified'}, status=status.HTTP_400_BAD_REQUEST)
		if not user.userprofile.isTwoStepEmailAuthEnabled:
			return Response({'status': '2-step email verification is not enabled'}, status=status.HTTP_202_ACCEPTED)
		return Response({'status': '2-step email verification enabled'}, status=status.HTTP_200_OK)

	def put(self, request, format=None):
		authHeader = request.headers.get('Authorization')
		try:
			user = JWTTokenValidator().validate(authHeader)
		except ValidationError as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		action = request.data.get('action')
		if action == None:
			return Response({'error': 'Please provide an action'}, status=status.HTTP_400_BAD_REQUEST)
		
		if user.userprofile.emailVerified == False:
			return Response({'error': 'Email is not verified'}, status=status.HTTP_400_BAD_REQUEST)

		if request.data.get('code') == None:
			return Response({'error': 'Please provide a code'}, status=status.HTTP_400_BAD_REQUEST)
		if user.userprofile.verificationEmailCode != request.data.get('code'):
			return Response({'error': 'Incorrect code'}, status=status.HTTP_400_BAD_REQUEST)

		if action == 'enable':
			if user.userprofile.isTwoStepEmailAuthEnabled:
				return Response({'error': '2-step email verification is already enabled'}, status=status.HTTP_400_BAD_REQUEST)
			user.userprofile.isTwoStepEmailAuthEnabled = True
			user.userprofile.save()
			return Response({'status': '2-step email verification enabled'}, status=status.HTTP_200_OK)
		elif action == 'disable':
			if not user.userprofile.isTwoStepEmailAuthEnabled:
				return Response({'error': '2-step email verification is already disabled'}, status=status.HTTP_400_BAD_REQUEST)
			user.userprofile.isTwoStepEmailAuthEnabled = False
			user.userprofile.save()
			return Response({'status': '2-step email verification disabled'}, status=status.HTTP_200_OK)
		else:
			return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
