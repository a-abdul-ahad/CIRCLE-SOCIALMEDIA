# CodeAlpha_SocialMedia

Mini Social Media Platform — **CodeAlpha Full Stack Development Internship, Task 2**

A full-stack social app with user profiles, posts, comments, and a like/follow system, built with **Express.js + MongoDB** and a plain **HTML/CSS/JS** frontend.

## Features
- 👤 User registration & login (JWT auth, hashed passwords)
- 📝 Create, view, and delete posts
- ❤️ Like / unlike posts
- 💬 Comment on posts
- ➕ Follow / unfollow other users
- 🧑‍🤝‍🧑 User profiles showing bio, follower/following counts, and their posts

## Tech Stack
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend:** Plain HTML, CSS, JavaScript (fetch-based API calls, no framework)

## Setup & Run

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/codealpha_socialmedia
JWT_SECRET=change_this_to_a_long_random_secret
```
> Note: this uses port **5001** by default so it can run alongside the Task 1 e-commerce app (port 5000) without conflicting.

### 3. Seed sample data (optional)
```bash
npm run seed
```
Creates 3 sample users and a few posts. Sample login: `amina@example.com` / `password123`

### 4. Start the server
```bash
npm start
# or for auto-restart during development:
npm run dev
```

Open:
```
http://localhost:5001
```

## API Overview

| Method | Endpoint                          | Auth      | Description                     |
|--------|------------------------------------|-----------|----------------------------------|
| POST   | /api/auth/register                  | Public    | Create account, returns token    |
| POST   | /api/auth/login                     | Public    | Login, returns token             |
| GET    | /api/users/:username                 | Public    | View a user's profile            |
| PUT    | /api/users/me/update                  | Logged-in | Update own name/bio/avatar       |
| POST   | /api/users/:id/follow                  | Logged-in | Follow a user                    |
| POST   | /api/users/:id/unfollow                 | Logged-in | Unfollow a user                  |
| GET    | /api/posts                            | Public    | Feed (all posts, or ?user=id)    |
| GET    | /api/posts/:id                         | Public    | Single post detail               |
| POST   | /api/posts                             | Logged-in | Create a post                    |
| DELETE | /api/posts/:id                         | Logged-in | Delete own post                  |
| POST   | /api/posts/:id/like                     | Logged-in | Toggle like/unlike                |
| POST   | /api/posts/:id/comments                 | Logged-in | Add a comment                     |
| DELETE | /api/posts/:id/comments/:commentId       | Logged-in | Delete own comment                |

## Next Steps for Submission
1. Push this project to GitHub in a repo named `CodeAlpha_SocialMedia`.
2. Record a short video demo and post it on LinkedIn, tagging @CodeAlpha, with the GitHub link.
3. Submit via the CodeAlpha submission form.
