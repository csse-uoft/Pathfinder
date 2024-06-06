const express = require('express');
const {fileUploadingHandler} = require("../services/fileUploading/fileUploading");
const {fileUploadingMultiOrganizationHandler} = require("../services/fileUploading/fileUploadingMultiOrganization");



const router = express.Router({mergeParams: true});

router.post('/', fileUploadingMultiOrganizationHandler);

module.exports = router;