const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {datasetBuilder} = require("./datasetBuilder");


const RESOURCE = 'Dataset';

const createDatasetHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'create' + RESOURCE)) {
      const {form} = req.body;
      await Transaction.beginTransaction();
      if ( await datasetBuilder('interface', null, null, null, {}, {}, form)) {
        await Transaction.commit();
        return res.status(200).json({success: true});
      }
    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

module.exports = {createDatasetHandler};