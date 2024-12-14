const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {fileUploadingMultiOrganization} = require("./fileUploadingMultiOrganization");
const {fileUploading} = require("./fileUploading");
const {fileUploadingMultiSubArray} = require("./fileUploadingMultiSubArray");
const {fileUploadingDirectly} = require("./fileUploadingDirectly");

const fileUploadingHandler = async (req, res, next) => {
  try {
    let {mode} = req.body;
    switch (mode) {
      case 'Single Organization':
        mode = 'fileUploading'
        break
      case 'Multiple Organizations':
        mode = 'fileUploadingMultiOrganization'
        break
      case 'Directly Upload':
        mode = 'directlyUpload'
        break
    }
    if (await hasAccess(req, mode)) {

      switch (mode) {
        case 'fileUploading':
          await Transaction.beginTransaction();
          return await fileUploading(req, res, next);

        case 'fileUploadingMultiOrganization':
          await Transaction.beginTransaction();
          return await fileUploadingMultiSubArray(req, res, next)

        case 'directlyUpload':
          return await fileUploadingDirectly(req, res, next)
      }


    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      await Transaction.rollback();
    next(e);
  }
};


module.exports = {fileUploadingHandler}