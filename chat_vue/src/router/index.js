import { createRouter, createWebHistory } from 'vue-router'
import Chat from '../views/Chat.vue'
import UserAuth from '../views/UserAuth.vue'

const routes = [
  {
    path: '/chats',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'UserAuth',
    component: UserAuth
  },
  {
    path: '/',
    redirect: '/chats'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard для проверки авторизации
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')
  
  if (to.meta.requiresAuth && !token) {
    next('/auth')
  } else if (to.path === '/auth' && token) {
    next('/chats')
  } else {
    next()
  }
})

export default router