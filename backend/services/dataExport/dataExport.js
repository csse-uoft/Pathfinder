const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOrganizationModel} = require("../../models/organization");
const {SPARQL, GraphDB,} = require("graphdb-utils");
const {GDBThemeModel} = require("../../models/theme");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBMeasureModel} = require("../../models/measure");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");

const dataExportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'dataExport'))
      return await dataExport(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const dataExport = async (req, res) => {

  const datatype2Model = {
    'cids:Theme': GDBThemeModel,
    'cids:Indicator': GDBIndicatorModel,
    'cids:Outcome': GDBOutcomeModel,
    'iso21972:Measure': GDBMeasureModel,
    'cids:IndicatorReport': GDBIndicatorReportModel
  };


  const level2Property = {
    Basic: {
      'http://ontology.eil.utoronto.ca/cids/cids#Organization': {
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicator': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasOutcome": 'uri'
      }
      ,
      'http://ontology.eil.utoronto.ca/cids/cids#Indicator': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Outcome': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Theme': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#IndicatorReport': {
        "http://ontology.eil.utoronto.ca/cids/cids#forOrganization": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
        "http://ontology.eil.utoronto.ca/cids/cids#hasComment": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
      },
      'http://ontology.eil.utoronto.ca/ISO21972/iso21972#Measure': {
        'http://ontology.eil.utoronto.ca/ISO21972/iso21972#numerical_value': 'number'
      }

    },
    Essential: {},
  };

  // async function fetchAll2LevelDataObjectUrisBasedOnOrganization(orgUri, firstLevelPredicate, secondLevelPredicate,) {
  //   const query = `${SPARQL.getSPARQLPrefixes()}
  // select * where {
  // <${orgUri}> ${firstLevelPredicate} ?firstLevelObject .
  // ?firstLevelObject ${secondLevelPredicate} ?secondLevelObject .
  // }`;
  //   let objects = [];
  //   await GraphDB.sendSelectQuery(query, false, ({secondLevelObject}) => {
  //     if (!objects.includes(secondLevelObject)) {
  //       objects = [...objects, secondLevelObject.id];
  //     }
  //   });
  //   return objects;
  // }

  async function fetchAllObjectUrisFromOrganization(orgUri, pathTypes, dataTypes) {
    const query = `${SPARQL.getSPARQLPrefixes()} 
  select * where {
  <${orgUri}> (${pathTypes.join('|')})+ ?objectUri .
    ?objectUri rdf:type ?type
    FILTER(?type IN (${dataTypes.join(',')}))
  }`;
    await GraphDB.sendSelectQuery(query, false, ({objectUri, type}) => {
      const dataType = SPARQL.getPrefixedURI(type.id);
      if (!data[orgUri][dataType].includes(objectUri)) {
        data[orgUri][dataType] = [...data[orgUri][dataType], objectUri.id];
      }
    });
  }


  // async function fetchAllDataObjectUrisBasedOnOrganization(orgUri, dataType) {
  //   const query = `${SPARQL.getSPARQLPrefixes()}
  // select * where {
  // <${orgUri}> ?predicate ?objectUri .
  // ?objectUri rdf:type ${dataType} .
  // }`;
  //   let objects = [];
  //   await GraphDB.sendSelectQuery(query, false, ({objectUri}) => {
  //     if (!objects.includes(objectUri)) {
  //       objects = [...objects, objectUri.id];
  //     }
  //   });
  //   return objects;
  // }

  async function writeAnObjectAndItsNestedObjects(object) {
    let ret = []
    const writtenObject = {
      "@context": "http://ontology.eil.utoronto.ca/cids/contexts/cidsContext.json",
      "@type": object.schemaOptions.rdfTypes.slice(-1)[0],
      "@id": object._uri,
    };
    for (let property in object.schema) {
      const propertyType = level2Property[level][SPARQL.getFullURI(object.schemaOptions.rdfTypes.slice(-1)[0])]?.[SPARQL.getFullURI(object.schema[property].internalKey)];
      if (object[property] && propertyType) {
        const propertyUri = object[property];
        writtenObject[SPARQL.getFullURI(object.schema[property].internalKey)] = propertyUri;
        if (datatype2Model[propertyType]) {
          const nestedObject = await datatype2Model[propertyType].findOne({_uri: propertyUri});
          ret = [...ret, ...await writeAnObjectAndItsNestedObjects(nestedObject)];
        }
      }
    }
    ret = [...ret, writtenObject]
    return ret;
  }

  async function writeAllDataObjectOfAnOrganization(orgUri, level) {
    // firstly write an object
    const organizationData = data[orgUri];
    const organization = await GDBOrganizationModel.findOne({_uri: orgUri});
    let ret = [...await writeAnObjectAndItsNestedObjects(organization)];
    for (let dataType in organizationData) {
      for (let objectUri of organizationData[dataType]) {
        const object = await datatype2Model[dataType].findOne({_uri: objectUri});
        ret = [...ret, ...await writeAnObjectAndItsNestedObjects(object)];
      }
    }
    return ret;
  }


  const {organizationUris, level, properties, dataTypes} = req.body;
  let ret = [];
  const data = {};
  // await storeObjectUrisPredicatedByOrganization(organizationUris);
  for (let orgUri of organizationUris) {
    // put the organization into data
    data[orgUri] = {};
    const pathTypes = ['cids:hasIndicator', 'cids:hasOutcome', 'cids:forTheme', '^cids:forOrganization', '^cids:forOutcome'];
    dataTypes.map(dataType => {
      if (!data[orgUri][dataType]) {
        data[orgUri][dataType] = [];
      }
    });
    await fetchAllObjectUrisFromOrganization(orgUri, pathTypes, dataTypes);
  }

  for (let orgUri in data) {
    ret = [...ret, ...await writeAllDataObjectOfAnOrganization(orgUri, level)];
  }


  return res.status(200).json({data: ret});
};

module.exports = {dataExportHandler};