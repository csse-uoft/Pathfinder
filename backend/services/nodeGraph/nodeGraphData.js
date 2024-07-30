const {hasAccess} = require("../../helpers/hasAccess");

const fetchNodeGraphData = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetchNodeGraph`))
      return await fetchOrganizations(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

module.exports = {}