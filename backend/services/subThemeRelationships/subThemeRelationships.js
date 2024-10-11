const {hasAccess} = require("../../helpers/hasAccess");
const {GDBHasSubThemePropertyModel} = require("../../models/hasSubThemeProperty");
const resource = 'SubThemeRelationship'

const fetchSubThemeRelationshipInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetch${resource}s`))
      return await fetchHasSubThemeProperties(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

async function fetchHasSubThemeProperties(req, res) {

  let objects
  objects = await GDBHasSubThemePropertyModel.find({}, {populates: ['hasParentTheme', 'hasChildTheme']});

  const interfaces = {}
  objects.map(object => interfaces[object._uri] = `${object.hasParentTheme.name || object.hasParentTheme._uri} -> ${object.hasChildTheme.name || object.hasChildTheme._uri}`)
  return res.status(200).json({success: true, interfaces});
}

module.exports = {fetchSubThemeRelationshipInterfacesHandler}

