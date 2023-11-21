const {hasAccess} = require("../../helpers/hasAccess");
const {GDBCounterfactualModel} = require("../../models/counterfactual");

const RESOURCE = 'Counterfactual'

const fetchCounterfactuals = async (req, res) => {
  const counterfactuals = await GDBCounterfactualModel.find({});
  return res.status(200).json({success: true, counterfactuals});
};

const fetchCounterfactualInterfaces = async (req, res) => {
  const counterfactuals = await GDBCounterfactualModel.find({});
  const counterfactualInterfaces = {}
  counterfactuals.map(counterfactual => {
    counterfactualInterfaces[counterfactual._uri] = counterfactual.description || counterfactual._uri
  })
  return res.status(200).json({success: true, counterfactualInterfaces});
}

const fetchCounterfactualsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchCounterfactuals(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchCounterfactualInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchCounterfactualInterfaces(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchCounterfactualsHandler, fetchCounterfactualInterfacesHandler}