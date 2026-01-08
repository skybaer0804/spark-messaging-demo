const Organization = require('../models/Organization');

exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ name: 1, dept1: 1, dept2: 1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch organizations', error: error.message });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, dept1, dept2 } = req.body;
    const newOrg = new Organization({ name, dept1, dept2 });
    await newOrg.save();
    res.status(201).json(newOrg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create organization', error: error.message });
  }
};
