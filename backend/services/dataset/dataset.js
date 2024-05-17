const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {datasetBuilder} = require("./datasetBuilder");
const {Server400Error} = require("../../utils");
const {GDBDataSetModel} = require("../../models/dataset");
const {configLevel} = require('../../config');
const {deleteDataAndAllReferees, checkAllReferees} = require("../helpers");


const RESOURCE = 'Dataset';



const fetchDatasetHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE))
      return await fetchDataset(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchDataset = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw Server400Error('A dataset is needed');
  const dataset = await GDBDataSetModel.findOne({_uri: uri});
  if (!dataset)
    throw Server400Error('No such dataset');
  return res.status(200).json({success: true, dataset});
}

const createDatasetHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'create' + RESOURCE)) {
      const {form} = req.body;
      await Transaction.beginTransaction();
      if ( await datasetBuilder('interface', null, null, null, {}, {}, form, configLevel)) {
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

const updateDatasetHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'update' + RESOURCE))
      return await updateDataset(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const updateDataset = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await datasetBuilder('interface', null, null,null, {}, {}, form, configLevel)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }
}

const deleteDatasetHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'delete' + RESOURCE))
      return await deleteDataset(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const deleteDataset = async (req, res) => {
  const {uri} = req.params;
  const {checked} = req.body;
  if (!uri)
    throw new Server400Error('uri is required');

  if (checked) {
    await deleteDataAndAllReferees(uri, 'dcat:dataset');
    return res.status(200).json({message: 'Successfully deleted the object and all reference', success: true});
  } else {
    const {mandatoryReferee, regularReferee} = await checkAllReferees(uri, {
      'cids:Indicator': 'dcat:dataset',
      'cids:IndicatorReport': 'dcat:dataset',
    }, configLevel)
    return res.status(200).json({mandatoryReferee, regularReferee, success: true});
  }
}

module.exports = {createDatasetHandler, fetchDatasetHandler, updateDatasetHandler, deleteDatasetHandler};