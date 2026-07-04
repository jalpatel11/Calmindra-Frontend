# Calmindra API Documentation

This document describes the API endpoints for both the FastAPI backend and the Next.js frontend proxy layer.

---

## 🖥️ Backend APIs (FastAPI)

The backend handles core logic, database interactions with Neo4j, vector similarity searches, and communication with Google Vertex AI (Gemini).

### 1. Chat Completion (`POST /chat/`)
Submits a user message, performs RAG context retrieval, queries Vertex AI, saves the conversation, and returns the response.

* **URL**: `/chat/`
* **Method**: `POST`
* **Headers**:
  * `X-Session-ID` (Optional): ID of the conversation thread.
  * `X-User-ID` (Optional, defaults to `"default_user"`): ID of the user.
* **Request Body (`application/json`)**:
  ```json
  {
    "user_message": "I feel anxious today.",
    "session_id": "session123"
  }
  ```
* **Response (`application/json`)**:
  ```json
  {
    "bot_message": "I'm sorry you're feeling anxious. Take a deep breath..."
  }
  ```

### 2. List Threads (`GET /threads/`)
Lists all threads belonging to the authenticated user.

* **URL**: `/threads/`
* **Method**: `GET`
* **Headers**:
  * `X-User-ID` (Optional, defaults to `"default_user"`): ID of the user.
* **Response (`application/json`)**:
  ```json
  [
    {
      "id": "thread_123",
      "title": "Chat Conversation",
      "createdAt": "2026-07-04T08:31:26Z"
    }
  ]
  ```

### 3. Create Thread (`POST /threads/`)
Registers a new thread node for the user in the database.

* **URL**: `/threads/`
* **Method**: `POST`
* **Headers**:
  * `X-User-ID` (Optional, defaults to `"default_user"`): ID of the user.
* **Request Body (`application/json`)**:
  ```json
  {
    "id": "thread-uuid-123",
    "title": "New Chat Session"
  }
  ```
* **Response (`application/json`)**:
  ```json
  {
    "id": "thread-uuid-123",
    "title": "New Chat Session",
    "createdAt": "2026-07-04T09:16:06Z"
  }
  ```

### 4. Delete Thread (`DELETE /threads/{thread_id}`)
Deletes a thread node and all its related messages from the database.

* **URL**: `/threads/{thread_id}`
* **Method**: `DELETE`
* **Response (`application/json`)**:
  ```json
  {
    "status": "success",
    "message": "Thread deleted"
  }
  ```

### 5. Fetch Messages (`GET /threads/{thread_id}/messages`)
Retrieves the full message history for a specific thread, sorted chronologically.

* **URL**: `/threads/{thread_id}/messages`
* **Method**: `GET`
* **Response (`application/json`)**:
  ```json
  [
    {
      "id": "msg-uuid-abc",
      "role": "user",
      "content": "I feel anxious today.",
      "createdAt": "2026-07-04T09:16:06Z"
    },
    {
      "id": "msg-uuid-def",
      "role": "assistant",
      "content": "I'm here to listen. What’s causing the anxiety?",
      "createdAt": "2026-07-04T09:16:08Z"
    }
  ]
  ```

---

## 🌐 Frontend Proxy APIs (Next.js)

Next.js acts as a secure proxy edge layer to prevent exposing the GCP backend URL directly to the browser client and to convert responses into streaming format.

### 1. Stream Chat Completion (`POST /api/chat`)
Proxies chat completions from the backend and streams the words back to the browser client using Vercel AI SDK's Data Stream Protocol.

* **URL**: `/api/chat`
* **Method**: `POST`
* **Headers**:
  * `x-session-id` (Optional): ID of the active thread.
* **Request Body (`application/json`)**:
  ```json
  {
    "id": "thread-uuid-123",
    "messages": [
      {
        "role": "user",
        "parts": [{ "type": "text", "text": "hii" }]
      }
    ]
  }
  ```
* **Response (`text/event-stream`)**:
  Returns real-time text chunks using the Vercel AI SDK format:
  ```text
  0:"Hello"
  0:" there!"
  e:{"finishReason":"stop","usage":{"promptTokens":1,"completionTokens":2}}
  ```

### 2. Thread List Proxy (`GET /api/threads`)
Proxies listing threads from the backend database.

* **URL**: `/api/threads`
* **Method**: `GET`
* **Response (`application/json`)**: Same schema as backend `GET /threads/`.

### 3. Create Thread Proxy (`POST /api/threads`)
Proxies creating a new thread in the backend database.

* **URL**: `/api/threads`
* **Method**: `POST`
* **Request Body (`application/json`)**: Same schema as backend `POST /threads/`.
* **Response (`application/json`)**: Same schema as backend `POST /threads/`.

### 4. Delete Thread Proxy (`DELETE /api/threads/[id]`)
Proxies deleting a thread in the backend database.

* **URL**: `/api/threads/[id]`
* **Method**: `DELETE`
* **Response (`application/json`)**: Same schema as backend `DELETE /threads/{thread_id}`.

### 5. Fetch Messages Proxy (`GET /api/threads/[id]/messages`)
Proxies fetching conversation message history from the backend database.

* **URL**: `/api/threads/[id]/messages`
* **Method**: `GET`
* **Response (`application/json`)**: Same schema as backend `GET /threads/{thread_id}/messages`.
