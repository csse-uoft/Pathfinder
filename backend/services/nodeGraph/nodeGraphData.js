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
  let {organizations} = req.body;

  const nodes = {}
  const edges = []
  let query;
  if (!organizations) {
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
    await GraphDB.sendSelectQuery(query, false, ({subject, p, object, objectName, subjectName, objectType, subjectType}) => {
      if (!nodes[subject.id]) {
        nodes[subject.id] = {data: {id: subject.id, label:subjectName?.id || subject.id,type: SPARQL.getPrefixedURI(subjectType.id)}}
      }
      if (!nodes[object.id]) {
        nodes[object.id] = {data: {id: object.id, label: objectName?.id || object.id, type: SPARQL.getPrefixedURI(objectType.id)}}
      }
      edges.push({data: {id: `${subject.id} ${object.id} ${p.id}`, source: subject.id, target: object.id, label: SPARQL.getPrefixedURI(p.id)}})
    });
  } else {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  ?organization (cids:hasIndicator | cids:hasOutcome | cids:hasIndicatorReport | cids:forOrganization | cids:forIndicator | cids:hasImpactModel | cids:forOutcome | cids:hasCode | cids:forTheme | iso21972:value | dcat:dataset | cids:hasImpactReport | cids:hasStakeholderOutcome | cids:hasCharacteristic |
cids:hasAccess | cids:hasThreshold | cids:hasBaseline | cids:forOutcome | cids:canProduce | oep:partOf | cids:hasIndicator)+ ?node .
    OPTIONAL { ?node cids:hasName ?nodeName } .
     OPTIONAL { ?organization tove_org:hasLegalName ?organizationLegalName } .
    ?node rdf:type ?type
  FILTER (?organization IN (${organizations.map(organization => `<${organization}>`).join(',')}) && 
        ?type IN (cids:Organization, cids:Indicator, cids:Outcome, time:DateTimeInterval, iso21972:Measure, cids:Code, cids:StakeholderOutcome, cids:IndicatorReport, cids:HowMuchImpact, dcat:Dataset, cids:ImpactRisk, cids:Characteristic, cids:Theme, cids:ImpactReport, cids:Counterfactual, cids:ImpactNorms)). 
}`;

    // organizations.map(organization => nodes[organization] = {data: {id: organization, label: organization, type: SPARQL.getPrefixedURI('cids:Organization')}})
    await GraphDB.sendSelectQuery(query, false, ({organization, node, nodeName, organizationLegalName, type}) => {
      if (!nodes[node.id]) {
        nodes[node.id] = {data: {id: node.id, label:nodeName?.id || node.id, type: SPARQL.getPrefixedURI(type.id), organizations: [organizationLegalName?.id || organization.id]}}
      } else if (!nodes[node.id].data.organizations.includes(organization.id)){
        nodes[node.id].data.organizations.push(organization.id)
      }
      if (!nodes[organization.id]) {
        nodes[organization.id] = {data: {id: organization.id, label: organizationLegalName?.id || organization.id, type: 'cids:Organization', organizations: [organization.id]}}
      }
    });

    // then do subject

    query = `${SPARQL.getSPARQLPrefixes()} 
   SELECT * WHERE {
  ?subject ?p ?object .
  FILTER(?subject IN (${Object.keys(nodes).map(node => `<${node}>`).join(',')}) && 
    ?object IN (${Object.keys(nodes).map(node => `<${node}>`).join(',')}) &&
        ?p IN (cids:hasIndicator, cids:hasOutcome, cids:hasIndicatorReport, cids:definedBy, cids:forOrganization, cids:forIndicator, cids:hasImpactModel, cids:forOutcome, cids:hasCode, cids:forTheme, iso21972:value, dcat:dataset, cids:hasImpactReport, cids:hasStakeholderOutcome, cids:hasThreshold, cids:hasBaseline)) .
}
  `;

    await GraphDB.sendSelectQuery(query, false, ({subject, object, p}) => {
      edges.push({data: {id: `${subject.id} ${object.id} ${p.id}`, source: subject.id, target: object.id, label: SPARQL.getPrefixedURI(p.id)}})
    });


  }


  const elements = {nodes: [], edges}
  Object.keys(nodes).map(nodeUri => {
      elements.nodes.push(nodes[nodeUri])
    }
  )

  res.status(200).json({success: true, elements})


}

module.exports = {fetchNodeGraphDataHandler}