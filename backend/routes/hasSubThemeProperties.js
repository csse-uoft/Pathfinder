const express = require("express");
const {fetchSubThemeRelationshipInterfacesHandler} = require("../services/subThemeRelationships/subThemeRelationships");


const router = express.Router();

router.get('/interface', fetchSubThemeRelationshipInterfacesHandler);




module.exports = router;