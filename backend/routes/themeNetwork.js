const express = require("express");
const {createThemeNetworkHandler, fetchThemeNetworkHandler, updateThemeNetworkHandler} = require("../services/themeNetwork/themeNetwork");



const router = express.Router();

router.post('/', createThemeNetworkHandler);
router.get('/:uri', fetchThemeNetworkHandler);
router.put('/:uri', updateThemeNetworkHandler)




module.exports = router;