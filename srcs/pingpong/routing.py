from django.urls import re_path

from .consumers import ChatConsumer, LongPollConsumer

import django

django.setup()

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<token>[\w-]+)/$", ChatConsumer.as_asgi()),
    re_path(r"messages/long-poll/", LongPollConsumer.as_asgi()),
]
