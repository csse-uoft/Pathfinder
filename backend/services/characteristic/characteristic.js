const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {GDBCodeModel} = require("../../models/code");
const {characteristicBuilder} = require("./characteristicBuilder");
const {Transaction} = require("graphdb-utils");
const {configLevel} = require('../../config');
const {deleteDataAndAllReferees, checkAllReferees} = require("../helpers");


const createCharacteristicHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createCharacteristic')) {
      const {form} = req.body;
      await Transaction.beginTransaction();
      if (await characteristicBuilder('interface', null, null, {}, {}, form, configLevel)){
        await Transaction.commit();
        return res.status(200).json({success: true});
      }
    } else {
      return res.status(400).json({message: 'Wrong Auth'});
    }
  } catch (e) {
    if (Transaction.isActive()){
      Transaction.rollback();
    }

    next(e);
  }
};

const deleteCharacteristicHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'deleteCharacteristic'))
      return await deleteCharacteristic(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const deleteCharacteristic = async (req, res) => {
  const {uri} = req.params;
  const {checked} = req.body;
  if (!uri)
    throw new Server400Error('uri is required');

  if (checked) {
    await deleteDataAndAllReferees(uri, 'cids:hasCharacteristic');
    return res.status(200).json({message: 'Successfully deleted the object and all reference', success: true});
  } else {
    const {mandatoryReferee, regularReferee} = await checkAllReferees(uri, {
      'cids:Organization': 'cids:hasCharacteristic',
      'cids:Stakeholder': 'cids:hasCharacteristic',
    }, configLevel)
    return res.status(200).json({mandatoryReferee, regularReferee, success: true});
  }
};


const fetchCharacteristicHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchCharacteristic'))
      return await fetchCharacteristic(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchCharacteristic= async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw Server400Error('A uri is needed');
  const characteristic = await GDBCharacteristicModel.findOne({_uri: uri}, );
  if (!characteristic)
    throw Server400Error('No such characteristic');
  return res.status(200).json({success: true, characteristic});
}

const updateCharacteristicHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateCharacteristic'))
      return await updateCharacteristic(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const updateCharacteristic = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await characteristicBuilder('interface', null, null, {}, {}, form, configLevel)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }
};


async function createCharacteristic({form, codeDict, errorProcessor, environment}) {
  if (!form || !form.value) {
    throw new Server400Error('Invalid input');
  }

  if (!form.codes)
    form.codes = []
  if (!Array.isArray(form.codes))
    throw new Server400Error('Invalid input');
  
  if (environment === 'fileUploading') {
    // through file uploading
    for (const codeUri of form.codes){
      // if the codeUri is not in the dict
      if (!codeDict[codeUri]){
        // then have to check is the uri in database
        if (!(await GDBCodeModel.findOne({_uri: codeUri}))){
          // then the code is not a valid
          errorProcessor({codeUri, form, environment});
        }
      }
    }
  }
  const characteristic = GDBCharacteristicModel({
    codes: form.codes,
    name: form.name,
    value: form.value
  })
  await characteristic.save();
  return true;
}


module.exports = {
  createCharacteristicHandler, fetchCharacteristicHandler, updateCharacteristicHandler, deleteCharacteristicHandler
}
