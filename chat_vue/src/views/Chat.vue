<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-sm-8 col-md-6">
        
        <!-- Chat screen -->
        <div v-if="sessionStarted" id="chat-container" class="card shadow">
          <!-- Chat header -->
          <div class="card-header text-white subtle-blue-gradient">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="small">
                📢 Share this URL to invite friends
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge" 
                      :class="wsConnectionStatus === 'connected' ? 'bg-success' : 'bg-warning'">
                  {{ wsConnectionStatus === 'connected' ? '● Live' : '○ Connecting...' }}
                </span>
                <button class="btn btn-sm btn-outline-light" @click="logout">
                  🚪 Logout
                </button>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <code class="bg-white text-dark px-2 py-1 rounded flex-grow-1" style="font-size: 0.75rem;">
                {{ chatUrl }}
              </code>
              <button class="btn btn-sm btn-light" @click="copyUrl" title="Copy URL">
                📋
              </button>
            </div>
          </div>

          <!-- Other chat connection field -->
          <div class="card-header bg-light border-bottom">
            <div class="input-group input-group-sm">
              <input
                v-model="joinUriInput"
                type="text"
                class="form-control"
                placeholder="🔗 Paste chat URL to join another chat..."
              >
              <button 
                class="btn btn-success" 
                type="button"
                @click="connectToChat"
                :disabled="!joinUriInput.trim()"
              >
                Join Chat
              </button>
            </div>
            <div v-if="connectError" class="alert alert-danger mt-2 mb-0 py-1 small">
              {{ connectError }}
            </div>
          </div>

          <!-- Chat body with messages -->
          <div class="card-body p-0">
            <div class="chat-body p-3">
              <div v-if="messages.length === 0" class="text-center text-muted mt-4">
                <p>No messages yet. Be the first to say something!</p>
              </div>

              <div 
                v-for="(msg, index) in messages" 
                :key="index" 
                class="row chat-section"
              >
                <!-- OTHER users messages (left side) -->
                <template v-if="username !== msg.user.username">
                  <div class="col-sm-2">
                    <div 
                      class="avatar-circle"
                      :style="{ backgroundColor: getUserColor(msg.user.username) }"
                    >
                      {{ msg.user.username[0].toUpperCase() }}
                    </div>
                  </div>
                  <div class="col-sm-7">
                    <span class="speech-bubble speech-bubble-peer">
                      <strong class="d-block mb-1 text-primary">{{ msg.user.username }}</strong>
                      {{ msg.message }}
                    </span>
                  </div>
                </template>

                <!-- CURRENT user messages (right side) -->
                <template v-else>
                  <div class="col-sm-7 offset-3">
                    <span class="speech-bubble speech-bubble-user text-white subtle-blue-gradient">
                      {{ msg.message }}
                    </span>
                  </div>
                  <div class="col-sm-2">
                    <div 
                      class="avatar-circle"
                      :style="{ backgroundColor: getUserColor(username) }"
                    >
                      {{ username[0].toUpperCase() }}
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Message field -->
          <div class="card-footer">
            <form @submit.prevent="postMessage">
              <div class="row g-2">
                <div class="col-10">
                  <input 
                    v-model="message" 
                    type="text" 
                    class="form-control" 
                    placeholder="Type a message..." 
                    required
                  >
                </div>
                <div class="col-2">
                  <button type="submit" class="btn btn-primary w-100">
                    Send
                  </button>
                </div>
              </div>
            </form>
            <div v-if="messageError" class="alert alert-danger mt-2 py-1 small mb-0">
              {{ messageError }}
            </div>
          </div>
        </div>

        <!-- Start screen -->
        <div v-else class="card shadow text-center py-5">
          <h3 class="text-center mb-3">Welcome, {{ username || 'User' }}! 👋</h3>
          
          <div class="mb-4">
            <p class="text-muted px-4">
              Create a new chat session and invite your friends
            </p>
            <button 
              @click="startChatSession" 
              class="btn btn-primary btn-lg px-5 mb-3"
            >
              🚀 Start New Chat
            </button>
            <div v-if="startError" class="alert alert-danger mt-2 mb-0">
              {{ startError }}
            </div>
          </div>

          <hr class="my-4">

          <div>
            <p class="text-muted px-4">
              Or join an existing chat session by pasting the link
            </p>
            <div class="px-4">
              <div class="input-group mb-3">
                <input
                  v-model="joinUriInput"
                  type="text"
                  class="form-control"
                  placeholder="Paste chat URL or URI here..."
                >
                <button 
                  class="btn btn-success" 
                  type="button"
                  @click="connectToChat"
                  :disabled="!joinUriInput.trim()"
                >
                  Connect to Chat
                </button>
              </div>
              <div v-if="connectError" class="alert alert-danger mt-2 mb-0">
                {{ connectError }}
              </div>
            </div>
          </div>

          <div class="mt-4">
            <button @click="logout" class="btn btn-outline-secondary btn-sm">
              🚪 Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useChat } from '../composables/useChat'
import '../styles/Chat.css'

// import logic from composable
const {
  sessionStarted,
  username,
  messages,
  message,
  messageError,
  startError,
  connectError,
  joinUriInput,
  wsConnectionStatus,
  chatUrl,
  getUserColor,
  logout,
  startChatSession,
  connectToChat,
  postMessage,
  copyUrl,
} = useChat()
</script>