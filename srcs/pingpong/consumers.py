from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from pingpong.validators import JWTTokenValidator
from pingpong.models import UserProfile, Message, Chat, MessagesRecipient
from django.contrib.auth.models import User
from django.db.models import Q
import json

class PingPongConsumer(AsyncWebsocketConsumer):

    @database_sync_to_async
    def getChatExists(self, chatToken):
        return Chat.objects.filter(token=chatToken).exists()

    async def connect(self):
        try:
            chatToken = self.scope['url_route']['kwargs']['token']
        except KeyError as e:
            await self.close()
        if not await self.getChatExists(chatToken):
            await self.close()
            return
        await self.channel_layer.group_add(
            chatToken,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.scope['url_route']['kwargs']['token'],
            self.channel_name
        )


    async def receive(self, text_data):
        try:
            chatToken = self.scope['url_route']['kwargs']['token']
        except:
            await self.close()
            return
        chat = Chat.objects.filter(token=chatToken).first()
        if not chat.exists():
            await self.close()
            return
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender = text_data_json['sender']
        try:
            fromUser = User.objects.get(username=fromUser)
            toUser = User.objects.get(username=toUser)
        except User.DoesNotExist as e:
            await self.close()
            return
        messageRecepient = MessagesRecipient.objects.create(recipient=toUser)
        message = Messages.objects.create(sender=fromUser, message=message, messageRecepient=messageRecepient)
        chat.messages.add(message)
        await self.send(chatToken, {
            'type': 'chat_message',
            'message': message.message({
                'from': fromUser.username,
                'to': toUser.username,
                'message': message.message,
                'timestamp': message.timestamp
            })
        })

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=event['message'])
