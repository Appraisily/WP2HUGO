const express = require('express');
const router = express.Router();
const dataService = require('../services/art-appraiser/data.service');
const storageService = require('../services/art-appraiser/storage.service');

// Get data for a specific city
router.get('/:state/:city', async (req, res) => {
  try {
    const { city, state } = req.params;
    const data = await dataService.getCityData(city, state);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[ART-APPRAISER] Error getting city data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all cities in a state
router.get('/state/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const cities = await storageService.listCities(state);
    res.json({ success: true, cities });
  } catch (error) {
    console.error('[ART-APPRAISER] Error listing cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search cities by criteria
router.get('/search', async (req, res) => {
  try {
    const { state, region, population, specialty } = req.query;
    const results = await storageService.searchCities({
      state,
      region,
      population: population ? parseInt(population) : undefined,
      specialty
    });
    res.json({ success: true, results });
  } catch (error) {
    console.error('[ART-APPRAISER] Error searching cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;