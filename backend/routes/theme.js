const express = require('express');
const {fetchThemeHandler, updateThemeHandler, createThemeHandler, deleteThemeHandler} = require("../services/theme/theme");

const router = express.Router({mergeParams: true});

router.post('/', createThemeHandler)
router.get('/:uri', fetchThemeHandler)
router.put('/:uri', updateThemeHandler)
router.delete('/:uri', deleteThemeHandler)

module.exports = router;