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
    TournamentLobby,
)
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
from django.core.exceptions import ValidationError
from .utils import getUserFromToken, blockChainCreateGame
import json
import asyncio
from django.utils import timezone
import html
import re
import threading


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
        if not match:
            messageText = html.escape(text_data_json["message"])
        else:
            gameToken = match.group(1)
            if not await self.is_token_exists_in_pong_lobby(gameToken):
                await self.send(text_data=json.dumps({"error": "Game does not exist!"}))
                return
            if "kind" in text_data_json and text_data_json["kind"] == "3d":
                messageText = (
					f"Join <a href='#pong3d?game-token={gameToken}'>3D Pong!</a>"
				)
            else:
                messageText = (
					f"Join <a href='#pong?game-token={gameToken}'>2D Pong!</a>"
            )
            # messageText = (
            #     f"You have been invited to play a game! Click here <a href='#pong?game-token={gameToken}'>to play</a>."
            # )
        sender = html.escape(text_data_json["sender"])
        timestamp = html.escape(text_data_json["timestamp"])
        try:
            self.chat = await self.getChat(self.chatToken)
            self.sender = await self.getSender(sender)
            self.recipient = await self.getRecipient(self.sender, self.chat)
        except:
            return
        if await self.isBlocked(self.sender, self.recipient):
            await self.send(text_data=json.dumps({"blocked": "You are blocked by this user!"}))
            return
        self.messageRecipient = await self.createMessageRecipient(self.recipient)
        self.message = await self.createMessage(self.sender, messageText, self.messageRecipient)
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
            participants = text_data["participants"]
            onlineStatuses = []
            if len(participants):
                onlineStatuses = await self.get_last_online_statuses(participants)
            await self.update_notification_last_online()
            await self.update_last_online(user)
            if new_messages:
                await self.set_notified(user)
                await self.send(
                    text_data=json.dumps(
                        {
                            "new_messages": "received",
                            "chatsInfo": chatsInfo,
                            "new_friend_requests": new_friend_requests,
                            "onlineStatuses": onlineStatuses,
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
                            "onlineStatuses": onlineStatuses,
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
                            "onlineStatuses": onlineStatuses,
                        }
                    )
                )
        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))

    @database_sync_to_async
    def get_last_online_statuses(self, participants):
        onlineStatuses = []
        for participant in participants:
            try:
                user = User.objects.get(username=participant)
                lastOnline = user.userprofile.lastOnline
                onlineStatuses.append(
                    {
                        "username": participant,
                        "lastOnline": lastOnline.isoformat(),
                    }
                )
            except User.DoesNotExist:
                onlineStatuses.append(
                    {
                        "username": participant,
                        "lastOnline": "unknown",
                    }
                )
        return onlineStatuses

    @database_sync_to_async
    def update_notification_last_online(self):
        try:
            notif = User.objects.get(username="Notifications")
            notif.userprofile.lastOnline = timezone.now()
            notif.userprofile.save()
        except User.DoesNotExist:
            return

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
        return MessagesRecipient.objects.filter(recipient=user, isRead=False, isNotified=False).exists()

    @database_sync_to_async
    def get_unread_messages(self, user):
        return MessagesRecipient.objects.filter(recipient=user, isRead=False).exists()

    @database_sync_to_async
    def set_notified(self, user):
        messages = MessagesRecipient.objects.filter(recipient=user, isRead=False, isNotified=False)
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
                    print("User not in lobby")
                    await self.close()
                    return
            except Exception as e:
                print(e)
                await self.close()
                return
            if self.token not in GameConsumer.playerAuth:
                GameConsumer.playerAuth[self.token] = {}
            if self.user.username not in GameConsumer.playerAuth[self.token]:
                GameConsumer.playerAuth[self.token][self.user.username] = 0
            GameConsumer.playerAuth[self.token][self.user.username] += 1
            opponentName = await self.get_opponent_username(self.user, self.token)
            if await self.isUserHost(self.user, self.token):
                await self.send(
                    text_data=json.dumps(
                        {
                            "event": "assign_role",
                            "role": "player1",
							"username": self.user.username,
                            "opponent": opponentName,
                        }
                    )
                )
            else:
                await self.send(
                    text_data=json.dumps(
                        {
                            "event": "assign_role",
                            "role": "player2",
							"username": self.user.username,
                            "opponent": opponentName,
                        }
                    )
                )
            # if await self.isUserHost(self.user, self.token):
            #     await self.send(
            #         text_data=json.dumps(
            #             {
            #                 "event": "assign_role",
            #                 "role": "player1",
            #             }
            #         )
            #     )
            # else:
            #     await self.send(
            #         text_data=json.dumps(
            #             {
            #                 "event": "assign_role",
            #                 "role": "player2",
            #             }
            #         )
            #     )

            if self.isBothUsersConnected():
                await self.setGameStarted(self.token)
            try:
                lobby = await self.getLobbyData(self.token)
            except PongLobby.DoesNotExist:
                await self.close()
                return

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

    @database_sync_to_async
    def get_opponent_username(self, user, token):
        try:
            lobby = PongLobby.objects.get(token=token)
        except PongLobby.DoesNotExist:
            return "Undefined"
        if user == lobby.host:
            return lobby.guest.username
        return lobby.host.username

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
        if (
            not lobby.isStarted
            and lobby.created < timezone.now() - timezone.timedelta(minutes=5)
            and not lobby.isExpired
        ):
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


