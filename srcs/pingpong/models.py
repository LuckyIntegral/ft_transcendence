from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class UserProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	# additional fields
	phoneNumber = models.CharField(max_length=15, blank=True)
	displayName = models.CharField(max_length=50, blank=True)