import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

export function useChat() {
  const route = useRoute()
  const router = useRouter()

  // const API_URL = 'http://127.0.0.1:8000'
  // const WS_URL = 'ws://127.0.0.1:8000'
  const API_URL = ''
  const WS_URL = ''
  // Condition
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

  // chat-URI from URL
  const chatUri = computed(() => route.params.uri || null)
  const chatUrl = computed(() => {
    const uri = chatUri.value || '...'
    return `${window.location.origin}/chats/${uri}`
  })

  // Avatar color
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

  // Extracting current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return null
      const response = await axios.get(`/auth/users/me/`, {
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
    const protocol = window.location.protocol === 'https' ? 'wss' : 'ws'
    const wsUrl = `${protocol}//${window.Location.host}ws/chat/${uri}/?token=${token}`

    console.log(' Connecting to WebSocket:', wsUrl)

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
        await axios.post(`/auth/token/logout/`, {}, {
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

  // Create chat
  const startChatSession = async () => {
    startError.value = ''
    try {
      const response = await axios.post(
        `/api/chats/`,
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

  // Connect to chat by link
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

  // Connect to chat
  const joinChatSession = async () => {
    const uri = chatUri.value
    if (!uri) return

    if (!username.value) {
      messageError.value = 'Username not found. Please login again.'
      return
    }

    try {
      const response = await axios.patch(
        `$/api/chats/${uri}/`,
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

  // History load
  const fetchChatSessionHistory = async () => {
    const uri = chatUri.value
    if (!uri) return

    try {
      const response = await axios.get(
        `$/api/chats/${uri}/messages/`,
        { headers: getAuthHeaders() }
      )
      messages.value = response.data.messages || []
    } catch (err) {
      console.error('Error fetching history:', err)
    }
  }

  // Sent message
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
          `$api/chats/${uri}/messages/`,
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

  // Watcher for URI
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

  return {
    // Condition
    sessionStarted,
    username,
    messages,
    message,
    messageError,
    startError,
    connectError,
    joinUriInput,
    wsConnectionStatus,
    chatUri,
    chatUrl,

    // Methods
    getUserColor,
    logout,
    startChatSession,
    connectToChat,
    joinChatSession,
    postMessage,
    copyUrl,
  }
}