const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  inviteMembers,
  removeMember,
} = require('../controllers/teamController');
const auth = require('../middleware/auth');
const workspaceAuth = require('../middleware/workspaceAuth');

router.use(auth); // 모든 팀 라우트는 인증 필요

router.post('/', workspaceAuth, createTeam);
router.get('/', getTeams);
router.get('/:teamId', getTeam);
router.patch('/:teamId', updateTeam);
router.delete('/:teamId', deleteTeam);
router.post('/:teamId/invite', inviteMembers);
router.delete('/:teamId/member/:userId', removeMember);

module.exports = router;
