const express = require('express');
const {fetchThemesHandler, fetchThemeInterfacesHandler} = require("../services/theme/themes");



const router = express.Router();

router.get('/', fetchThemesHandler);
router.get('/interface', fetchThemeInterfacesHandler)



module.exports = router;