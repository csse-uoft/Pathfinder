const {hasAccess} = require("../../helpers/hasAccess");
const {GDBDataSetModel} = require("../../models/dataset");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");

const RESOURCE = 'Dataset'

const fetchDatasetInterfaces = async (req, res) => {
  const datasetInterfaces = {};
  const datasets = await GDBDataSetModel.find({});
  datasets.map(dataset => {
    datasetInterfaces[dataset._uri] = dataset.name || dataset._uri;
  })
  return res.status(200).json({success: true, datasetInterfaces});
};

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

const fetchDatasetInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchDataTypeInterfaces(RESOURCE, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchDatasetsHandler, fetchDatasetInterfacesHandler}