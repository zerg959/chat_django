<template>
  <div class="container mt-4">
    <h1>Chat Room</h1>
    <button @click="logout" class="btn btn-danger">Logout</button>
    <div class="mt-4">
      <p>Chat will be here...</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const logout = async () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    await axios.post('http://127.0.0.1:8000/auth/token/logout/', {}, {
      headers: { 'Authorization': `Token ${token}` }
    })
    localStorage.removeItem('authToken')
    router.push('/auth')
  }
}
</script>