from django.urls import re_path

from .consumers import PingPongConsumer

import django
django.setup()

websocket_urlpatterns = [
    re_path(r'ws/chat/$', PingPongConsumer.as_asgi()),
]