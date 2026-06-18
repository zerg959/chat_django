<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-sm-8 col-md-6">
        
        <!-- Экран чата -->
        <div v-if="sessionStarted" id="chat-container" class="card shadow">
          <!-- Шапка чата -->
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

          <!-- Поле для подключения к другому чату -->
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

          <!-- Тело чата с сообщениями -->
          <div class="card-body p-0">
            <div class="chat-body p-3">
              <div v-if="messages.length === 0" class="text-center text-muted mt-4">
                <p>No messages yet. Be the first to say something!</p>
              </div>

              <div 
                v-for="(message, index) in messages" 
                :key="index" 
                class="row chat-section"
              >
                <!-- Сообщения ДРУГИХ пользователей (слева) -->
                <template v-if="username !== message.user.username">
                  <div class="col-sm-2">
                    <div 
                      class="avatar-circle"
                      :style="{ backgroundColor: getUserColor(message.user.username) }"
                    >
                      {{ message.user.username[0].toUpperCase() }}
                    </div>
                  </div>
                  <div class="col-sm-7">
                    <span class="speech-bubble speech-bubble-peer">
                      <strong class="d-block mb-1 text-primary">{{ message.user.username }}</strong>
                      {{ message.message }}
                    </span>
                  </div>
                </template>

                <!-- Сообщения ТЕКУЩЕГО пользователя (справа) -->
                <template v-else>
                  <div class="col-sm-7 offset-3">
                    <span class="speech-bubble speech-bubble-user text-white subtle-blue-gradient">
                      {{ message.message }}
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

          <!-- Поле ввода сообщения -->
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

        <!-- Стартовый экран -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const API_URL = 'http://127.0.0.1:8000'
const WS_URL = 'ws://127.0.0.1:8000'

// Состояние
const sessionStarted = ref(false)
const username = ref('')
const messages = ref([])
const message = ref('')
const messageError = ref('')
const startError = ref('')
const connectError = ref('')
const joinUriInput = ref('')
const wsConnectionStatus = ref('disconnected')

let websocket = null

// URI чата из URL
const chatUri = computed(() => route.params.uri || null)
const chatUrl = computed(() => {
  const uri = chatUri.value || '...'
  return `${window.location.origin}/chats/${uri}`
})

