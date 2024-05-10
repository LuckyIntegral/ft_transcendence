from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.http import AsyncHttpConsumer
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from pingpong.validators import JWTTokenValidator
from pingpong.models import UserProfile, Message, Chat, MessagesRecipient
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
import json
import asyncio

class PingPongConsumer(AsyncWebsocketConsumer):
    userCounter = 0

    @database_sync_to_async
    def getChatExists(self, chatToken):
        return Chat.objects.filter(token=chatToken).exists()

    @database_sync_to_async
    def getChat(self, chatToken):
        return Chat.objects.filter(token=chatToken).first()

    @database_sync_to_async
    def createMessageRecipient(self, recipient):
        if PingPongConsumer.userCounter == 2:
            return MessagesRecipient.objects.create(recipient=recipient, isRead=True, isNotified=True)
        return MessagesRecipient.objects.create(recipient=recipient)

    @database_sync_to_async
    def createMessage(self, sender, message, messageRecipient):
        return Message.objects.create(sender=sender, message=message, messageRecipient=messageRecipient)

    @database_sync_to_async
    def addMessageToChat(self, chat, message):
        chat.messages.add(message)

    @database_sync_to_async
    def getSender(self, sender):
        return User.objects.get(username=sender)

    async def connect(self):
        self.chatToken = self.scope['url_route']['kwargs']['token']
        await self.channel_layer.group_add(
            "chat",
            self.channel_name
        )
        PingPongConsumer.userCounter += 1
        await self.accept()

    async def disconnect(self, close_code):
        PingPongConsumer.userCounter -= 1
        await self.channel_layer.group_discard(
            "chat",
            self.channel_name
        )


    async def receive(self, text_data):
        print("Users connected", PingPongConsumer.userCounter, sep=': ')
        text_data_json = json.loads(text_data)
        messageText = text_data_json['message']
        sender = text_data_json['sender']
        timestamp = text_data_json['timestamp']
        self.user = await self.getSender(sender)
        self.messageRecipient = await self.createMessageRecipient(self.user)
        self.message = await self.createMessage(self.user, messageText, self.messageRecipient)
        self.chat = await self.getChat(self.chatToken)
        await self.addMessageToChat(self.chat, self.message)
        await self.channel_layer.group_send(
            "chat",
            {
                'type': 'chat_message',
                'message': messageText,
                'sender': sender,
                'timestamp': timestamp,
            }
        )

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        timestamp = event['timestamp']
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'timestamp': timestamp,
        }))

class MessagesLongPollConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data = json.loads(text_data)
        accessToken = text_data['token']
        if not accessToken:
            print('error token')
            await self.send(text_data=json.dumps({'error': 'error'}))
            return
        try:
            user = await self.get_user_from_token(accessToken)
            while True:
                new_messages = await self.get_new_messages(user)
                print(new_messages)
                if (new_messages):
                    break
                await asyncio.sleep(1)
            await self.set_notified(user)
            await  self.send(text_data=json.dumps({'new_messages': 'received'}))
        except Exception as e:
            print(str(e))
            await self.send(text_data=json.dumps({'error': 'error'}))

    @database_sync_to_async
    def get_token_from_key(self, key):
        try:
            token_type, token_key = token.split(' ')
            if token_type.lower() != 'bearer':
                raise ValidationError('Token is invalid.')
            UntypedToken(token_key)
        except (InvalidToken, TokenError) as e:
            raise ValidationError(f'Token is invalid: {str(e)}')
        return token_key

    @database_sync_to_async
    def get_user_from_token(self, token):
        decoded_token = token_backend.decode(token)
        user_id = decoded_token['user_id']
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError('User does not exist.')
        return user


    @database_sync_to_async
    def get_new_messages(self, user):
        return MessagesRecipient.objects.filter(recipient=user, isRead=False, isNotified=False).exists()

    @database_sync_to_async
    def set_notified(self, user):
        messages = MessagesRecipient.objects.filter(recipient=user, isRead=False, isNotified=False)
        for message in messages:
            message.isNotified = True
            message.save()
