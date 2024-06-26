const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {counterfactualBuilder} = require("./counterfactualBuilder");
const {Server400Error} = require("../../utils");
const {GDBCounterfactualModel} = require("../../models/counterfactual");
const {configLevel} = require('../../config');
const {deleteDataAndAllReferees, checkAllReferees} = require("../helpers");


const RESOURCE = 'Counterfactual'

const fetchCounterfactualHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE))
      return await fetchCounterfactual(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateCounterfactualHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateCounterfactual'))
      return await updateCounterfactual(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const updateCounterfactual = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  form.iso72Value = form.value;
  if (await counterfactualBuilder('interface', null, null,null, {}, {}, form, configLevel)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }
}

const fetchCounterfactual = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw Server400Error('A counterfactual is needed');
  const counterfactual = await GDBCounterfactualModel.findOne({_uri: uri}, {populates: ['hasTime.hasBeginning', 'hasTime.hasEnd', 'iso72Value', 'locatedIns']});
  if (!counterfactual)
    throw Server400Error('No such code');
  counterfactual.startTime = counterfactual.hasTime?.hasBeginning.date;
  counterfactual.endTime = counterfactual.hasTime?.hasEnd.date;
  counterfactual.value = counterfactual.iso72Value?.numericalValue;
  return res.status(200).json({success: true, counterfactual});
}

const createCounterfactualHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'create' + RESOURCE)){
      const {form} = req.body;
      await Transaction.beginTransaction();
      form.iso72Value = form.value
      if(await counterfactualBuilder('interface', null,
        null, null, {}, {}, form, configLevel)) {
        await Transaction.commit();
        return res.status(200).json({success: true})
      }
    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const deleteCounterfactualHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'delete' + RESOURCE))
      return await deleteCounterfactual(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const deleteCounterfactual = async (req, res) => {
  const {uri} = req.params;
  const {checked} = req.body;
  if (!uri)
    throw new Server400Error('uri is required');

  if (checked) {
    await deleteDataAndAllReferees(uri, 'cids:hasCounterfactual');
    return res.status(200).json({message: 'Successfully deleted the object and all reference', success: true});
  } else {
    const {mandatoryReferee, regularReferee} = await checkAllReferees(uri, {
      'cids:HowMuchImpact': 'cids:hasCounterfactual',
    }, configLevel)
    return res.status(200).json({mandatoryReferee, regularReferee, success: true});
  }
}

module.exports = {createCounterfactualHandler, fetchCounterfactualHandler, updateCounterfactualHandler, deleteCounterfactualHandler}