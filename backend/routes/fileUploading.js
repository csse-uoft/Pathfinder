const express = require('express');
const {fileUploadingHandler} = require("../services/fileUploading/fileUploadingHander");

const router = express.Router({mergeParams: true});

router.post('/', fileUploadingHandler);

module.exports = router;