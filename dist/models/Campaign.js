"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const RewardSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    estimated_delivery: { type: String, default: '' },
    items: [{ type: String }],
    claimed_count: { type: Number, default: 0 },
    max_slots: { type: Number }
});
const StretchGoalSchema = new mongoose_1.Schema({
    amount: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    is_unlocked: { type: Boolean, default: false }
});
const CampaignUpdateSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    author_name: { type: String, required: true }
});
const CommentReplySchema = new mongoose_1.Schema({
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    user_photo: { type: String, default: '' },
    user_role: { type: String, default: 'Supporter' },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const CommentSchema = new mongoose_1.Schema({
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    user_photo: { type: String, default: '' },
    user_role: { type: String, default: 'Supporter' },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now },
    replies: [CommentReplySchema]
});
const CampaignSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    story: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    funding_goal: {
        type: Number,
        required: true,
    },
    minimum_contribution: {
        type: Number,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    reward_info: {
        type: String,
        required: true,
    },
    image_url: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    creator_name: {
        type: String,
        required: true,
    },
    creator_email: {
        type: String,
        required: true,
    },
    amount_raised: {
        type: Number,
        default: 0,
    },
    funding_type: {
        type: String,
        enum: ['flexible', 'fixed'],
        default: 'flexible',
    },
    rewards: [RewardSchema],
    stretch_goals: [StretchGoalSchema],
    updates: [CampaignUpdateSchema],
    comments: [CommentSchema]
}, { timestamps: true });
exports.default = mongoose_1.default.model('Campaign', CampaignSchema);
