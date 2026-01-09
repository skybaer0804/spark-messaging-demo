const Workspace = require('../models/Workspace');
const Company = require('../models/Company');
const Dept = require('../models/Dept');
const User = require('../models/User');
const crypto = require('crypto');
const { encrypt, decrypt } = require('../utils/encryption');

// 워크스페이스 목록 조회
exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ isArchived: false }).sort({ name: 1 });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspaces', error: error.message });
  }
};

// 워크스페이스 비밀키 조회 (소유자 전용)
exports.getWorkspacePrivateKey = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const privateKey = decrypt(workspace.projectPrivateKey);
    res.json({ privateKey });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch private key', error: error.message });
  }
};

// 워크스페이스 생성
exports.createWorkspace = async (req, res) => {
  try {
    const { name, initials, color, projectUrl, allowPublicJoin } = req.body;
    const ownerId = req.user?.id;

    const projectPublicKey = `pk_${crypto.randomBytes(16).toString('hex')}`;
    const projectPrivateKeyRaw = `sk_${crypto.randomBytes(32).toString('hex')}`;

    // Private Key 암호화 후 저장
    const projectPrivateKey = encrypt(projectPrivateKeyRaw);

    const newWorkspace = new Workspace({
      name,
      initials: initials || name.substring(0, 1).toUpperCase(),
      color: color || '#4f46e5',
      projectPublicKey,
      projectPrivateKey,
      projectUrl,
      ownerId,
      allowPublicJoin: allowPublicJoin || false,
    });

    await newWorkspace.save();

    // 생성자의 workspaces 배열에 추가
    if (ownerId) {
      await User.findByIdAndUpdate(ownerId, {
        $addToSet: { workspaces: newWorkspace._id },
      });
    }

    const responseData = newWorkspace.toObject();
    delete responseData.projectPrivateKey;

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
};

// 워크스페이스 참여
exports.joinWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // 누구나 참여 가능하거나, 초대받은 경우(초대 로직은 아직 없음) 참여 허용
    if (!workspace.allowPublicJoin) {
      return res.status(403).json({ message: 'This workspace is private and requires an invitation' });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { workspaces: workspace._id },
    });

    res.json({ message: 'Successfully joined the workspace', workspaceId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join workspace', error: error.message });
  }
};

// 워크스페이스 정보 수정
exports.updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, initials, color, allowPublicJoin } = req.body;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // 소유자 확인
    if (workspace.ownerId && workspace.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this workspace' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (initials) updateData.initials = initials;
    if (color) updateData.color = color;
    if (allowPublicJoin !== undefined) updateData.allowPublicJoin = allowPublicJoin;

    const updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { $set: updateData }, { new: true });

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update workspace', error: error.message });
  }
};

// 회사 생성
exports.createCompany = async (req, res) => {
  try {
    const { name, workspaceId } = req.body;
    const newCompany = new Company({ name, workspaceId });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create company', error: error.message });
  }
};

// 부서 생성
exports.createDept = async (req, res) => {
  try {
    const { name, companyId, workspaceId, parentId } = req.body;
    const newDept = new Dept({ name, companyId, workspaceId, parentId });
    await newDept.save();
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create department', error: error.message });
  }
};

// 특정 워크스페이스의 조직도(Company > Dept) 조회
exports.getWorkspaceStructure = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const companies = await Company.find({ workspaceId }).lean();
    const depts = await Dept.find({ workspaceId }).lean();

    const structure = companies.map((company) => ({
      ...company,
      departments: depts.filter((d) => d.companyId.toString() === company._id.toString()),
    }));

    res.json(structure);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspace structure', error: error.message });
  }
};
