"""Views for the chat app."""
from django.contrib.auth import get_user_model
from .models import (
    ChatSession, ChatSessionMember, ChatSessionMessage, deserialize_user
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


class ChatSessionView(APIView):
    """Manage Chat sessions."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        """create a new chat session."""
        user = request.user
        chat_session = ChatSession.objects.create(owner=user)
        
        # IMPORTANT! ADD OWNER INTO CHAT immediatly!
        ChatSessionMember.objects.create(user=user, chat_session=chat_session)
        
        return Response({
            'status': 'SUCCESS', 'uri': chat_session.uri,
            'message': 'New chat session created'
        })

    def patch(self, request, *args, **kwargs):
        """Add a user to a chat session."""
        User = get_user_model()
        uri = kwargs.get('uri')
        
        if not uri:
            return Response({'error': 'URI is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            chat_session = ChatSession.objects.get(uri=uri)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)

        owner = chat_session.owner

        # If user != owner — add him to members
        if owner != user:
            ChatSessionMember.objects.get_or_create(
                user=user, chat_session=chat_session
            )

        # Collect all chat members
        member_objects = ChatSessionMember.objects.filter(chat_session=chat_session)
        members = [deserialize_user(member.user) for member in member_objects]

        # Add owner at first if he is not a member
        owner_data = deserialize_user(owner)
        member_usernames = [m['username'] for m in members]
        if owner.username not in member_usernames:
            members.insert(0, owner_data)

        return Response({
            'status': 'SUCCESS', 'members': members,
            'message': '%s joined the chat' % user.username,
            'user': deserialize_user(user)
        })


class ChatSessionMessageView(APIView):
    """Create/Get Chat session messages."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        """return all messages in a chat session."""
        uri = kwargs.get('uri')
        if not uri:
            return Response({'error': 'URI is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chat_session = ChatSession.objects.get(uri=uri)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)

        messages = [msg.to_json() for msg in chat_session.messages.all()]
        return Response({
            'id': chat_session.id, 'uri': chat_session.uri,
            'messages': messages
        })

    def post(self, request, *args, **kwargs):
        """create a new message in a chat session."""
        uri = kwargs.get('uri')
        if not uri:
            return Response({'error': 'URI is required'}, status=status.HTTP_400_BAD_REQUEST)

        message_text = request.data.get('message')
        if not message_text:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chat_session = ChatSession.objects.get(uri=uri)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)

        ChatSessionMessage.objects.create(
            user=request.user, chat_session=chat_session, message=message_text
        )
        return Response({
            'status': 'SUCCESS', 'uri': chat_session.uri, 'message': message_text,
            'user': deserialize_user(request.user)
        })