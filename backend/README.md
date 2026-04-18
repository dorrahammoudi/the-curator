# Academic Content Recommendation System — Backend API

A production-ready Node.js/Express REST API that recommends academic resources to students using a hybrid content-based + collaborative filtering engine.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js 18+                         |
| Framework      | Express.js 4                        |
| Database       | MySQL 8                             |
| Auth           | JWT (jsonwebtoken) + bcryptjs       |
| Validation     | express-validator                   |
| Logging        | Winston + Morgan                    |
| ORM            | mysql2/promise (raw queries)        |

---

## Project Structure

```
academic-recommendation/
├── app.js                          # Express app setup
├── server.js                       # Entry point / HTTP server
├── schema.sql                      # Full MySQL schema
├── package.json
├── .env.example
│
├── config/
│   └── db.js                       # MySQL connection pool
│
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── resource.controller.js
│   ├── tag.controller.js
│   ├── profile.controller.js
│   ├── interaction.controller.js
│   └── recommendation.controller.js
│
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── resource.routes.js
│   ├── tag.routes.js
│   ├── profile.routes.js
│   ├── interaction.routes.js
│   └── recommendation.routes.js
│
├── models/
│   ├── user.model.js
│   ├── resource.model.js
│   ├── tag.model.js
│   ├── profile.model.js
│   ├── interaction.model.js
│   └── recommendation.model.js
│
├── middlewares/
│   ├── auth.js                     # JWT authenticate + authorize
│   ├── validate.js                 # express-validator rule sets
│   └── errorHandler.js             # 404 + global error handler
│
├── services/
│   ├── recommendation.service.js   # Hybrid recommendation engine
│   └── logger.js                   # Winston logger
│
└── logs/
    ├── combined.log
    └── error.log
```

---

## Setup & Installation

### 1. Prerequisites

- Node.js ≥ 18
- MySQL 8 running locally (or remote)
- npm

### 2. Clone & install

```bash
git clone <repo-url>
cd academic-recommendation
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=academic_recommendation

JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

ALPHA=0.7
BETA=0.3
```

### 4. Create the database

```bash
mysql -u root -p < schema.sql
```

Or manually in MySQL:

```sql
SOURCE /path/to/schema.sql;
```

### 5. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:3000`

---

## Recommendation Engine

### Formula

```
S(u, r) = α × cosine_similarity(u_tags, r_tags) + β × interaction_score
```

| Variable             | Description                                    | Default |
|----------------------|------------------------------------------------|---------|
| `α`                  | Weight for content similarity                  | 0.7     |
| `β`                  | Weight for past interaction behavior           | 0.3     |
| `cosine_similarity`  | Dot product of tag vectors / product of norms  | [0, 1]  |
| `interaction_score`  | Min-max normalised weighted interaction sum    | [0, 1]  |

### Interaction Weights

| Type       | Weight |
|------------|--------|
| FAVORITE   | +1.0   |
| DOWNLOAD   | +0.7   |
| VIEW       | +0.3   |
| IGNORE     | −0.5   |

---

## API Reference

All endpoints (except auth) require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint              | Auth | Description       |
|--------|-----------------------|------|-------------------|
| POST   | `/api/auth/register`  | ✗    | Register new user |
| POST   | `/api/auth/login`     | ✗    | Login, get JWT    |

**Register body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "ETUDIANT",
  "filiere": "Informatique",
  "niveau": "L3"
}
```

**Login body:**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Login response:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": 1, "name": "Alice", "email": "...", "role": "ETUDIANT" }
}
```

---

### Users

| Method | Endpoint         | Auth | Description   |
|--------|------------------|------|---------------|
| GET    | `/api/users/:id` | ✓    | Get user by id |

---

### Resources

| Method | Endpoint              | Auth               | Description          |
|--------|-----------------------|--------------------|----------------------|
| GET    | `/api/resources`      | ✓ (any)            | List (paginated)     |
| GET    | `/api/resources/:id`  | ✓ (any)            | Get one + tags       |
| POST   | `/api/resources`      | ✓ ENSEIGNANT/ADMIN | Create resource      |

