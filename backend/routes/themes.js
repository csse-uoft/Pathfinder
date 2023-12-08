const express = require('express');
const {fetchThemesHandler, fetchThemeInterfacesHandler} = require("../services/theme/themes");



const router = express.Router();

router.get('/interface', fetchThemeInterfacesHandler)
router.get('/', fetchThemesHandler);



module.exports = router;