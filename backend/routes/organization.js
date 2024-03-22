const express = require('express');
const {
  fetchOrganizationHandler, createOrganizationHandler,
  updateOrganizationHandler, deleteOrganizationHandler
} = require("../services/organizations/organization");

const router = express.Router({mergeParams: true});

router.post('/', createOrganizationHandler)
router.get('/:uri', fetchOrganizationHandler)
router.put('/:uri', updateOrganizationHandler)
router.delete('/:uri', deleteOrganizationHandler)

module.exports = router;