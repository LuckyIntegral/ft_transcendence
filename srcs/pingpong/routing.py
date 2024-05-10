from django.urls import re_path

from .consumers import PingPongConsumer, MessagesLongPollConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<token>[\w-]+)/$', PingPongConsumer.as_asgi()),
    re_path(r'messages/long-poll/', MessagesLongPollConsumer.as_asgi()),
]
