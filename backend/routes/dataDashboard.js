const express = require('express');
const {dataDashBoardHandler} = require("../services/dataDashboard/dataDashboard");




const router = express.Router();

router.post('/', dataDashBoardHandler);



module.exports = router;