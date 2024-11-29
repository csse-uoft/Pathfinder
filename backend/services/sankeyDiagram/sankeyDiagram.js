const {hasAccess} = require("../../helpers/hasAccess");
const {SPARQL, GraphDB} = require("graphdb-utils");

const sankeyDiagramHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'sankeyDiagram'))
      return await sankeyDiagram(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const buildSankeyDiagram = async (nodes, links, firstColumn, secondColumn, startColumn) => {
  let query
  const firstColumnItems = firstColumn.individuals.map(item => `<${item}>`).join(' ');
  const secondColumnItems = secondColumn.individuals.map(item => `<${item}>`).join(' ');
  if (firstColumn.dataType === 'Organization' && secondColumn.dataType === 'Theme') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?firstCol cids:hasOutcome ?outcome .
    ?outcome cids:forTheme ?secondCol .
    OPTIONAL {?secondCol cids:hasName ?secondColName.} 
    OPTIONAL {?firstCol tove_org:hasLegalName ?firstColName.}
}`;
  } else if (firstColumn.dataType === 'Theme' && secondColumn.dataType === 'Indicator') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?outcome cids:forTheme ?firstCol .
    ?outcome cids:hasIndicator ?secondCol .
    OPTIONAL {?secondCol cids:hasName ?secondColName.} 
    OPTIONAL {?firstCol cids:hasName ?firstColName.}
}`;
  }

  const firstCols = {}
  const secondCols = {}
  const node2nodeCounting = {}
  await GraphDB.sendSelectQuery(query, false, ({firstCol,firstColName, secondCol, secondColName}) => {
    firstCols[firstCol.id] = firstColName.id + ' ' + firstCol.id
    secondCols[secondCol.id] = secondColName.id  + ' ' + secondCol.id
    if (!node2nodeCounting[firstCol.id]) {
      node2nodeCounting[firstCol.id] = {}
    }
    if (!node2nodeCounting[firstCol.id][secondCol.id]) {
      node2nodeCounting[firstCol.id][secondCol.id] = 0
    }
    node2nodeCounting[firstCol.id][secondCol.id] += 1
  })
  Object.keys(firstCols).map(uri => nodes[firstCols[uri]] = {id: firstCols[uri], column: startColumn})
  Object.keys(secondCols).map(uri => nodes[secondCols[uri]] = {id: secondCols[uri], column: startColumn + 1})
  Object.keys(node2nodeCounting).map(leftNodeUri => {
    const leftNodeLabel = firstCols[leftNodeUri]
    Object.keys((node2nodeCounting[leftNodeUri])).map(rightNodeUri => {
      const rightNodeLabel = secondCols[rightNodeUri]
      links.push({source: leftNodeLabel, target: rightNodeLabel, value: node2nodeCounting[leftNodeUri][rightNodeUri]})
    })
  })
}


const sankeyDiagram = async (req, res, next) => {
  const form = req.body
  const nodes = {}
  const links = []

  let i = 0
  while (form[i + 1]) {
    await buildSankeyDiagram(nodes, links, form[i], form[i + 1], i)
    i += 1
  }


  return res.status(200).json({nodes: Object.values(nodes), links})
}

module.exports = {sankeyDiagramHandler}
