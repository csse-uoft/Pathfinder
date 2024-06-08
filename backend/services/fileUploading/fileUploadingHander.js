const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {fileUploadingMultiOrganization} = require("./fileUploadingMultiOrganization");
const {fileUploading} = require("./fileUploading");

const fileUploadingHandler = async (req, res, next) => {
  try {
    const {multipleOrganizations} = req.body;
    if (await hasAccess(req, multipleOrganizations ? 'fileUploadingMultiOrganization' : 'fileUploading')) {
      await Transaction.beginTransaction();
      return await multipleOrganizations? fileUploadingMultiOrganization(req, res, next) : fileUploading(req, res, next);
    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      await Transaction.rollback();
    next(e);
  }
};


module.exports = {fileUploadingHandler}