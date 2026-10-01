"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT verification failed. Error:', err.message);
                console.error('Used Secret:', process.env.JWT_SECRET ? 'Present' : 'Missing');
                console.error('Received Token:', token);
                return res.status(403).json({ message: 'Token is not valid' });
            }
            req.user = user;
            next();
        });
    }
    else {
        return res.status(401).json({ message: 'You are not authenticated' });
    }
};
exports.verifyToken = verifyToken;
const verifyRole = (roles) => {
    return (req, res, next) => {
        (0, exports.verifyToken)(req, res, () => {
            if (req.user && roles.includes(req.user.role)) {
                next();
            }
            else {
                res.status(403).json({ message: 'You are not authorized for this action' });
            }
        });
    };
};
exports.verifyRole = verifyRole;
