const {hasAccess} = require("../../helpers/hasAccess");
const {GraphDB, SPARQL} = require("graphdb-utils");

const fetchNodeGraphDataHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, `fetchNodeGraphData`))
      return await fetchNodeGraphData(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchNodeGraphData = async (req, res) => {
  let {organizations} = req.params;
  if (!organizations)
    organizations = []
  const nodes = {}
  const edges = []


  let query = ''
  if (organizations.length) {
    query = `${SPARQL.getSPARQLPrefixes()} 
  select * where {
      ?subject ?p ?object .
      FILTER(?p IN (cids:hasIndicator, cids:hasOutcome))
    FILTER(?subject IN (${organizations.map(organization => `<${organization}>`).join()}))
  }`;
  } else {
    query = `${SPARQL.getSPARQLPrefixes()} 
 SELECT * WHERE {
  ?subject ?p ?object .
  OPTIONAL { ?subject cids:hasName ?subjectName } .
    OPTIONAL { ?object cids:hasName ?objectName } .
    ?subject rdf:type ?subjectType .
    ?object rdf:type ?objectType .
  FILTER(?p IN (cids:hasIndicator, cids:hasOutcome, cids:hasIndicatorReport, cids:definedBy, cids:forOrganization, cids:forIndicator, cids:hasImpactModel, cids:forOutcome, cids:hasCode, cids:forTheme, iso21972:value, dcat:dataset, cids:hasImpactReport, cids:hasStakeholderOutcome)) .
    FILTER(
    ?subjectType IN (cids:Organization, cids:Indicator, cids:Outcome, time:DateTimeInterval, iso21972:Measure, cids:Code, cids:StakeholderOutcome, cids:IndicatorReport, cids:HowMuchImpact, dcat:Dataset, cids:ImpactRisk, cids:Characteristic, cids:Theme, cids:ImpactReport, cids:Counterfactual, cids:ImpactNorms)
    && ?objectType IN (cids:Organization, cids:Indicator, cids:Outcome, time:DateTimeInterval, iso21972:Measure, cids:Code, cids:StakeholderOutcome, cids:IndicatorReport, cids:HowMuchImpact, dcat:Dataset, cids:ImpactRisk, cids:Characteristic, cids:Theme, cids:ImpactReport, cids:Counterfactual, cids:ImpactNorms)
  ) .
}`;
  }


  await GraphDB.sendSelectQuery(query, false, ({subject, p, object, objectName, subjectName, objectType, subjectType}) => {
    if (!nodes[subject.id]) {
      nodes[subject.id] = {data: {id: subject.id, label:subjectName?.id || subject.id,type: SPARQL.getPrefixedURI(subjectType.id)}}
    }
    if (!nodes[object.id]) {
      nodes[object.id] = {data: {id: object.id, label: objectName?.id || object.id, type: SPARQL.getPrefixedURI(objectType.id)}}
    }
    edges.push({data: {id: `${subject.id} ${object.id} ${p.id}`, source: subject.id, target: object.id, label: SPARQL.getPrefixedURI(p.id)}})
  });

  const elements = {nodes: [], edges}
  Object.keys(nodes).map(nodeUri => {
    elements.nodes.push(nodes[nodeUri])
    }
  )
  // Object.keys(edges).map(edgeUri => {
  //     elements.edges.push(edges[edgeUri])
  //   }
  // )

  res.status(200).json({success: true, elements})



}

module.exports = {fetchNodeGraphDataHandler}