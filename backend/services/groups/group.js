const {GDBGroupModel} = require("../../models/group");
const createGroup = async (req, res, next) => {
  try {
    const form = req.body;
    if (!form || !form.label)
      return res.status(400).json({success: false, message: 'Wrong information given'});
    const group = GDBGroupModel(form);
    await group.save();
    return res.status(200).json({success: true});
  } catch (e) {
    next(e);
  }
};

const groupAdminFetchGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    const sessionId = req.session._id;
    if (!id)
      return res.status(400).json({success: false, message: 'No id is given'});
    const group = await GDBGroupModel.findOne({_id: id}, {populates: ['administrator']});
    if (!group)
      return res.status(400).json({success: false, message: 'No such group'});
    if (group.administrator._id !== sessionId)
      return res.status(400).json({success: false, message: 'You are not the admin of this group'});
    return res.status(200).json({success: true, group: group});

  } catch (e) {
    next(e);
  }
};

const superuserFetchGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'No id is given'});
    const group = await GDBGroupModel.findById(id);
    if (!group)
      return res.status(400).json({success: false, message: 'No such group'});
    return res.status(200).json({success: true, group: group});
  } catch (e) {
    next(e);
  }
};
const superuserUpdateGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    const form = req.body;
    if (!id || !form)
      return res.status(400).json({success: false, message: 'Invalid information is given'});
    await GDBGroupModel.findByIdAndUpdate(id, form);
    return res.status(200).json({success: true, message: 'Successfully updated group ' + id});
  } catch (e) {
    next(e);
  }
};

const superuserDeleteGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Invalid information is given'});
    await GDBGroupModel.findByIdAndDelete(id);
    return res.status(200).json({success: true, message: 'Successfully deleted group ' + id});
  } catch (e) {
    next(e);
  }
};


const groupAdminUpdateGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    const sessionId = req.session._id;
    const {comment, organizations} = req.body;
    if (!id)
      return res.status(400).json({success: false, message: 'No id is given'});
    const group = await GDBGroupModel.findOne({_id: id}, {populates: ['administrator']});
    if (!group)
      return res.status(400).json({success: false, message: 'No such group'});
    if (group.administrator._id !== sessionId)
      return res.status(400).json({success: false, message: 'You are not the admin of this group'});
    group.comment = comment;
    group.organizations = organizations
    await group.save();
    return res.status(200).json({success: true, message: 'Successfully updated group ' + id});
  } catch (e) {
    next(e);
  }
};

module.exports = {groupAdminUpdateGroup, createGroup, superuserFetchGroup, superuserUpdateGroup, superuserDeleteGroup, groupAdminFetchGroup};