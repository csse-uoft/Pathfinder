
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBCodeModel} = require("../../models/code");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");

const resource = 'Code'

const fetchCodes = async (req, res) => {
  const codes = await GDBCodeModel.find({}, {populates: ['iso72Value']});
  return res.status(200).json({success: true, codes});
};

const fetchCodesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetch${resource}s`))
      return await fetchCodes(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchCodesInterface = async (req, res) => {
  const codes = await GDBCodeModel.find({});
  const codesInterfaces = {}
  codes.map(code => codesInterfaces[code._uri] = code.name)

  return res.status(200).json({success: true, codesInterfaces});
};

const fetchCodesInterfaceHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetch${resource}s`))
      return await fetchDataTypeInterfaces(resource, req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {
  fetchCodesHandler, fetchCodesInterfaceHandler
}