const {hasAccess} = require("../../helpers/hasAccess");
const {GDBThemeSubThemeNetworkModel} = require("../../models/ThemeSubThemeNetwork");
const resource = 'ThemeNetwork'


const fetchThemeNetworksHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetch${resource}s`))
      return await fetchThemeNetworks(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchThemeNetworks = async (req, res) => {
  const themeNetworks = await GDBThemeSubThemeNetworkModel.find({});
  return res.status(200).json({success: true, themeNetworks});
}



module.exports = {fetchThemeNetworksHandler}