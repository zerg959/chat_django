"""WebSocket consumers for the chat app."""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, ChatSessionMessage


@database_sync_to_async
def get_user_from_token(token_key):
    """Getting user by Token (Sync function)."""
    from rest_framework.authtoken.models import Token
    try:
        token_obj = Token.objects.get(key=token_key)
        return token_obj.user
    except Token.DoesNotExist:
        return None


@database_sync_to_async
def get_chat_session(uri):
    """Получить чат-сессию по URI."""
    try:
        return ChatSession.objects.get(uri=uri)
    except ChatSession.DoesNotExist:
        return None


@database_sync_to_async
def create_message(user, chat_session, message):
    """Create message in DB."""
    return ChatSessionMessage.objects.create(
        user=user,
        chat_session=chat_session,
        message=message
    )


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Takes chat-URI from URL
        self.uri = self.scope['url_route']['kwargs']['uri']
        self.room_group_name = f'chat_{self.uri}'
        
        # Authentication by token in query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if token:
            '''Call async function to get user'''
            self.user = await get_user_from_token(token)
            if not self.user:
                print("❌ Token not found or invalid")
                await self.close()
                return
        else:
            print("❌ No token provided")
            await self.close()
            return
        
        # Connect to chat
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"✅ WebSocket connected: {self.user.username} -> chat {self.uri}")

    async def disconnect(self, close_code):
        print(f"❌ WebSocket disconnected: {self.uri}")
        # Logout chat
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Getting message from client."""
        try:
            data = json.loads(text_data)
            message = data.get('message', '')
            
            if not message:
                return
            
            # Getting chat-session
            chat_session = await get_chat_session(self.uri)
            if not chat_session:
                print(f"❌ Chat session not found: {self.uri}")
                return
            
            # Save message un DB
            await create_message(self.user, chat_session, message)
            
            # Sent message to chat users
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'user': {'username': self.user.username},
                        'message': message
                    }
                }
            )
        except Exception as e:
            print(f"Error receiving message: {e}")

    async def chat_message(self, event):
        """Sent meddsge to client."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))