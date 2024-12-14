const {GDBCity} = require("../../models/address");
const {SPARQL, GraphDB} = require("graphdb-utils");

const cities = {
  'http://ontology.eil.utoronto.ca/tove/organization#calgaryAbca': 'Calgary',
  'http://ontology.eil.utoronto.ca/tove/organization#edmontonAbca': 'Edmonton',
  'http://ontology.eil.utoronto.ca/tove/organization#fredrictonNbCa': 'Fredricton',
  'http://ontology.eil.utoronto.ca/tove/organization#halifaxNsCa': 'Halifax',
  'http://ontology.eil.utoronto.ca/tove/organization#montrealQcCa': 'Montreal',
  'http://ontology.eil.utoronto.ca/tove/organization#saskatoonSkCa': 'Saskatoon',
  'http://ontology.eil.utoronto.ca/tove/organization#torontoOnCa': 'Toronto',
  'http://ontology.eil.utoronto.ca/tove/organization#vancouverBcCa': 'Vancouver',
  'http://ontology.eil.utoronto.ca/tove/organization#victoriaBcCa': 'Victoria',
  'http://ontology.eil.utoronto.ca/tove/organization#winnipegMbCa': 'Winnipeg',
}


async function initCities() {
  console.log('Initializing cities...');
  // await Promise.all(Object.keys(cities).map(uri => GDBCity({
  //   label: cities[uri]
  // }, {_uri: uri}).save()))

  const triples = [];
  for (const uri in cities) {
    triples.push(`<${uri}> rdf:type owl:NamedIndividual, schema:City;\n\t rdfs:label "${cities[uri]}".`);
  }
  await GraphDB.sendUpdateQuery(`
      ${SPARQL.getSPARQLPrefixes()} 
      INSERT DATA {${triples.join('\n')}}`
  );

  console.log('Cities initialized');
}

module.exports = {initCities}