"""
ASGI config for transcedence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "transcedence.settings")
application = get_asgi_application()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from whitenoise import WhiteNoise

from pingpong import routing as pingpong_routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "transcedence.settings")

application = WhiteNoise(
    application,
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../static"),
)
application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter(pingpong_routing.websocket_urlpatterns)
        ),
    }
)
