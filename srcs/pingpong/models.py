""" This file contains the models for the pingpong app.
    The models are used to store the data in the database.
    Each model represents a table in the database.
    Each model has fields which are the columns in the table.
    Each field has a type and some options.
"""
from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class UserProfile(models.Model):
    """ This model represents the user profile.
        It has a one-to-one relationship with the User model.
        It has additional fields like phoneNumber, displayName,
            phoneNumberVerified, emailVerified, friendList.
        phoneNumber: The phone number of the user.
        displayName: The name to be displayed on the app.
        phoneNumberVerified: A boolean field to check if the phone number is verified.
        emailVerified: A boolean field to check if the email is verified.
        friendList: A many-to-many relationship with the UserProfile model
            to store the friends of the user.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # additional fields
    displayName = models.CharField(max_length=50, blank=True)
    emailVerified = models.BooleanField(default=False)
    isTwoStepEmailAuthEnabled = models.BooleanField(default=False)
    verificationEmailCode = models.CharField(max_length=6, blank=True)
    passwordResetToken = models.CharField(max_length=100, blank=True)
    friendList = models.ManyToManyField("self", related_name='friendList', blank=True)
    picture = models.ImageField(upload_to='pictures/', default='images/default.jpg')
    pictureSmall = models.ImageField(upload_to='pictures/', default='images/defaultSmall.jpg')
    gamesWon = models.IntegerField(default=0)
    gamesPlayed = models.IntegerField(default=0)

class FriendRequest(models.Model):
    """ This model represents the friend request.
        It has a many-to-one relationship with the UserProfile model.
        It has two fields fromUser and toUser.
        fromUser: The user who sent the request.
        toUser: The user who received the request.
        accepted: A boolean field to check if the request is accepted.
    """
    fromUser = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fromUser')
    toUser = models.ForeignKey(User, on_delete=models.CASCADE, related_name='toUser')
    accepted = models.BooleanField(default=False)
