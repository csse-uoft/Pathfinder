const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {configLevel} = require("../../config");
const {themeNetworkBuilder} = require("./themeNetworkBuilder");
const {GDBThemeSubThemeNetworkModel} = require("../../models/ThemeSubThemeNetwork");
const {indicatorBuilder} = require("../indicators/indicatorBuilder");

const resource = 'ThemeNetwork';
const createThemeNetworkHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'create' + resource)) {
      const {form} = req.body;
      await Transaction.beginTransaction();
      if (await themeNetworkBuilder('interface', null, null, null, {}, {}, form, configLevel)) {
        await Transaction.commit();
        return res.status(200).json({success: true});
      }
    }
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    await Transaction.rollback();
    next(e);
  }
};

const fetchThemeNetworkHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource))
      return await fetchThemeNetwork(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateThemeNetworkHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'update' + resource))
      return await updateThemeNetwork(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateThemeNetwork = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await themeNetworkBuilder('interface', null, null, null, {}, {}, form, configLevel)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }


};

const fetchThemeNetwork = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    return res.status(400).json({success: false, message: 'Uri is needed'});
  const themeNetwork = await GDBThemeSubThemeNetworkModel.findOne({_uri: uri});
  if (!themeNetwork)
    return res.status(400).json({success: false, message: 'No such ' + resource});
  return res.status(200).json({success: true, themeNetwork});
};

module.exports = {createThemeNetworkHandler, fetchThemeNetworkHandler, updateThemeNetworkHandler};