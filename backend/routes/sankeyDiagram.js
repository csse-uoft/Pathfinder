const express = require('express');
const {sankeyDiagramHandler} = require("../services/sankeyDiagram/sankeyDiagram");




const router = express.Router();

router.post('/', sankeyDiagramHandler);



module.exports = router;