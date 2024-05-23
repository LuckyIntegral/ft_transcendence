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
    PongLobby,
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
import html
import re


class ChatConsumer(AsyncWebsocketConsumer):
    chatUsers = {}

    def isBothUsersConnected(self):
        count = 0
        if self.chatToken in ChatConsumer.chatUsers:
            if len(ChatConsumer.chatUsers[self.chatToken]) == 2:
                for user, value in ChatConsumer.chatUsers[self.chatToken].items():
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

    @database_sync_to_async
    def is_token_exists_in_pong_lobby(self, token):
        return PongLobby.objects.filter(token=token).exists()

    async def connect(self):
        self.chatToken = self.scope["url_route"]["kwargs"]["token"]
        await self.channel_layer.group_add(self.chatToken, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.chatToken in ChatConsumer.chatUsers:
            if self.user.username in ChatConsumer.chatUsers[self.chatToken]:
                ChatConsumer.chatUsers[self.chatToken][self.user.username] -= 1
        await self.channel_layer.group_discard(self.chatToken, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        if "token" in text_data_json:
            try:
                token = JWTTokenValidator().validate(text_data_json["token"])
                self.user = await self.get_user_from_token(token)
                if not self.chatToken in ChatConsumer.chatUsers:
                    ChatConsumer.chatUsers[self.chatToken] = {self.user.username: 0}
                if not self.user.username in ChatConsumer.chatUsers[self.chatToken]:
                    ChatConsumer.chatUsers[self.chatToken][self.user.username] = 0
                ChatConsumer.chatUsers[self.chatToken][self.user.username] += 1
                return
            except Exception as e:
                await self.close()
                return
        regex = r"gameToken=([A-Za-z0-9\-]*)"
        match = re.match(regex, text_data_json["message"])
        print(match)
        if not match:
            messageText = html.escape(text_data_json["message"])
        else:
            gameToken = match.group(1)
            print(gameToken)
            if not await self.is_token_exists_in_pong_lobby(gameToken):
                await self.send(text_data=json.dumps({"error": "Game does not exist!"}))
                return
            messageText = f"You have been invited to play a game! Click here <a href='#pong?game-token={gameToken}'>to play</a>."
        sender = html.escape(text_data_json["sender"])
        timestamp = html.escape(text_data_json["timestamp"])
        self.chat = await self.getChat(self.chatToken)
        self.sender = await self.getSender(sender)
        self.recipient = await self.getRecipient(self.sender, self.chat)
        if await self.isBlocked(self.sender, self.recipient):
            await self.send(
                text_data=json.dumps({"blocked": "You are blocked by this user!"})
            )
            return
        self.messageRecipient = await self.createMessageRecipient(self.recipient)
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
        return FriendRequest.objects.filter(toUser=user, accepted=False).exists()

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
        return MessagesRecipient.objects.filter(recipient=user, isRead=False).exists()

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


class GameConsumer(AsyncWebsocketConsumer):
    playerAuth = {}

    async def connect(self):
        self.token = self.scope["url_route"]["kwargs"]["token"]
        self.game_group_name = f"game_{self.token}"

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

        if self.token in GameConsumer.playerAuth:
            if self.user.username in GameConsumer.playerAuth[self.token]:
                GameConsumer.playerAuth[self.token][self.user.username] -= 1
                if await self.setDefaultLoss(self.user, self.token):
                    try:
                        lobby = await self.getLobbyData(self.token)
                    except PongLobby.DoesNotExist:
                        return
                    winner = await self.getLobbyWinner(self.token)
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            "type": "player_connected",
                            "players_connected": -42,
                            "isExpired": lobby.isExpired,
                            "isStarted": lobby.isStarted,
                            "isFinished": lobby.isFinished,
                            "hostScore": lobby.hostScore,
                            "guestScore": lobby.guestScore,
                            "winner": winner,
                        },
                    )
                if GameConsumer.playerAuth[self.token][self.user.username] == 0:
                    del GameConsumer.playerAuth[self.token][self.user.username]
                if len(GameConsumer.playerAuth[self.token]) == 0:
                    del GameConsumer.playerAuth[self.token]

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data.get("event")
        authHeader = data.get("auth_header")
        if authHeader:
            try:
                self.jwtToken = JWTTokenValidator().validate(authHeader)
                self.user = await self.get_user_from_token(self.jwtToken)
                if not await self.userInLobby(self.user, self.token):
                    await self.close()
                    return
            except Exception as e:
                await self.close()
                return
            if self.token not in GameConsumer.playerAuth:
                GameConsumer.playerAuth[self.token] = {}
            if self.user.username not in GameConsumer.playerAuth[self.token]:
                GameConsumer.playerAuth[self.token][self.user.username] = 0
            GameConsumer.playerAuth[self.token][self.user.username] += 1
            if await self.isUserHost(self.user, self.token):
                await self.send(
                    text_data=json.dumps(
                        {
                            "event": "assign_role",
                            "role": "player1",
                        }
                    )
                )
            else:
                await self.send(
                    text_data=json.dumps(
                        {
                            "event": "assign_role",
                            "role": "player2",
                        }
                    )
                )

            if self.isBothUsersConnected():
                await self.setGameStarted(self.token)
            try:
                lobby = await self.getLobbyData(self.token)
                print("Lobby exists in try")
            except PongLobby.DoesNotExist:
                print("Lobby does not exist")
                await self.close()
                return

            print("--------------------", lobby.isExpired)
            print("--------------------", lobby.isStarted)
            winner = await self.getLobbyWinner(self.token)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "player_connected",
                    "players_connected": 2 if self.isBothUsersConnected() else -42,
                    "isExpired": lobby.isExpired,
                    "isStarted": lobby.isStarted,
                    "isFinished": lobby.isFinished,
                    "hostScore": lobby.hostScore,
                    "guestScore": lobby.guestScore,
                    "winner": winner,
                },
            )
            return

        if event == "move":
            player1_pos = data.get("player1_pos")
            player2_pos = data.get("player2_pos")
            ball_pos = data.get("ball_pos")
            if player2_pos is None:
                update_type = "host"
            else:
                update_type = "client"

            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "game_move",
                    "update_type": update_type,
                    "player1_pos": player1_pos,
                    "player2_pos": player2_pos,
                    "ball_pos": ball_pos,
                },
            )

        if event == "game_over":
            await self.setGameFinished(self.token, data)

    async def game_move(self, event):
        player1_pos = event.get("player1_pos")
        player2_pos = event.get("player2_pos")
        ball_pos = event.get("ball_pos")
        update_type = event.get("update_type")

        await self.send(
            text_data=json.dumps(
                {
                    "event": "game_move",
                    "update_type": update_type,
                    "player1_pos": player1_pos,
                    "player2_pos": player2_pos,
                    "ball_pos": ball_pos,
                }
            )
        )

    async def player_connected(self, event):
        players_connected = event.get("players_connected")
        isExpired = event.get("isExpired")
        isStarted = event.get("isStarted")
        isFinished = event.get("isFinished")
        hostScore = event.get("hostScore")
        guestScore = event.get("guestScore")
        winner = event.get("winner")

        await self.send(
            text_data=json.dumps(
                {
                    "event": "player_connected",
                    "players_connected": players_connected,
                    "isExpired": isExpired,
                    "isStarted": isStarted,
                    "isFinished": isFinished,
                    "hostScore": hostScore,
                    "guestScore": guestScore,
                    "winner": winner,
                }
            )
        )

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
    def userInLobby(self, user, lobbyId):
        return PongLobby.objects.filter(Q(host=user) | Q(guest=user)).exists()

    def isBothUsersConnected(self):
        count = 0
        if self.token in GameConsumer.playerAuth:
            if len(GameConsumer.playerAuth[self.token]) == 2:
                for user, value in GameConsumer.playerAuth[self.token].items():
                    if value > 0:
                        count += 1
        return count == 2

    @database_sync_to_async
    def isUserHost(self, user, lobbyId):
        return PongLobby.objects.filter(host=user, token=lobbyId).exists()

    @database_sync_to_async
    def getLobbyData(self, lobbyId):
        lobby = PongLobby.objects.get(token=lobbyId)
        if (not lobby.isStarted and lobby.created < timezone.now() - timezone.timedelta(minutes=5) and not lobby.isExpired):
            lobby.isExpired = True
            lobby.save()
        return lobby

    @database_sync_to_async
    def setGameStarted(self, lobbyId):
        try:
            lobby = PongLobby.objects.get(token=lobbyId, isStarted=False)
        except PongLobby.DoesNotExist:
            return
        lobby.isStarted = True
        lobby.save()

    @database_sync_to_async
    def setDefaultLoss(self, user, lobbyId):
        try:
            lobby = PongLobby.objects.get(token=lobbyId)
        except PongLobby.DoesNotExist:
            return False
        if lobby.isStarted and not lobby.isFinished:
            lobby.isFinished = True
            if lobby.host == user:
                lobby.hostScore = 0
                lobby.guestScore = 5
                lobby.winner = lobby.guest
            else:
                lobby.hostScore = 5
                lobby.guestScore = 0
                lobby.winner = lobby.host
            lobby.save()
            return True
        return False

    @database_sync_to_async
    def getLobbyWinner(self, lobbyId):
        lobby = PongLobby.objects.get(token=lobbyId)
        return lobby.winner.username if lobby.winner else None

    @database_sync_to_async
    def setGameFinished(self, lobbyId, data):
        try:
            lobby = PongLobby.objects.get(token=lobbyId)
        except PongLobby.DoesNotExist:
            return
        lobby.isFinished = True
        lobby.hostScore = data["hostScore"]
        lobby.guestScore = data["guestScore"]
        lobby.winner = lobby.host if data["hostScore"] > data["guestScore"] else lobby.guest
        lobby.save()