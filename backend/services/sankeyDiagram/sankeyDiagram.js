const {hasAccess} = require("../../helpers/hasAccess");
const {SPARQL, GraphDB} = require("graphdb-utils");
const {Server400Error} = require("../../utils");

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
  } else if (secondColumn.dataType === 'Theme' && firstColumn.dataType === 'Indicator') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?outcome cids:forTheme ?secondCol .
    ?outcome cids:hasIndicator ?firstCol .
    OPTIONAL {?secondCol cids:hasName ?secondColName.} 
    OPTIONAL {?firstCol cids:hasName ?firstColName.}
}`;
  } else if (secondColumn.dataType === 'Indicator' && firstColumn.dataType === 'Organization') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?firstCol cids:hasOutcome ?outcome .
    ?outcome cids:hasIndicator ?secondCol .
    OPTIONAL {?secondCol cids:hasName ?secondColName.} 
    OPTIONAL {?firstCol tove_org:hasLegalName ?firstColName.}
}`;
  } else if (firstColumn.dataType === 'Indicator' && secondColumn.dataType === 'Organization') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?secondCol cids:hasOutcome ?outcome .
    ?outcome cids:hasIndicator ?firstCol .
    OPTIONAL {?firstCol cids:hasName ?firstColName.} 
    OPTIONAL {?secondCol tove_org:hasLegalName ?secondColName.}
}`;
  }else if (secondColumn.dataType === 'Theme' && firstColumn.dataType === 'Theme') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?relationship cidsrep:hasParentTheme ?firstCol .
    ?relationship cidsrep:hasSubTheme ?secondCol .
    OPTIONAL {?secondCol cids:hasName ?secondColName.} 
    OPTIONAL {?firstCol cids:hasName ?firstColName.}
}`;
  } else if (firstColumn.dataType === 'Theme' && secondColumn.dataType === 'Organization') {
    query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
  VALUES ?firstCol {${firstColumnItems}}
  VALUES ?secondCol {${secondColumnItems}}
    ?secondCol cids:hasOutcome ?outcome .
    ?outcome cids:forTheme ?firstCol .
    OPTIONAL {?secondCol tove_org:hasLegalName ?secondColName.} 
    OPTIONAL {?firstCol cids:hasName ?firstColName.}
}`;
  }


  const firstCols = {}
  const secondCols = {}
  const node2nodeCounting = {}
  await GraphDB.sendSelectQuery(query, false, ({firstCol,firstColName, secondCol, secondColName}) => {
    firstCols[firstCol.id] = firstColName?.id || firstCol.id
    secondCols[secondCol.id] = secondColName?.id || secondCol.id
    // hasNodes[firstCol.id] = true
    // hasNodes[secondCol.id] = true
    if (!node2nodeCounting[firstCol.id]) {
      node2nodeCounting[firstCol.id] = {}
    }
    if (!node2nodeCounting[firstCol.id][secondCol.id]) {
      node2nodeCounting[firstCol.id][secondCol.id] = 0
    }
    node2nodeCounting[firstCol.id][secondCol.id] += 1
  })
  Object.keys(firstCols).map(uri => nodes[uri] = {id: firstCols[uri], column: startColumn})
  Object.keys(secondCols).map(uri => nodes[uri] = {id: secondCols[uri], column: startColumn + 1})
  Object.keys(node2nodeCounting).map(leftNodeUri => {
    const leftNodeLabel = firstCols[leftNodeUri]
    Object.keys((node2nodeCounting[leftNodeUri])).map(rightNodeUri => {
      const rightNodeLabel = secondCols[rightNodeUri]
      links.push({source: leftNodeLabel, target: rightNodeLabel, value: node2nodeCounting[leftNodeUri][rightNodeUri]})
    })
  })
}

const getItemName = async (itemUri) => {
  const query = `${SPARQL.getSPARQLPrefixes()} 
  SELECT * WHERE {
    OPTIONAL {<${itemUri}> cids:hasName ?name.} 
    OPTIONAL {<${itemUri}> tove_org:hasLegalName ?legalName.}
}`;
  let ret
  await GraphDB.sendSelectQuery(query, false, ({name, legalName}) => {
    ret = name?.id || legalName?.id
  })
  return ret
}

const checkMissingNodes = async (messages, form, nodes, error, errorMessages) => {
  let i = 1
  while (form[i]) {
    let atLeastOneItem = false
    let isFirstInvalidItem = true
    const dataType = form[i].dataType

    for (let itemUri of form[i].individuals) {
      if (nodes[itemUri]?.column !== i) {
        if (isFirstInvalidItem) {
          messages.push(``)
          messages.push(`Column ${i}:`)
          isFirstInvalidItem = false
        }

        messages.push(`    ${await getItemName(itemUri) || itemUri}`)
      } else {
        atLeastOneItem = true
      }
    }
    if (!isFirstInvalidItem) {
      // means some items in the column is missing
      if (!form[i - 1]) {
        // first column
        messages.push(`There are no outgoing connections from these ${dataType}s`)
      } else if (!form[i + 1]) {
        // second column
        messages.push(`There are no incoming connections to these ${dataType}s`)
      } else {
        // last column
        messages.push(`There are no incoming or outgoing connections for these ${dataType}s`)
      }

    }
    if (!atLeastOneItem) {
      if (!form[i - 1]) {
        errorMessages.push(`Column ${i} type ${dataType} has no outgoing connections`)
      } else if (!form[i + 1]){
        errorMessages.push(`Column ${i} type ${dataType} has no incoming connections`)
      } else {
        errorMessages.push(`Column ${i} type ${dataType} has no incoming or outgoing connections`)
      }

      error = true
    }
    i += 1
  }
  return error
}

const sankeyDiagram = async (req, res, next) => {
  const form = req.body
  const nodes = {}
  const links = []
  const messages = []
  const errorMessages = []
  let error = false
  let i = 1
  while (form[i + 1]) {
    await buildSankeyDiagram(nodes, links, form[i], form[i + 1], i)
    i += 1
  }
  error = await checkMissingNodes(messages, form, nodes, error, errorMessages)

  if (error) {
    return res.status(200).json({error, errorMessages: errorMessages.join('\n')})
  } else {
    // minus each node's column by 1, since sankey diagram takes 0-indexed data
    return res.status(200).json({nodes: Object.values(nodes).map(node => {
      node.column -= 1
      return node
      }), links, messages: messages.join('\n')})
  }



}

module.exports = {sankeyDiagramHandler}
