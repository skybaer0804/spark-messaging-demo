const express = require('express');
const router = express.Router();
const { getOrganizations, createOrganization } = require('../controllers/orgController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getOrganizations);
router.post('/', createOrganization);

module.exports = router;
