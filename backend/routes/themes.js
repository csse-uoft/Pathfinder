const express = require('express');
const {fetchThemesHandler, fetchThemeInterfacesHandler} = require("../services/theme/themes");



const router = express.Router();

// router.get('/interface', fetchThemeInterfacesHandler)
router.get('/:mode/:singleThemeUri', fetchThemesHandler);
router.get('/:mode/', fetchThemesHandler);


module.exports = router;