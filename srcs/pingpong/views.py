from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.authtoken.models import Token

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

        user = User(username=username, email=email)
        user.set_password(password)
        user.save()

        return Response({'status': 'Successfully signed up'}, status=status.HTTP_201_CREATED)


class VerifyTokenView(APIView):
    def post(self, request, format=None):
        token = request.headers.get('Authorization')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = token.split(' ')
            if (len(token) < 2):
                return Response({'error': 'Token is invalid'}, status=status.HTTP_400_BAD_REQUEST)
            token = token[1]
            token = Token.objects.get(key=token)
            if not token:
                return Response({'error': 'Token is invalid'}, status=status.HTTP_400_BAD_REQUEST)
            print(token)
        except:
            return Response({'error': 'Token is invalid'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'status': 'Token is valid'}, status=status.HTTP_200_OK)