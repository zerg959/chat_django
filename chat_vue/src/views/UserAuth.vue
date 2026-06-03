<template>
  <div class="container">
    <div class="text-center mt-5">
      <h1>Welcome to Chatire!</h1>
    </div>
    
    <div class="row justify-content-center mt-4">
      <div class="col-md-6">
        <ul class="nav nav-tabs" id="myTab" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'signup' }"
              @click="activeTab = 'signup'"
              type="button"
            >
              Sign Up
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'signin' }"
              @click="activeTab = 'signin'"
              type="button"
            >
              Sign In
            </button>
          </li>
        </ul>

        <div class="tab-content mt-3">
          <!-- Sign Up Form -->
          <div v-if="activeTab === 'signup'">
            <form @submit.prevent="handleSignup">
              <div class="mb-3">
                <input 
                  v-model="signupForm.username" 
                  type="text" 
                  class="form-control" 
                  placeholder="Username" 
                  required
                >
              </div>
              <div class="mb-3">
                <input 
                  v-model="signupForm.password" 
                  type="password" 
                  class="form-control" 
                  placeholder="Password" 
                  required
                >
              </div>
              <div class="mb-3">
                <input 
                  v-model="signupForm.re_password" 
                  type="password" 
                  class="form-control" 
                  placeholder="Confirm Password" 
                  required
                >
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Sign Up
              </button>
            </form>
            <div v-if="error" class="alert alert-danger mt-3">
              {{ error }}
            </div>
          </div>

          <!-- Sign In Form -->
          <div v-if="activeTab === 'signin'">
            <form @submit.prevent="handleSignin">
              <div class="mb-3">
                <input 
                  v-model="signinForm.username" 
                  type="text" 
                  class="form-control" 
                  placeholder="Username" 
                  required
                >
              </div>
              <div class="mb-3">
                <input 
                  v-model="signinForm.password" 
                  type="password" 
                  class="form-control" 
                  placeholder="Password" 
                  required
                >
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Sign In
              </button>
            </form>
            <div v-if="error" class="alert alert-danger mt-3">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('signup')
const error = ref('')

const signupForm = reactive({
  username: '',
  password: '',
  re_password: ''
})

const signinForm = reactive({
  username: '',
  password: ''
})

const handleSignup = async () => {
  try {
    error.value = ''
    await axios.post('http://127.0.0.1:8000/auth/users/', {
      username: signupForm.username,
      password: signupForm.password,
      re_password: signupForm.re_password
    })
    
    // Автоматически входим с теми же данными
    const loginResponse = await axios.post('http://127.0.0.1:8000/auth/token/login/', {
      username: signupForm.username,
      password: signupForm.password
    })
    
    localStorage.setItem('authToken', loginResponse.data.auth_token)
    router.push('/chats')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Registration failed'
    console.error(err)
  }
}

const handleSignin = async () => {
  try {
    error.value = ''
    const response = await axios.post('http://127.0.0.1:8000/auth/token/login/', {
      username: signinForm.username,
      password: signinForm.password
    })
    
    // Сохраняем токен
    localStorage.setItem('authToken', response.data.auth_token)
    
    // Переходим к чату
    router.push('/chats')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Login failed'
    console.error(err)
  }
}
</script>

<style scoped>
/* Дополнительные стили если нужны */
</style>