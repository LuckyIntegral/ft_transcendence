""" This file contains the models for the pingpong app.
    The models are used to store the data in the database.
    Each model represents a table in the database.
    Each model has fields which are the columns in the table.
    Each field has a type and some options.
"""

from django.db import models
from django.contrib.auth.models import User
from .utils import userDirectoryPath


# Create your models here.
class UserProfile(models.Model):
    """This model represents the user profile.
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
    displayName = models.CharField(max_length=50, blank=True)
    emailVerified = models.BooleanField(default=False)
    isTwoStepEmailAuthEnabled = models.BooleanField(default=False)
    verificationEmailCode = models.CharField(max_length=6, blank=True)
    passwordResetToken = models.CharField(max_length=100, blank=True)
    friendList = models.ManyToManyField("self", related_name="friendList", blank=True)
    gamesWon = models.IntegerField(default=0)
    gamesPlayed = models.IntegerField(default=0)
    picture = models.ImageField(
        upload_to=userDirectoryPath, default="images/default.jpg"
    )
    pictureSmall = models.ImageField(
        upload_to=userDirectoryPath, default="images/defaultSmall.jpg"
    )
    isOnline = models.BooleanField(default=False)
    lastOnline = models.DateTimeField(auto_now=True)


class FriendRequest(models.Model):
    """This model represents the friend request.
    It has a many-to-one relationship with the UserProfile model.
    It has two fields fromUser and toUser.
    fromUser: The user who sent the request.
    toUser: The user who received the request.
    accepted: A boolean field to check if the request is accepted.
    """

    fromUser = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="fromUser"
    )
    toUser = models.ForeignKey(User, on_delete=models.CASCADE, related_name="toUser")
    accepted = models.BooleanField(default=False)


class MessagesRecipient(models.Model):
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="recipient"
    )
    message = models.ForeignKey("Message", on_delete=models.CASCADE, null=True)
    isRead = models.BooleanField(default=False)
    isNotified = models.BooleanField(default=False)


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sender")
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    messageRecipient = models.OneToOneField(
        MessagesRecipient,
        on_delete=models.CASCADE,
        related_name="messageRecipient",
        null=True,
    )


class Chat(models.Model):
    userOne = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userOne")
    userTwo = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userTwo")
    messages = models.ManyToManyField(Message, related_name="messages", blank=True)
    token = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now=True)


class Block(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocker")
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocked")


class PongLobby(models.Model):
    token = models.CharField(max_length=100)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name="host", null=True)
    guest = models.ForeignKey(User, on_delete=models.CASCADE, related_name="guest", null=True)
    created = models.DateTimeField(auto_now_add=True)
    isStarted = models.BooleanField(default=False)
    isFinished = models.BooleanField(default=False)
    isExpired = models.BooleanField(default=False)
    hostScore = models.IntegerField(default=0)
    guestScore = models.IntegerField(default=0)
    winner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="winner", null=True
    )


class TournamentLobby(models.Model):
    token = models.CharField(max_length=100)
    upper_bracket = models.ForeignKey(
        PongLobby, on_delete=models.CASCADE, related_name="upper_bracket", null=True
    )
    lower_bracket = models.ForeignKey(
        PongLobby, on_delete=models.CASCADE, related_name="lower_bracket", null=True
    )
    final = models.ForeignKey(
        PongLobby, on_delete=models.CASCADE, related_name="final", null=True
    )
    finished = models.BooleanField(default=False)
    started = models.BooleanField(default=False)
    expired = models.BooleanField(default=False)
