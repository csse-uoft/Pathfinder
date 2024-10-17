const {hasAccess} = require("../../helpers/hasAccess");
const {GraphDB, SPARQL} = require("graphdb-utils");

const fetchNodeGraphDataHandler = async (req, res, next) => {
  try {
    const {organizations} = req.body;
    const {classType} = req.params;
    if (organizations && await hasAccess(req, `fetchNodeGraphData`))
      return await fetchNodeGraphData(req, res);
    if (classType === 'theme' && await hasAccess(req, `fetchThemeNodeGraph`))
      return await fetchDataTypeNodeGraphData(req, res);
    if (classType === 'indicator' && await hasAccess(req, `fetchIndicatorNodeGraph`))
      return await fetchDataTypeNodeGraphData(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchDataTypeNodeGraphData = async (req, res) => {
  const {classType} = req.params;
  const nodes = {}
  const edges = {}
  let query;
  if (classType === 'theme') {
    query = `${SPARQL.getSPARQLPrefixes()} 
 SELECT * WHERE {
  ?theme  rdf:type cids:Theme .
    ?theme cids:hasName ?name .
}`;
    await GraphDB.sendSelectQuery(query, false, ({theme, name}) => {
      if (!nodes[theme.id]) {
        nodes[theme.id] = {data: {id: theme.id, label:name?.id || theme.id}}
      }
    });

    query = `${SPARQL.getSPARQLPrefixes()} 
SELECT * WHERE {
  ?subThemeProperty rdf:type cidsrep:hasSubThemeProperty .
    ?subThemeProperty cidsrep:hasParentTheme ?parentTheme .
    ?subThemeProperty cidsrep:hasSubTheme ?subTheme .
    ?subThemeProperty cids:forOrganization ?organization .
    OPTIONAL {?organization tove_org:hasLegalName ?organizationName} .
}`;

    await GraphDB.sendSelectQuery(query, false, ({parentTheme, subTheme, organization, organizationName}) => {
      if (edges[`${parentTheme.id} ${subTheme.id}`]) {
        edges[`${parentTheme.id} ${subTheme.id}`].data.label = edges[`${parentTheme.id} ${subTheme.id}`].data.label + ' \n' + organizationName?.id || organization.id
      } else {
        edges[`${parentTheme.id} ${subTheme.id}`] = {data: {id: `${parentTheme.id} ${subTheme.id}`, source: parentTheme.id, target: subTheme.id, label: organizationName?.id || organization.id}}
      }

    });

  } else if (classType === 'indicator') {
    query = `${SPARQL.getSPARQLPrefixes()} 
 SELECT * WHERE {
  ?indicator  rdf:type cids:Indicator .
    ?indicator cids:hasName ?name .
}`;
    await GraphDB.sendSelectQuery(query, false, ({indicator, name}) => {
      if (!nodes[indicator.id]) {
        nodes[indicator.id] = {data: {id: indicator.id, label:name?.id || indicator.id}}
      }
    });

    query = `${SPARQL.getSPARQLPrefixes()} 
SELECT * WHERE {
  ?subIndicatorProperty rdf:type cidsrep:hasSubIndicatorProperty .
    ?subIndicatorProperty cidsrep:hasHeadlineIndicator ?headlineIndicator .
    ?subIndicatorProperty cidsrep:hasSubIndicator ?subIndicator .
    ?subIndicatorProperty cids:forOrganization ?organization .
    OPTIONAL {?organization tove_org:hasLegalName ?organizationName} .
}`;

    await GraphDB.sendSelectQuery(query, false, ({headlineIndicator, subIndicator, organization, organizationName}) => {
      if (edges[`${headlineIndicator.id} ${subIndicator.id}`]) {
        edges[`${headlineIndicator.id} ${subIndicator.id}`].data.label = edges[`${headlineIndicator.id} ${subIndicator.id}`].data.label + ' \n' + organizationName?.id || organization.id
      } else {
        edges[`${headlineIndicator.id} ${subIndicator.id}`] = {data: {id: `${headlineIndicator.id} ${subIndicator.id}`, source: headlineIndicator.id, target: subIndicator.id, label: organizationName?.id || organization.id}}
      }

      // edges.push({data: {id: `${headlineIndicator.id} ${subIndicator.id}`, source: headlineIndicator.id, target: subIndicator.id, label: organizationName?.id || organization.id}})
    });
  }

  const elements = {nodes: [], edges: []}
  Object.keys(nodes).map(nodeUri => {
      elements.nodes.push(nodes[nodeUri])
    }
  )
  Object.keys(edges).map(edgeUri => {
    elements.edges.push(edges[edgeUri])
  })

  res.status(200).json({success: true, elements})


}

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