const express = require("express");
const {fetchThemeNetworksHandler} = require("../services/themeNetwork/themeNetworks");

const router = express.Router();

// router.get('/interface', fetchThemeNetworkInterfacesHandler)
router.get('/', fetchThemeNetworksHandler);




module.exports = router;