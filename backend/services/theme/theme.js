const {GDBThemeModel} = require("../../models/theme");
const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {themeBuilder} = require("./themeBuilder");
const {configLevel} = require('../../config');
const {Server400Error} = require("../../utils");
const {deleteDataAndAllReferees, checkAllReferees} = require("../helpers");
const {GDBHasSubThemePropertyModel} = require("../../models/hasSubThemeProperty");

const createTheme = async (req, res) => {
    const form = req.body;
    if (!form.name || !form.description)
      return res.status(400).json({success: false, message: 'Name and description are needed'});
    // if (await GDBThemeModel.findOne({hasIdentifier: form.identifier}))
    //   return res.status(400).json({success: false, message: 'Duplicated Identifier'})
  // form.hasIdentifier = form.identifier;
    const theme = GDBThemeModel({
      name: form.name,
      description: form.description,
    }, form.uri?{uri: form.uri}:null);
    await theme.save();
    return res.status(200).json({success: true, message: 'Successfully created the theme'});
};

const fetchTheme = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    return res.status(400).json({success: false, message: 'Uri is needed'});
  const theme = await GDBThemeModel.findOne({_uri: uri});
  if (!theme)
    return res.status(400).json({success: false, message: 'No such theme'});
  // theme.identifier = theme.hasIdentifier;
  theme.subThemeRelationships = await arrangeSubThemeRelationships(uri)

  return res.status(200).json({success: true, theme});
};

const arrangeSubThemeRelationships = async (parentTheme) => {
  const subThemeProperties = await GDBHasSubThemePropertyModel.find({hasParentTheme: parentTheme});
  const subThemePropertiesHashBySubTheme = {}
  subThemeProperties?.map(({hasChildTheme, forOrganization}) => {
    if (!subThemePropertiesHashBySubTheme[hasChildTheme]) {
      subThemePropertiesHashBySubTheme[hasChildTheme] = []
    }
    subThemePropertiesHashBySubTheme[hasChildTheme].push(forOrganization)
  })
  const subThemePropertiesHashByOrganizations = {}
  for (let subTheme in subThemePropertiesHashBySubTheme) {
    let organizations = subThemePropertiesHashBySubTheme[subTheme]
    organizations.sort()
    organizations = JSON.stringify(organizations)
    if (!subThemePropertiesHashByOrganizations[organizations]) {
      subThemePropertiesHashByOrganizations[organizations] = []
    }
    subThemePropertiesHashByOrganizations[organizations].push(subTheme)
  }
  const ret = []
  for (let organizations in subThemePropertiesHashByOrganizations) {
    ret.push({organizations: JSON.parse(organizations), subThemes: subThemePropertiesHashByOrganizations[organizations]})
  }
  return ret
}

const updateTheme = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await themeBuilder('interface', null,null, {}, {}, form, configLevel)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }
};

const createThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createTheme')) {
      const {form} = req.body;
      await Transaction.beginTransaction();
      if (await themeBuilder('interface', null, null, {}, {}, form, configLevel)){
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

const fetchThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchTheme'))
      return await fetchTheme(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateTheme'))
      return await updateTheme(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const deleteThemeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'deleteTheme'))
      return await deleteTheme(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const deleteTheme = async (req, res) => {
  const {uri} = req.params;
  const {checked} = req.body;
  if (!uri)
    throw new Server400Error('uri is required');

  if (checked) {
    await deleteDataAndAllReferees(uri, 'cids:forTheme');
    return res.status(200).json({message: 'Successfully deleted the object and all reference', success: true});
  } else {
    const {mandatoryReferee, regularReferee} = await checkAllReferees(uri, {
      'cids:Outcome': 'cids:forTheme',
    }, configLevel)
    return res.status(200).json({mandatoryReferee, regularReferee, success: true});
  }
}


module.exports = {createThemeHandler, fetchThemeHandler, updateThemeHandler, deleteThemeHandler};