"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, photo_url, role } = req.body;
        // Email format validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        // Password strength validation: Min 8 characters, at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers' });
        }
        // Check if user exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        // Hash password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Initial credits based on role
        let credits = 0;
        if (role === 'Supporter')
            credits = 50;
        if (role === 'Creator')
            credits = 20;
        const newUser = new User_1.default({
            name,
            email,
            password: hashedPassword,
            photo_url,
            role,
            credits
        });
        await newUser.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: newUser._id, role: newUser.role, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                credits: newUser.credits,
                photo_url: newUser.photo_url
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Email format validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        // Password strength validation: Min 8 characters, at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers' });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                credits: user.credits,
                photo_url: user.photo_url
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Google Login
router.post('/google', async (req, res) => {
    try {
        const { token, role } = req.body; // token is now an access_token
        // Fetch user profile from Google using the access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user profile from Google');
        }
        const payload = await response.json();
        const { email, name, picture } = payload;
        // Check if user already exists
        let user = await User_1.default.findOne({ email });
        if (!user) {
            // Create new user if they don't exist
            let initialCredits = 0;
            const userRole = role || 'Supporter';
            if (userRole === 'Supporter')
                initialCredits = 50;
            if (userRole === 'Creator')
                initialCredits = 20;
            // Create a random password since they use Google
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            const salt = await bcrypt_1.default.genSalt(10);
            const hashedPassword = await bcrypt_1.default.hash(randomPassword, salt);
            user = new User_1.default({
                name,
                email,
                password: hashedPassword,
                photo_url: picture,
                role: userRole,
                credits: initialCredits
            });
            await user.save();
        }
        // Generate JWT token
        const jwtToken = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                credits: user.credits,
                photo_url: user.photo_url
            }
        });
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: 'Server error during Google authentication', error: error.message });
    }
});
exports.default = router;
