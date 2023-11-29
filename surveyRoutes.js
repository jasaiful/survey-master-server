const express = require('express');
const router = express.Router();
const Survey = require('./surveyModel'); // Import your Survey model here

// GET all surveys
router.get('/', async (req, res) => {
    try {
        const surveys = await Survey.find();
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create a new survey
router.post('/', async (req, res) => {
    try {
        const newSurvey = req.body; // Assuming the request body contains survey details
        const result = await Survey.create(newSurvey);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Other CRUD operations like update, delete, or fetching a specific survey by ID...
// ...

module.exports = router;