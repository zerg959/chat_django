# Django Chat

[![Maintainability](https://qlty.sh/gh/zerg959/projects/chat_django/maintainability.png)](https://qlty.sh/gh/zerg959/projects/chat_django)

## Real-time Web Chat

**GitHub:** `https://github.com/zerg959/chat_django`

### Description:
Online real-time web-chat with unique session-id.
Every chat has unique URI. Only users with chat-link can be added there.<br>
**[Demo - video](https://disk.yandex.ru/d/_Kq9fHMiT8TzRw)**<br>
**[Demo - video2](https://drive.google.com/file/d/1Ssb6XOxeqUHPCnuIesRQODBbRAAYpFI8/view?usp=drive_link)**<br>
**Stack:**
- Djoser-auth + Token
- Chats, users and messages REST API
- Real-time chatting over Django Channels + WebSocket
- Web-socket Django Channels (Redis Channel Layer)
- Caddy Reverse proxy with HTTPS
- Docker Containerization (Docker Compose, Django + Vue + Redis)

### Technical data

| Parameter              | Data                                                            |
|------------------------|-----------------------------------------------------------------|
| Project name           | Chatire                                                         |
| Repo                   | `https://github.com/zerg959/chat_django`                        |
| Deploy                 | `https://hub959.ru`                                             |
| Frontend               | Vue 3 + Vite                                                    |
| Backend                | Django + DRF + Djoser + Channels + Daphne                       |
| Dat base               | SQLite                                                          |
| Real-time              | WebSocket + Redis (channels_redis)                              |
| Reverse Proxy / HTTPS  | Caddy (Let's Encrypt auto-SSL)                                  |
| Containerization       | Docker + Docker Compose                                         |
| Test login1            | `testuser123`                                                   |
| Test pass1             | `@123Qwe123`                                                    |
| Test login2            | `testuser456`                                                   |
| Test pass2             | `@123Qwe123`                                                    |

### Local deploy:
- install Docker Compose Plugin
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```
- clone repo into your local computer
```bash
git clone git@github.com:zerg959/chat_django.git
```
- go to created directory
```bash
cd chat_django
```
- copy `.env.example` and create `.env` with your own environment variables
```bash
cp .env.example .env
```
- build app from docker compose file
```bash
docker compose build
```
- run Docker containers
```bash
docker compose up -d
```
- Application will be available on http://localhost or 0.0.0.0
- For production mode you had to change commented settings in `.env`, `Caddyfile` and `docker-compose.yml`<br>

### Data flow:

1. **Statics:** Caddy share collected static to Vue SPA from `/usr/share/caddy`
2. **API:** Requests `/api/*` and `/auth/*` are proxied by Caddy → Django (port 8000)
3. **WebSocket:** Requests `/ws/*` are proxied by Caddy → Daphne (ASGI), Redis used as Channel Layer for message delivering between WebSocket-connections.

**Data connections:**
- `User` 1 → ∞ `ChatSessionMessage` (One-To-Many)
- `ChatSession` 1 → ∞ `ChatSessionMessage` (One-To-Many)
- `ChatSession` ∞ ↔ ∞ `User` (Many-To-Many via assotiation table members or via messages)
- `User` 1 → 1 `Token` (One-To-One, Auth Token)


#### API ENDPOINTS

| Method | Endpoint                     | Auth   | Description                         | Request Body                              | Response                          |
|--------|------------------------------|--------|----------------------------------|-------------------------------------------|-----------------------------------|
| POST   | `/auth/users/`               | No    | Registration                      | `{username, password, re_password}`       | 201: `{email, username}`          |
| POST   | `/auth/token/login/`         | No    | Login                             | `{username, password}`                    | 200: `{auth_token}`               |
| POST   | `/auth/token/logout/`        | Token  | Logout                           | —                                         | 204                               |
| GET    | `/auth/users/me/`            | Token  | Current user             | —                                         | 200: `{id, username, email}`      |
| POST   | `/api/chats/`                | Token  | New chat                    | —                                         | 201: `{uri, members, created_at}` |
| PATCH  | `/api/chats/{uri}/`          | Token  | Connect to chat             | `{username}`                              | 200: `{uri, members}`             |
| GET    | `/api/chats/{uri}/messages/` | Token  | History                | —                                         | 200: `{messages: [...]}`          |
| POST   | `/api/chats/{uri}/messages/` | Token  | Sending (HTTP fallback)         | `{message}`                               | 201: `{user, message, created_at}`|
| WS     | `/ws/chat/{uri}/?token=`     | Query  | WebSocket-connection             | `{message: "text"}`                       | `{type: "chat_message", message}` |

---
