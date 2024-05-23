from django.urls import re_path

from .consumers import ChatConsumer, LongPollConsumer, GameConsumer, TournamentConsumer

import django

django.setup()

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<token>[\w-]+)/$", ChatConsumer.as_asgi()),
    re_path(r"messages/long-poll/", LongPollConsumer.as_asgi()),
    re_path(r"ws/game/(?P<token>[\w-]+)/$", GameConsumer.as_asgi()),
    re_path(r"ws/tournament/(?P<token>[\w-]+)/$", TournamentConsumer.as_asgi()),
]
