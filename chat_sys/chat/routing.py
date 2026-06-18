"""WebSocket routing for the chat app."""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<uri>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
