from django.urls import re_path

from .consumers import PingPongConsumer
from .consumers import GameLobbyConsumer

import django
django.setup()

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<token>[\w-]+)/$', PingPongConsumer.as_asgi()),
    re_path(r'ws/lobby/(?P<game_id>[\w-]+)/$', GameLobbyConsumer.as_asgi()),
]