const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/app/searchController');
const { optionalToken } = require('../../middlewares/authMiddleware');

// Public / optionally authenticated search endpoints
router.get('/suggestions', optionalToken, searchController.getSearchSuggestions);
router.get('/results', optionalToken, searchController.getSearchResults);
router.get('/trending', optionalToken, searchController.getTrendingSearches);

module.exports = router;
