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

    @database_sync_to_async
    def getChat(self, chatToken):
        return Chat.objects.filter(token=chatToken).first()

    @database_sync_to_async
    def createMessageRecipient(self, recipient):
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
        print("Connected")
        self.chatToken = self.scope['url_route']['kwargs']['token']
        await self.channel_layer.group_add(
            "chat",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "chat",
            self.channel_name
        )


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        messageText = text_data_json['message']
        sender = text_data_json['sender']
        timestamp = text_data_json['timestamp']
        self.user = await self.getSender(sender)
        self.messageRecipient = await self.createMessageRecipient(self.user)
        self.message = await self.createMessage(self.user, messageText, self.messageRecipient)
        self.chat = await self.getChat(self.chatToken)
        print("Message received")
        await self.addMessageToChat(self.chat, self.message)
        print("Message added to chat")
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
        print("Chat message")
        message = event['message']
        sender = event['sender']
        timestamp = event['timestamp']
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'timestamp': timestamp,
        }))

