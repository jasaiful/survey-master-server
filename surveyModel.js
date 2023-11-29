const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    options: [{
        optionText: {
            type: String,
            required: true
        },
        votes: {
            type: Number,
            default: 0
        }
    }],
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    totalVoted: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Survey', surveySchema);