**Query params for GET /api/resources:**
- `page` (default: 1)
- `limit` (default: 10)
- `type` — `COURS | EXERCICE | ARTICLE`

**Create resource body:**
```json
{
  "title": "Introduction à Python",
  "description": "Cours complet Python pour débutants",
  "type": "COURS",
  "file_url": "https://storage.example.com/python101.pdf",
  "tags": [
    { "tag_id": 1, "weight": 5 },
    { "tag_id": 3, "weight": 3 }
  ]
}
```

---

### Tags

| Method | Endpoint     | Auth               | Description   |
|--------|--------------|--------------------|---------------|
| GET    | `/api/tags`  | ✓ (any)            | List all tags |
| POST   | `/api/tags`  | ✓ ENSEIGNANT/ADMIN | Create tag    |

**Create tag body:**
```json
{ "name": "Python", "category": "Programmation" }
```

---

### Student Profile

| Method | Endpoint                  | Auth              | Description              |
|--------|---------------------------|-------------------|--------------------------|
| POST   | `/api/profile/tags`       | ✓ ETUDIANT/ADMIN  | Set interest tags        |
| GET    | `/api/profile/:userId`    | ✓ (own or ADMIN)  | Get profile + tag vector |

**Set profile tags body:**
```json
{
  "tags": [
    { "tag_id": 1, "weight": 3.0 },
    { "tag_id": 2, "weight": 2.5 }
  ]
}
```

---

### Interactions

| Method | Endpoint            | Auth             | Description         |
|--------|---------------------|------------------|---------------------|
| POST   | `/api/interactions` | ✓ ETUDIANT/ADMIN | Record interaction  |

**Body:**
```json
{ "resource_id": 5, "type": "FAVORITE" }
```

Types: `VIEW | DOWNLOAD | FAVORITE | IGNORE`

> Recording an interaction also automatically updates the student's profile tag weights for the resource's tags.

---

### Recommendations

| Method | Endpoint                          | Auth            | Description                          |
|--------|-----------------------------------|-----------------|--------------------------------------|
| GET    | `/api/recommendations/:userId`    | ✓ (own or ADMIN)| Recompute + return top resources     |
| GET    | `/api/recommendations/:userId/cached` | ✓          | Return last computed (no recompute)  |

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": 42,
      "score": 0.847231,
      "clicked": false,
      "resource_id": 7,
      "title": "Algorithmes de tri",
      "type": "COURS",
      "teacher_name": "Prof. Dupont",
      "file_url": "..."
    }
  ]
}
```

---

## Roles & Access Control

| Role       | Can do                                                        |
|------------|---------------------------------------------------------------|
| ETUDIANT   | Read resources, manage own profile, record interactions, get own recommendations |
| ENSEIGNANT | All of ETUDIANT + create resources & tags                     |
| ADMIN      | Full access to all endpoints and all users                    |

---

## Example Workflow

```bash
# 1. Register a teacher
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Prof. Ben","email":"prof@uni.tn","password":"pass123","role":"ENSEIGNANT"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prof@uni.tn","password":"pass123"}' | jq -r .token)

# 3. Create a tag
curl -X POST http://localhost:3000/api/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Algorithmique","category":"Informatique"}'

# 4. Create a resource with that tag
curl -X POST http://localhost:3000/api/resources \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tri rapide","type":"COURS","tags":[{"tag_id":1,"weight":5}]}'

# 5. Register a student
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Etudiant A","email":"student@uni.tn","password":"pass123","role":"ETUDIANT"}'

STUDENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@uni.tn","password":"pass123"}' | jq -r .token)

# 6. Student sets interest tags
curl -X POST http://localhost:3000/api/profile/tags \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags":[{"tag_id":1,"weight":4.0}]}'

# 7. Get recommendations
curl http://localhost:3000/api/recommendations/2 \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

## Logging

- Console: coloured, all levels in dev
- `logs/combined.log`: all levels
- `logs/error.log`: errors only

Log level is `warn` in production, `debug` in development.