// Цвет аватара
const getUserColor = (name) => {
  if (!name) return '#6c757d'
  const colors = ['#007bff', '#f16000', '#28a745', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getAuthHeaders = () => ({
  Authorization: `Token ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
})

// Получение текущего пользователя
const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    const response = await axios.get(`${API_URL}/auth/users/me/`, {
      headers: { Authorization: `Token ${token}` }
    })
    username.value = response.data.username
    localStorage.setItem('username', username.value)
    return username.value
  } catch (err) {
    console.error('Failed to fetch user:', err)
    return null
  }
}

// === WebSocket ===
const connectWebSocket = (uri) => {
  if (!uri) return
  
  if (websocket) {
    websocket.close()
  }
  
  const token = localStorage.getItem('authToken')
  const wsUrl = `${WS_URL}/ws/chat/${uri}/?token=${token}`
  
  console.log('🔌 Connecting to WebSocket:', wsUrl)
  
  websocket = new WebSocket(wsUrl)
  
  websocket.onopen = () => {
    console.log('✅ WebSocket connected!')
    wsConnectionStatus.value = 'connected'
  }
  
  websocket.onclose = () => {
    console.log('❌ WebSocket disconnected')
    wsConnectionStatus.value = 'disconnected'
    setTimeout(() => {
      if (chatUri.value) connectWebSocket(chatUri.value)
    }, 3000)
  }
  
  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('📨 WebSocket message:', data)
    
    if (data.type === 'chat_message') {
      const exists = messages.value.some(
        m => m.message === data.message.message && 
             m.user?.username === data.message.user?.username
      )
      if (!exists) {
        messages.value.push(data.message)
      }
    }
  }
  
  websocket.onerror = (error) => {
    console.error('❌ WebSocket error:', error)
  }
}

const sendWebSocketMessage = (msg) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ message: msg }))
    return true
  }
  return false
}

// Выход
const logout = async () => {
  if (websocket) websocket.close()
  try {
    const token = localStorage.getItem('authToken')
    if (token) {
      await axios.post(`${API_URL}/auth/token/logout/`, {}, {
        headers: { Authorization: `Token ${token}` }
      })
    }
  } catch (err) {
    console.error(err)
  } finally {
    localStorage.removeItem('authToken')
    localStorage.removeItem('username')
    router.push('/auth')
  }
}

// Создание чата
const startChatSession = async () => {
  startError.value = ''
  try {
    const response = await axios.post(
      `${API_URL}/api/chats/`,
      {},
      { headers: getAuthHeaders() }
    )
    const uri = response.data.uri
    sessionStarted.value = true
    router.push(`/chats/${uri}/`)
  } catch (err) {
    startError.value = err.response?.data?.detail || 'Failed to create chat'
  }
}

// Подключение к чату по ссылке
const connectToChat = async () => {
  if (!joinUriInput.value.trim()) {
    connectError.value = 'Please enter a chat URL or URI'
    return
  }
  connectError.value = ''
  
  let uri = joinUriInput.value.trim()
  if (uri.includes('/chats/')) {
    const match = uri.match(/\/chats\/([a-zA-Z0-9]+)/)
    if (match) uri = match[1]
  }
  
  if (!username.value) {
    connectError.value = 'Username not found. Please login again.'
    return
  }
  
  router.push(`/chats/${uri}/`)
  joinUriInput.value = ''
}

// Присоединение к чату
const joinChatSession = async () => {
  const uri = chatUri.value
  if (!uri) return
  
  if (!username.value) {
    messageError.value = 'Username not found. Please login again.'
    return
  }
  
  try {
    const response = await axios.patch(
      `${API_URL}/api/chats/${uri}/`,
      { username: username.value },
      { headers: getAuthHeaders() }
    )
    
    const user = response.data.members.find(
      (member) => member.username === username.value
    )
    
    if (user) {
      sessionStarted.value = true
      await fetchChatSessionHistory()
      connectWebSocket(uri)
    }
  } catch (err) {
    console.error('Error joining chat:', err)
    messageError.value = 'Failed to join chat session'
  }
}

// Загрузка истории
const fetchChatSessionHistory = async () => {
  const uri = chatUri.value
  if (!uri) return
  
  try {
    const response = await axios.get(
      `${API_URL}/api/chats/${uri}/messages/`,
      { headers: getAuthHeaders() }
    )
    messages.value = response.data.messages || []
  } catch (err) {
    console.error('Error fetching history:', err)
  }
}

// Отправка сообщения
const postMessage = async () => {
  if (!message.value.trim()) return
  messageError.value = ''
  
  const sent = sendWebSocketMessage(message.value)
  
  if (sent) {
    message.value = ''
  } else {
    const uri = chatUri.value
    if (!uri) return
    
    try {
      const response = await axios.post(
        `${API_URL}/api/chats/${uri}/messages/`,
        { message: message.value },
        { headers: getAuthHeaders() }
      )
      messages.value.push(response.data)
      message.value = ''
    } catch (err) {
      messageError.value = err.response?.data?.detail || 'Failed to send message'
    }
  }
}

const copyUrl = () => {
  navigator.clipboard.writeText(chatUrl.value)
    .then(() => alert('✅ URL copied!'))
    .catch(() => alert('❌ Failed to copy'))
}

// Watcher для URI
watch(chatUri, async (newUri) => {
  if (newUri && username.value) {
    await joinChatSession()
  }
})

onMounted(async () => {
  if (!username.value) {
    await fetchCurrentUser()
  }
  
  if (chatUri.value && username.value) {
    await joinChatSession()
  }
})

onUnmounted(() => {
  if (websocket) websocket.close()
})
</script>

<style scoped>
.card {
  border-radius: 0.5rem;
  overflow: hidden;
}

.subtle-blue-gradient {
  background: linear-gradient(45deg, #004bff, #007bff);
}

.chat-body {
  height: 400px;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.chat-section {
  margin-bottom: 15px;
}

.chat-section:first-child {
  margin-top: 10px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.speech-bubble {
  display: inline-block;
  position: relative;
  border-radius: 0.5rem;
  padding: 10px 14px;
  background-color: #fff;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  max-width: 100%;
  word-wrap: break-word;
}

.speech-bubble-user {
  border-bottom-right-radius: 0;
}

.speech-bubble-peer {
  border-bottom-left-radius: 0;
}

.speech-bubble-user::after {
  content: "";
  position: absolute;
  right: -10px;
  top: 10px;
  width: 0;
  height: 0;
  border: 10px solid transparent;
  border-left-color: #007bff;
  border-right: 0;
  border-top: 0;
  margin-top: -5px;
}

.speech-bubble-peer::after {
  content: "";
  position: absolute;
  left: -10px;
  top: 10px;
  width: 0;
  height: 0;
  border: 10px solid transparent;
  border-right-color: #fff;
  border-top: 0;
  border-left: 0;
  margin-top: -5px;
}

.card-footer input[type="text"] {
  padding: 8px 12px;
  font-size: 14px;
}

code {
  font-family: 'Courier New', monospace;
}
</style>