class TournamentConsumer(AsyncWebsocketConsumer):
    players_auth = {}
    tournament_stage = {}

    async def connect(self):
        self.token = self.scope["url_route"]["kwargs"]["token"]
        self.game_group_name = f"game_{self.token}"

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        if self.token in TournamentConsumer.players_auth:
            if self.user.username in TournamentConsumer.players_auth[self.token]:
                TournamentConsumer.players_auth[self.token][self.user.username] -= 1
            if TournamentConsumer.players_auth[self.token][self.user.username] == 0:
                del TournamentConsumer.players_auth[self.token][self.user.username]

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data.get("type")
        auth_header = data.get("auth_header")
        if auth_header:
            try:
                self.jwt_token = JWTTokenValidator().validate(auth_header)
                self.user = await self.get_user_from_token(self.jwt_token)
                if not await self.user_in_tournament(self.user, self.token):
                    await self.close()
                    return
            except Exception:
                await self.close()
                return
            # JOIN LOGIC
            if self.token not in TournamentConsumer.players_auth:
                TournamentConsumer.players_auth[self.token] = {}
                TournamentConsumer.tournament_stage[self.token] = "waiting_for_semifinals"
                participants = await self.get_all_participants()
                for username in participants:
                    await self.send_game_ready_notification(
                        username,
                        TournamentConsumer.tournament_stage[self.token]
                    )
            if self.user.username not in TournamentConsumer.players_auth[self.token]:
                TournamentConsumer.players_auth[self.token][self.user.username] = 0
            TournamentConsumer.players_auth[self.token][self.user.username] += 1
            # START LOGIC
            if self.token not in TournamentConsumer.players_auth:
                return
            if len(TournamentConsumer.players_auth[self.token]) == 4 and await self.start_tournament():
                await self.update_game_timestamp(self.token, "semifinals")
                TournamentConsumer.tournament_stage[self.token] = "semifinal_game_ready"
                for username in TournamentConsumer.players_auth[self.token].keys():
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            "type": "ping",
                            "stage": TournamentConsumer.tournament_stage[self.token],
                            "game_token": await self.get_game_for_user(username),
                            "username": username,
                        },
                    )
            else:
                await self.send(
                        text_data=json.dumps(
                        {
                            "stage": TournamentConsumer.tournament_stage[self.token],
                            "game_token": await self.get_game_for_user(self.user.username),
                            "username": self.user.username,
                        }
                    )
                )
            return
        # TOURNAMENT PROCESS LOGIC
        await asyncio.sleep(2)
        curStage = await self.get_tournament_stage(self.token)
        if (curStage != TournamentConsumer.tournament_stage[self.token] and curStage == "final_game_ready"):
            await self.update_game_timestamp(self.token, "final")
            await self.assign_final_game()
            finilists = await self.get_finilists_usernames()
            for username in finilists:
                if username not in TournamentConsumer.players_auth[self.token]:
                    await self.send_game_ready_notification(
                        username,
                        "final"
                    )
        if (curStage == "tournament_over" and TournamentConsumer.tournament_stage[self.token] == "final_game_ready"):
            await self.set_tournament_finished()
        TournamentConsumer.tournament_stage[self.token] = curStage
        results = []
        if (curStage == "tournament_over"):
            results = await self.get_tournament_results()
        if (curStage in ("semifinal_game_ready", "final_game_ready") and await self.is_user_eleminated(self.user)):
            curStage = "eliminated"
        if (curStage == "semifinal_game_ready" and await self.is_user_won_semifinals(self.user)):
            curStage = "waiting_for_finals"
        await self.send(
            text_data=json.dumps(
            {
                "stage": curStage,
                "game_token": await self.get_game_for_user(self.user.username),
                "username": self.user.username,
                "results": results,
            })
        )

    @database_sync_to_async
    def get_finilists_usernames(self):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return []
        return [
            tournament.upper_bracket.winner.username,
            tournament.lower_bracket.winner.username,
        ]

    @database_sync_to_async
    def is_user_won_semifinals(self, user):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return False
        if tournament.upper_bracket.winner == user or tournament.lower_bracket.winner == user:
            return True
        return False

    @database_sync_to_async
    def is_user_eleminated(self, user):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return False
        if (
            tournament.upper_bracket.isFinished
            and user in [tournament.upper_bracket.host, tournament.upper_bracket.guest]
            and user != tournament.upper_bracket.winner
        ):
            return True
        if (
            tournament.lower_bracket.isFinished
            and user in [tournament.lower_bracket.host, tournament.lower_bracket.guest]
            and user != tournament.lower_bracket.winner
        ):
            return True
        return False

    @database_sync_to_async
    def set_tournament_finished(self):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return
        if tournament.final.isFinished and tournament.finished == False:
            tournament.finished = True
            tournament.save()
            results = async_to_sync(self.get_tournament_results)()
            data = []
            for result in results:
                data.append(
                    [result["username"], int(result["place"][0])]
                )
            # TODO uncomment this line
            threading.Thread(target=async_to_sync(blockChainCreateGame), args=(self.token, data)).start()

    @database_sync_to_async
    def get_tournament_results(self):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return []
        if not tournament.final.isFinished:
            return []
        first_place_user = tournament.final.winner
        second_place_user = tournament.upper_bracket.winner if tournament.upper_bracket.winner != first_place_user else tournament.lower_bracket.winner
        third_place_user = tournament.upper_bracket.host if tournament.upper_bracket.host != tournament.upper_bracket.winner else tournament.upper_bracket.guest
        fourth_place_user = tournament.lower_bracket.host if tournament.lower_bracket.host != tournament.lower_bracket.winner else tournament.lower_bracket.guest
        return [
            {
                "username": first_place_user.username,
                "displayName": first_place_user.userprofile.displayName,
                "place": "1st",
            },
            {
                "username": second_place_user.username,
                "displayName": second_place_user.userprofile.displayName,
                "place": "2nd",
            },
            {
                "username": third_place_user.username,
                "displayName": third_place_user.userprofile.displayName,
                "place": "3/4th",
            },
            {
                "username": fourth_place_user.username,
                "displayName": fourth_place_user.userprofile.displayName,
                "place": "3/4th",
            },
        ]

    @database_sync_to_async
    def assign_final_game(self):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return
        tournament.final.host = tournament.upper_bracket.winner
        tournament.final.guest = tournament.lower_bracket.winner
        tournament.final.save()

    @database_sync_to_async
    def update_game_timestamp(self, token, stage):
        try:
            tournament = TournamentLobby.objects.get(token=token)
        except TournamentLobby.DoesNotExist:
            return False
        if stage == "semifinals":
            tournament.upper_bracket.created = timezone.now()
            tournament.lower_bracket.created = timezone.now()
            tournament.upper_bracket.save()
            tournament.lower_bracket.save()
        elif stage == "final":
            tournament.final.created = timezone.now()
            tournament.final.save()

    @database_sync_to_async
    def get_tournament_stage(self, token):
        try:
            tournament = TournamentLobby.objects.get(token=token)
        except TournamentLobby.DoesNotExist:
            return "None"
        if tournament.final.isFinished:
            return "tournament_over"
        if tournament.upper_bracket.isExpired or tournament.lower_bracket.isExpired:
            return "tournament_over"
        if tournament.final.isExpired:
            return "tournament_over"
        if tournament.upper_bracket.isFinished and tournament.lower_bracket.isFinished:
            return "final_game_ready"
        if TournamentConsumer.tournament_stage[self.token] == "semifinal_game_ready":
            return "semifinal_game_ready"
        return "waiting_for_semifinals"


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
    def user_in_tournament(self, user, tournament_id):
        if TournamentLobby.objects.filter(Q(upper_bracket__host=user) | Q(upper_bracket__guest=user) | Q(lower_bracket__host=user) | Q(lower_bracket__guest=user)).exists():
            return True
        return False

    @database_sync_to_async
    def start_tournament(self):
        try:
            tournament = TournamentLobby.objects.get(token=self.token, started=False)
        except:
            return False
        tournament.started = True
        tournament.save()
        return True

    @database_sync_to_async
    def get_game_for_user(self, username):
        try:
            if TournamentConsumer.tournament_stage[self.token] == "waiting_for_semifinals":
                return "None"

            if TournamentConsumer.tournament_stage[self.token] == "tournament_over":
                return "None"

            tournament_lobby = TournamentLobby.objects.get(token=self.token)

            if TournamentConsumer.tournament_stage[self.token] == "final_game_ready" and username in [
                tournament_lobby.upper_bracket.winner.username,
                tournament_lobby.lower_bracket.winner.username,
            ]:
                return tournament_lobby.final.token


            if username in [
                tournament_lobby.upper_bracket.guest.username,
                tournament_lobby.upper_bracket.host.username,
            ]:
                return tournament_lobby.upper_bracket.token
            elif username in [
                tournament_lobby.lower_bracket.guest.username,
                tournament_lobby.lower_bracket.host.username,
            ]:
                return tournament_lobby.lower_bracket.token
            return "None"
        except:
            return "None"

    @database_sync_to_async
    def get_notifications_chat(self, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        return Chat.objects.filter(userOne=user, userTwo__username="Notifications").first()

    @database_sync_to_async
    def create_message_recipient(self, recipient, chatToken):
        if chatToken in ChatConsumer.chatUsers:
            if (
                recipient.username in ChatConsumer.chatUsers[chatToken]
                and ChatConsumer.chatUsers[chatToken][recipient.username] > 0
            ):
                return MessagesRecipient.objects.create(recipient=recipient, isRead=True, isNotified=True)
        return MessagesRecipient.objects.create(recipient=recipient)

    @database_sync_to_async
    def create_message(self, sender, message, messageRecipient):
        return Message.objects.create(sender=sender, message=message, messageRecipient=messageRecipient)

    @database_sync_to_async
    def send_game_ready_notification(self, username, stage):
        chat = async_to_sync(self.get_notifications_chat)(username)
        if not chat:
            return
        recipient = chat.userOne
        sender = chat.userTwo
        messageRecipient = async_to_sync(self.create_message_recipient)(recipient, chat.token)
        if stage == "waiting_for_semifinals":
            messageText = f"Your tournament is ready! <a href='#tournamentslobby?token={self.token}'>Click here</a> to join tournament lobby."
        else:
            messageText = f"Your {stage} game is ready! <a href='#tournamentslobby?token={self.token}'>Click here</a> to join tournament lobby."
        message = async_to_sync(self.create_message)(sender, messageText, messageRecipient)
        chat.messages.add(message)

    @database_sync_to_async
    def get_all_participants(self):
        try:
            tournament = TournamentLobby.objects.get(token=self.token)
        except TournamentLobby.DoesNotExist:
            return []
        return [
            tournament.upper_bracket.host.username,
            tournament.upper_bracket.guest.username,
            tournament.lower_bracket.host.username,
            tournament.lower_bracket.guest.username,
        ]

    async def ping(self, event):
        game_token = event["game_token"]
        username = event["username"]
        stage = event["stage"]

        await self.send(
            text_data=json.dumps(
                {
                    "stage": stage,
                    "game_token": game_token,
                    "username": username,
                }
            )
        )
