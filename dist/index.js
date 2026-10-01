"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const contributions_1 = __importDefault(require("./routes/contributions"));
const withdrawals_1 = __importDefault(require("./routes/withdrawals"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const payments_1 = __importDefault(require("./routes/payments"));
const reports_1 = __importDefault(require("./routes/reports"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://crowdfund-client-xi.vercel.app'
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin)
            return callback(null, true);
        // Check if origin is whitelisted or is a vercel.app subdomain
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app');
        if (!isAllowed) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/campaigns', campaigns_1.default);
app.use('/api/contributions', contributions_1.default);
app.use('/api/withdrawals', withdrawals_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/reports', reports_1.default);
app.get('/', (req, res) => {
    res.send('Crowdfunding Platform API is running');
});
// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdfund';
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});
exports.default = app;
// Exporting CommonJS module for Vercel runtime compatibility
module.exports = app;
