// Load environment variables
require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000; // Use PORT from .env or default to 3000

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,  // Allow only frontend domain to make requests
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type'
}));
app.use(bodyParser.json());

// Serve static files (Frontend build)
app.use(express.static(path.join(__dirname, 'public')));

// Create or open the database
const db = new sqlite3.Database(process.env.DB_PATH);

// Initialize the database with the necessary tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        profile_img TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        content TEXT,
        likes INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        comment TEXT,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// Sign Up Endpoint
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    const profile_img = req.body.profile_img || 'https://via.placeholder.com/80'; // Default profile image

    const stmt = db.prepare('INSERT INTO users (name, email, password, profile_img) VALUES (?, ?, ?, ?)');
    stmt.run(name, email, password, profile_img, function(err) {
        if (err) {
            res.status(500).send('Error in user signup');
            return;
        }
        res.status(200).json({ message: 'Account created successfully!', userId: this.lastID });
    });
});

// Login Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
        if (err || !user) {
            res.status(400).send('Invalid credentials');
            return;
        }
        res.status(200).json({ message: 'Login successful', user });
    });
});

// Create Post Endpoint
app.post('/create-post', (req, res) => {
    const { userId, title, content } = req.body;
    
    const stmt = db.prepare('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)');
    stmt.run(userId, title, content, function(err) {
        if (err) {
            res.status(500).send('Error in creating post');
            return;
        }
        res.status(200).json({ message: 'Post created successfully!', postId: this.lastID });
    });
});

// Get Posts Endpoint
app.get('/posts', (req, res) => {
    db.all('SELECT * FROM posts', (err, posts) => {
        if (err) {
            res.status(500).send('Error fetching posts');
            return;
        }
        res.status(200).json(posts);
    });
});

// Add Comment Endpoint
app.post('/add-comment', (req, res) => {
    const { postId, userId, comment } = req.body;

    const stmt = db.prepare('INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)');
    stmt.run(postId, userId, comment, function(err) {
        if (err) {
            res.status(500).send('Error adding comment');
            return;
        }
        res.status(200).json({ message: 'Comment added successfully!', commentId: this.lastID });
    });
});

// Update Profile Endpoint
app.post('/update-profile', (req, res) => {
    const { userId, name, profile_img } = req.body;

    const stmt = db.prepare('UPDATE users SET name = ?, profile_img = ? WHERE id = ?');
    stmt.run(name, profile_img, userId, function(err) {
        if (err) {
            res.status(500).send('Error updating profile');
            return;
        }
        res.status(200).json({ message: 'Profile updated successfully' });
    });
});

// Like Post Endpoint
app.post('/like-post', (req, res) => {
    const { postId, userId } = req.body;

    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err || !post) {
            res.status(400).send('Post not found');
            return;
        }

        const newLikes = post.likes + 1; // Increase like count for simplicity, can implement like/unlike logic
        db.run('UPDATE posts SET likes = ? WHERE id = ?', [newLikes, postId], (err) => {
            if (err) {
                res.status(500).send('Error liking post');
                return;
            }
            res.status(200).json({ message: 'Post liked successfully', likes: newLikes });
        });
    });
});

// Follow User (Basic Implementation)
app.post('/follow', (req, res) => {
    const { followerId, followingId } = req.body;

    db.run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId], function(err) {
        if (err) {
            res.status(500).send('Error following user');
            return;
        }
        res.status(200).json({ message: 'User followed successfully' });
    });
});

// Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
