const {GDBThemeModel} = require("../../models/theme");
const {hasAccess} = require("../../helpers/hasAccess");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");
const {SPARQL, GraphDB} = require("graphdb-utils");
const {getRidOfQuotes} = require("../helpers");

const resource = 'Theme'

const fetchThemes = async (req, res) => {
    const themes = await GDBThemeModel.find({});
    return res.status(200).json({success: true, themes});
};

const fetchThemeViewingPage = async (req, res) => {
  const {singleThemeUri} = req.params;
  const themes = {}
  const themePlaceHolder = singleThemeUri? `<${singleThemeUri}>` : '?theme'
  const query = `${SPARQL.getSPARQLPrefixes()} 
 SELECT * WHERE {
  ${themePlaceHolder} rdf:type cids:Theme .
  OPTIONAL {${themePlaceHolder} cids:hasName ?themeName .}
  OPTIONAL {${themePlaceHolder} cids:hasDescription ?description .}
  OPTIONAL {
      ?code rdf:type cids:Code .
      ${themePlaceHolder} cids:hasCode ?code .
      OPTIONAL {
     ?code cids:hasName ?codeName .
      }
  }
  OPTIONAL {
        ?outcome rdf:type cids:Outcome .
        ?outcome cids:forTheme ${themePlaceHolder} .
        OPTIONAL {
      ?outcome cids:hasName ?outcomeName .
    }
    }
}`;
  await GraphDB.sendSelectQuery(query, false, ({theme, themeName, outcome, outcomeName, description, code, codeName}) => {
    if (!themes[singleThemeUri || theme.id]) {
      themes[singleThemeUri || theme.id] = {name: getRidOfQuotes(themeName?.id) || 'NA', _uri: singleThemeUri || theme.id, outcomes: {}, description: getRidOfQuotes(description?.id) || '', codes: {}}
    }
    if (code)
      themes[singleThemeUri || theme.id].codes[code.id] = {_uri: code.id, name:getRidOfQuotes(codeName?.id) || 'NA'}
    if (outcome)
      themes[singleThemeUri || theme.id].outcomes[outcome.id] = {_uri: outcome.id, name:getRidOfQuotes(outcomeName?.id) || 'NA'}
  });
  const ret = Object.values(themes).map((theme) => {
    theme.outcomes = Object.values(theme.outcomes)
    theme.codes = Object.values(theme.codes)
    return theme
  })
  return res.status(200).json({success: true, data: ret})
}

// const fetchThemesHandler = async (req, res, next) => {
//   try {
//     if (await hasAccess(req, `fetch${resource}s`))
//       return await fetchThemes(req, res);
//     return res.status(400).json({message: 'Wrong Auth'});
//   } catch (e) {
//     next(e);
//   }
// };

const fetchThemesHandler =  async (req, res, next) => {
  try {
    const {mode} = req.params;
    if (await hasAccess(req, `fetch${resource}s`)) {
      switch (mode) {
        case 'interface':
          return await fetchDataTypeInterfaces(resource, req, res);
          break
        case 'viewingPage':
          return await fetchThemeViewingPage(req, res);
          break
        default:
          return await fetchThemes(req, res);
      }
    }

    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};


module.exports = {fetchThemesHandler,};