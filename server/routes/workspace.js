const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  createWorkspace,
  createCompany,
  createDept,
  getWorkspaceStructure,
  getWorkspacePrivateKey,
  joinWorkspace,
  updateWorkspace,
} = require('../controllers/workspaceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getWorkspaces);
router.get('/:workspaceId/private-key', getWorkspacePrivateKey);
router.post('/', createWorkspace);
router.patch('/:workspaceId', updateWorkspace);
router.post('/:workspaceId/join', joinWorkspace);
router.post('/company', createCompany);
router.post('/dept', createDept);
router.get('/:workspaceId/structure', getWorkspaceStructure);

module.exports = router;
