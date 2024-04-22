from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import *


# Create your views here.

def home(request):
    return render(request, 'home.html', {})

def login(request):
    if (request.method == 'POST'):
        username = request.POST.get['username']
        password = request.POST.get['password']
        if (not User.objects.filter(username=username).exists()):
            messages.error(request, 'Incorrect username or password')
            return render(request, 'login.html', {})
        user = authenticate(username=username, password=password)
        if user is None:
            messages.error(request, 'Incorrect username or password')
            return render(request, 'login.html', {})
        else:
            login(request, user)
            messages.success(request, 'Logged in successfully')
            return render(request, 'home.html', {})

def register(request):
    if (request.method == 'POST'):
        username = request.POST.get['username']
        password = request.POST.get['password']
        if (User.objects.filter(username=username).exists()):
            messages.error(request, 'Username already exists')
            return render(request, 'register.html', {})
        user = User.objects.create_user(username=username, password=password)
        user.save()
        messages.success(request, 'User created successfully')
        return render(request, 'login.html', {})

def logout(request):
    logout(request)
    messages.success(request, 'Logged out successfully')
    return render(request, 'home.html', {})
        