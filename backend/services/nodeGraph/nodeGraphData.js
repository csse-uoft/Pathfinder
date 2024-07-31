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
  const {organizaions} = req.body();
  const nodes = {}
  const edges = {}




  const query = `${SPARQL.getSPARQLPrefixes()} 
  select * where {
      ?subject ?p ?object .
      FILTER(?p IN (cids:hasIndicator, cids:hasOutcome))
    FILTER(?subject IN (${organizaions.map(organization => `<${organization}>`).join()}))
  }`;


  await GraphDB.sendSelectQuery(query, false, ({subject, p, object}) => {
    if (!nodes[subject.id]) {
      nodes[subject.id] = {data: {id: subject.id}}
    }
    if (!nodes[object.id]) {
      nodes[object.id] = {data: {id: object.id}}
    }
    edges[p.id] = {data: {id: p.id, source: subject.id, target: object.id}}
  });

  res.status(200).json({success: true, data: [nodes, edges]})



}

module.exports = {fetchNodeGraphDataHandler}