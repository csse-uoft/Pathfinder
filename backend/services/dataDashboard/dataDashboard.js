const {hasAccess} = require("../../helpers/hasAccess");
const {SPARQL, GraphDB} = require("graphdb-utils");

const dataDashBoardHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'dataDashboard'))
      return await dataDashboard(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const dataDashboard = async (req, res, next) => {
  const {organizations} = req.body;
  const organizationsData = {}
  let query
  for (let organizationUri of organizations) {
    const organizationData = {}
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  <${organizationUri}> (cids:hasIndicator | cids:hasOutcome | cids:hasIndicatorReport | cids:forIndicator | cids:hasImpactModel | cids:forOutcome | cids:hasCode | cids:forTheme | dcat:dataset | cids:hasImpactReport | cids:hasStakeholderOutcome | cids:hasCharacteristic |
cids:hasAccess)+ ?node .
    ?node rdf:type ?type
  FILTER (?type IN (cids:Organization, cids:Indicator, cids:Outcome, cids:Code, cids:StakeholderOutcome, cids:IndicatorReport, cids:HowMuchImpact, cids:ImpactRisk, cids:Characteristic, cids:Theme, cids:ImpactReport, cids:Counterfactual, cids:ImpactNorms)). 
}`;
    await GraphDB.sendSelectQuery(query, false, ({node, type}) => {
      if (!organizationData[node.id]) {
        organizationData[node.id] = {}
      }
      organizationData[node.id].type = type.id
    })
    organizationsData[organizationUri] = organizationData
  };

  const objectsCount = []
  for (let organizationUri in organizationsData) {
    objectsCount.push({organization: organizationUri, objectsCount: Object.keys(organizationsData[organizationUri]).length})
  }

  const theme2Outcomes = {}
  query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  ?organization cids:hasOutcome ?outcome .
    ?outcome cids:forTheme ?theme .
    ?organization rdf:type cids:Organization .
    FILTER (?organization IN (${organizations.map(organization => `<${organization}>`).join(',')}))
}`

  await GraphDB.sendSelectQuery(query, false, ({organization, outcome, theme}) => {
    if (!theme2Outcomes[theme.id]) {
      theme2Outcomes[theme.id] = new Set()
    }
    theme2Outcomes[theme.id].add(outcome.id)
  })

  const theme2OutcomesCount = []
  for (let themeUri in theme2Outcomes){
    theme2OutcomesCount.push({theme: themeUri, Outcomes: theme2Outcomes[themeUri].size})
  }

  const organizations2Indicators = {}
  query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  ?organization cids:hasIndicator ?indicator .
    ?organization rdf:type cids:Organization .
    FILTER (?organization IN (${organizations.map(organization => `<${organization}>`).join(',')}))
}`

  await GraphDB.sendSelectQuery(query, false, ({organization, indicator}) => {
    if (!organizations2Indicators[organization.id]) {
      organizations2Indicators[organization.id] = new Set()
    }
    organizations2Indicators[organization.id].add(indicator.id)
  })


  const organization2IndicatorCount = []
  Object.keys(organizations2Indicators).map(organization => {
    return organization2IndicatorCount.push({organization, Indicators: organizations2Indicators[organization].size})
  })

  return res.status(200).json({objectsCount, theme2OutcomesCount, organization2IndicatorCount})


}

module.exports = {dataDashBoardHandler}