const express = require('express');
const {fetchGroupsHandler, fetchGroupInterfacesHandler} = require("../services/groups/groups");


const router = express.Router({mergeParams: true});

router.get('/', fetchGroupsHandler);
router.get('/interface', fetchGroupInterfacesHandler)

module.exports = router;