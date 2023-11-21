const {hasAccess} = require("../../helpers/hasAccess");
const {GDBDataSetModel} = require("../../models/dataset");

const RESOURCE = 'Dataset'

const fetchDatasets = async (req, res) => {
  const datasets = await GDBDataSetModel.find({});
  return res.status(200).json({success: true, datasets});
};

const fetchDatasetsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchDatasets(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchDatasetsHandler}