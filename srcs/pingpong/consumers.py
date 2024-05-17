from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.http import AsyncHttpConsumer
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from pingpong.validators import JWTTokenValidator
from pingpong.models import (
    UserProfile,
    Message,
    Chat,
    MessagesRecipient,
    Block,
    FriendRequest,
    Game,
    GameData,
)
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
from django.core.exceptions import ValidationError
from .utils import getUserFromToken
import json
import asyncio
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    chatUsers = {}

    def isBothUsersConnected(self):
        count = 0
        if self.chatToken in ChatConsumer.chatUsers:
            if len(ChatConsumer.chatUsers[self.chatToken]) == 2:
                for user, value in ChatConsumer.chatUsers[
                    self.chatToken
                ].items():
                    if value > 0:
                        count += 1
        return count == 2

    @database_sync_to_async
    def get_user_from_token(self, token):
        decoded_token = token_backend.decode(token)
        user_id = decoded_token["user_id"]
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError("User does not exist.")
        return user

    @database_sync_to_async
    def getChatExists(self, chatToken):
        return Chat.objects.filter(token=chatToken).exists()

    @database_sync_to_async
    def getChat(self, chatToken):
        return Chat.objects.filter(token=chatToken).first()

    @database_sync_to_async
    def createMessageRecipient(self, recipient):
        if self.isBothUsersConnected():
            return MessagesRecipient.objects.create(
                recipient=recipient, isRead=True, isNotified=True
            )
        return MessagesRecipient.objects.create(recipient=recipient)

    @database_sync_to_async
    def createMessage(self, sender, message, messageRecipient):
        return Message.objects.create(
            sender=sender, message=message, messageRecipient=messageRecipient
        )

    @database_sync_to_async
    def addMessageToChat(self, chat, message):
        chat.messages.add(message)

    @database_sync_to_async
    def getSender(self, sender):
        return User.objects.get(username=sender)

    @database_sync_to_async
    def getRecipient(self, sender, chat):
        if chat.userOne.username == sender.username:
            return chat.userTwo
        return chat.userOne

    @database_sync_to_async
    def isBlocked(self, sender, recipient):
        return Block.objects.filter(blocker=recipient, blocked=sender).exists()

    async def connect(self):
        self.chatToken = self.scope["url_route"]["kwargs"]["token"]
        await self.channel_layer.group_add(self.chatToken, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.chatToken in ChatConsumer.chatUsers:
            if self.user.username in ChatConsumer.chatUsers[self.chatToken]:
                ChatConsumer.chatUsers[self.chatToken][self.user.username] -= 1
        await self.channel_layer.group_discard(
            self.chatToken, self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        if "token" in text_data_json:
            try:
                token = JWTTokenValidator().validate(text_data_json["token"])
                self.user = await self.get_user_from_token(token)
                if not self.chatToken in ChatConsumer.chatUsers:
                    ChatConsumer.chatUsers[self.chatToken] = {
                        self.user.username: 0
                    }
                if (
                    not self.user.username
                    in ChatConsumer.chatUsers[self.chatToken]
                ):
                    ChatConsumer.chatUsers[self.chatToken][
                        self.user.username
                    ] = 0
                ChatConsumer.chatUsers[self.chatToken][self.user.username] += 1
                return
            except Exception as e:
                await self.close()
                return

        messageText = text_data_json["message"]
        sender = text_data_json["sender"]
        timestamp = text_data_json["timestamp"]
        self.chat = await self.getChat(self.chatToken)
        self.sender = await self.getSender(sender)
        self.recipient = await self.getRecipient(self.sender, self.chat)
        if await self.isBlocked(self.sender, self.recipient):
            await self.send(
                text_data=json.dumps(
                    {"blocked": "You are blocked by this user!"}
                )
            )
            return
        self.messageRecipient = await self.createMessageRecipient(
            self.recipient
        )
        self.message = await self.createMessage(
            self.sender, messageText, self.messageRecipient
        )
        await self.addMessageToChat(self.chat, self.message)
        await self.channel_layer.group_send(
            self.chatToken,
            {
                "type": "chat_message",
                "message": messageText,
                "sender": sender,
                "timestamp": timestamp,
            },
        )

    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]
        timestamp = event["timestamp"]
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "sender": sender,
                    "timestamp": timestamp,
                }
            )
        )


class LongPollConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data = json.loads(text_data)
        accessToken = text_data["token"]
        if not accessToken:
            await self.send(text_data=json.dumps({"error": "error"}))
            return
        try:
            user = await self.get_user_from_token(accessToken)
            new_messages = await self.get_new_messages(user)
            unread_messages = await self.get_unread_messages(user)
            chatsInfo = await self.get_chats_info(user)
            new_friend_requests = await self.get_new_friend_requests(user)
            await self.update_last_online(user)
            if new_messages:
                await self.set_notified(user)
                await self.send(
                    text_data=json.dumps(
                        {
                            "new_messages": "received",
                            "chatsInfo": chatsInfo,
                            "new_friend_requests": new_friend_requests,
                        }
                    )
                )
            elif unread_messages:
                await self.send(
                    text_data=json.dumps(
                        {
                            "new_messages": "unread",
                            "chatsInfo": chatsInfo,
                            "new_friend_requests": new_friend_requests,
                        }
                    )
                )
            else:
                await self.send(
                    text_data=json.dumps(
                        {
                            "new_messages": "none",
                            "chatsInfo": chatsInfo,
                            "new_friend_requests": new_friend_requests,
                        }
                    )
                )
        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))

    @database_sync_to_async
    def get_new_friend_requests(self, user):
        return FriendRequest.objects.filter(
            toUser=user, accepted=False
        ).exists()

    @database_sync_to_async
    def get_token_from_key(self, key):
        try:
            token_type, token_key = key.split(" ")
            if token_type.lower() != "bearer":
                raise ValidationError("Token is invalid.")
            UntypedToken(token_key)
        except (InvalidToken, TokenError) as e:
            raise ValidationError(f"Token is invalid: {str(e)}")
        return token_key

    @database_sync_to_async
    def get_user_from_token(self, token):
        decoded_token = token_backend.decode(token)
        user_id = decoded_token["user_id"]
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError("User does not exist.")
        return user

    @database_sync_to_async
    def get_new_messages(self, user):
        return MessagesRecipient.objects.filter(
            recipient=user, isRead=False, isNotified=False
        ).exists()

    @database_sync_to_async
    def get_unread_messages(self, user):
        return MessagesRecipient.objects.filter(
            recipient=user, isRead=False
        ).exists()

    @database_sync_to_async
    def set_notified(self, user):
        messages = MessagesRecipient.objects.filter(
            recipient=user, isRead=False, isNotified=False
        )
        for message in messages:
            message.isNotified = True
            message.save()

    @database_sync_to_async
    def update_last_online(self, user):
        profile = UserProfile.objects.get(user=user)
        profile.lastOnline = timezone.now()
        profile.save()

    @database_sync_to_async
    def get_chats_info(self, user):
        chats = Chat.objects.filter(Q(userOne=user) | Q(userTwo=user))
        chatsInfo = []
        for chat in chats:
            otherUser = chat.userOne if chat.userOne != user else chat.userTwo
            lastOnline = otherUser.userprofile.lastOnline
            chatToken = chat.token
            chatsInfo.append(
                {
                    "chatToken": chatToken,
                    "lastOnline": lastOnline.isoformat(),
                }
            )
        return chatsInfo


# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game, GameData
from django.contrib.auth.models import User

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.token = self.scope['url_route']['kwargs']['token']
        self.game_group_name = f'game_{self.token}'

        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'event': 'assign_role',
            'role': 'player1' if self.channel_name.endswith('1') else 'player2'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data.get('event')

        if event == 'move':
            player1_pos = data['player1_pos']
            player2_pos = data['player2_pos']
            ball_pos = data['ball_pos']

            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'game_move',
                    'player1_pos': player1_pos,
                    'player2_pos': player2_pos,
                    'ball_pos': ball_pos,
                }
            )

    async def game_move(self, event):
        player1_pos = event['player1_pos']
        player2_pos = event['player2_pos']
        ball_pos = event['ball_pos']

        await self.send(text_data=json.dumps({
            'event': 'move',
            'player1_pos': player1_pos,
            'player2_pos': player2_pos,
            'ball_pos': ball_pos,
        }))
