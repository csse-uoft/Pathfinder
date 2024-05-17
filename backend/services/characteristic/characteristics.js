
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");

const resource = 'Characteristic'


const fetchCharacteristics = async (req, res) => {
  const characteristics = await GDBCharacteristicModel.find({});
  return res.status(200).json({success: true, characteristics});
};

const fetchCharacteristicsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetch${resource}s`))
      return await fetchCharacteristics(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchCharacteristicInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetch${resource}s`))
      return await fetchDataTypeInterfaces(resource, req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {
  fetchCharacteristicsHandler, fetchCharacteristicInterfacesHandler
}