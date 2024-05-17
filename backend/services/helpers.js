const {Server400Error} = require("../utils");
const {GDBMeasureModel} = require("../models/measure");
const {Transaction, SPARQL, GraphDB} = require("graphdb-utils");
const {GDBImpactNormsModel} = require("../models/impactStuffs");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../models/time");
const configs = require("./fileUploading/configs");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {UpdateQueryPayload,} = require('graphdb').query;
const {QueryContentType} = require('graphdb').http;


const rdfType2DataType = {
  'cids:Indicator': 'indicator',
  'cids:Outcome': 'outcome',
  'cids:Theme': 'theme',
  'cids:StakeholderOutcome': 'stakeholderOutcome',
  'cids:Characteristic': 'characteristic'
}
/**
 * return the first URI belongs to the object[property]
 * @param object
 * @param graphdbModel
 * @param property
 * @returns {*}
 */
const getValue = (object, graphdbModel, property) => {
  if (!object)
    return undefined;
  if (object[getFullURI(graphdbModel.schema[property].internalKey)]) {
    return object[getFullURI(graphdbModel.schema[property].internalKey)][0]['@value'];
  } else {
    return undefined;
  }
};

const getFullObjectURI = (object) => {
  return object["@id"];
};

const getObjectValue = (object, graphdbModel, property) => {
  if (object[getFullURI(graphdbModel.schema[property].internalKey)]) {
    return object[getFullURI(graphdbModel.schema[property].internalKey)][0];
  } else {
    return undefined;
  }
};

const getFullTypeURIList = (graphdbModel) => {
  return graphdbModel.schemaOptions.rdfTypes.map(uri => getFullURI(uri));
};

const getFullPropertyURI = (graphdbModel, propertyName) => {
  return getFullURI(graphdbModel.schema[propertyName].internalKey);
};

async function transSave(trans, object) {
  const {query} = await object.getQueries();
  return await trans.update(new UpdateQueryPayload()
    .setQuery(query)
    .setContentType(QueryContentType.SPARQL_UPDATE)
    .setTimeout(5));
}

async function assignImpactNorms(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, organizationUri, uri, hasError, error, impactNormsDict, mainModelType) {
  let ignore;
  if (object && object[getFullPropertyURI(mainModel, propertyName)]) {
    mainObject[propertyName] = getValue(object, mainModel, propertyName)
  }
  if (!mainObject[propertyName] && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else if (environment === 'interface') {
        Transaction.rollback();
        throw new Server400Error(`hasTime is mandatory`);
      }
    } else if (config[internalKey].ignoreInstance) {
      if (environment === 'fileUploading') {
        ignore = true;
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );



    // error += 1;
    // addMessage(8, 'propertyMissing',
    //   {
    //     uri,
    //     type: getPrefixedURI(object['@type'][0]),
    //     property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
    //   },
    //   config[internalKey]
    // )
    // ignore = true;
  }
  if (mainObject[propertyName]) {
    const impactNormsInDatabase = await GDBImpactNormsModel.findOne({_uri: mainObject[propertyName], organization: organizationUri})
    const impactNormsInFile = impactNormsDict[mainObject[propertyName]];
    if (impactNormsInDatabase) {
      // add the outcome to the impactNorms
      if (!impactNormsInDatabase[mainModelType])
        impactNormsInDatabase[mainModelType] = []
      impactNormsInDatabase[mainModelType] = [...impactNormsInDatabase[mainModelType], uri]
      await impactNormsInDatabase.save();
    }
    if (!impactNormsInDatabase && !impactNormsInFile) {
      error += 1;
      addMessage(8, 'NoSuchImpactNorms',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName)),
          impactNormsURI: mainObject[propertyName]
        },
        config[internalKey]
      )
      ignore = true;
    }
  }


  return {hasError, error, ignore};

}

async function assignTimeInterval(environment, config, object, mainModel, mainObject, addMessage, form, uri, hasError, error) {
  let ignore;
  if (mainObject.hasTime) {
    // todo: bug, looks like timeInstant will not be removed
    const timeInterval = await GDBDateTimeIntervalModel.findOne({_uri: mainObject.hasTime});
    await GDBInstant.findOneAndDelete({_uri: timeInterval.hasBeginning});
    await GDBInstant.findOneAndDelete({_uri: timeInterval.hasEnd});
    await GDBDateTimeIntervalModel.findOneAndDelete({_uri: mainObject.hasTime});
    delete mainObject.hasTime;
  }
  if (environment === 'fileUploading' && object[getFullURI('time:hasTime')]) {
    mainObject.hasTime = getValue(object, mainModel, 'hasTime') ||
      GDBDateTimeIntervalModel({
        hasBeginning: getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0],
            GDBDateTimeIntervalModel, 'hasBeginning') ||
          GDBInstant({
            date: new Date(getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0]
              [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0], GDBInstant, 'date'))
          }, {
            uri: getFullObjectURI(
              object[getFullPropertyURI(mainModel, 'hasTime')][0]
                [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0]
            )
          }),

        hasEnd: getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0],
            GDBDateTimeIntervalModel, 'hasEnd') ||
          GDBInstant({
            date: new Date(getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0]
              [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0], GDBInstant, 'date'))
          }, {
            uri: getFullObjectURI(
              object[getFullPropertyURI(mainModel, 'hasTime')][0]
                [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0]
            )
          })
      }, {uri: getFullObjectURI(object[getFullPropertyURI(mainModel, 'hasTime')])})
  }

  if (environment === 'interface') {
    if (form.startTime && form.endTime)
      mainObject.hasTime =  GDBDateTimeIntervalModel({
        hasBeginning: {date: new Date(form.startTime)},
        hasEnd: {date: new Date(form.endTime)}
      })
  }

  if (!mainObject.hasTime && config[getFullURI('time:hasTime')]) {
    if (config['time:hasTime'].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else if (environment === 'interface') {
        Transaction.rollback();
        throw new Server400Error(`hasTime is mandatory`);
      }
    } else if (config['time:hasTime'].ignoreInstance) {
      if (environment === 'fileUploading') {
        ignore = true;
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, 'hasTime'))
        },
        config['time:hasTime']
      );
  }
  return {hasError, error, ignore};
}


function assignValue(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, form, uri, hasError, error) {
  let ignore;
  if (mainObject[propertyName]) {
    // if the mode is updating
    mainObject[propertyName] = null;
  }
  if ((object && object[getFullPropertyURI(mainModel, propertyName)]) || form && form[propertyName]) {
    mainObject[propertyName] = environment === 'fileUploading' ? getValue(object, mainModel, propertyName) : form[propertyName];
  }
  if (!mainObject[propertyName] && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else if (environment === 'interface') {
        Transaction.rollback();
        throw new Server400Error(`${propertyName} is mandatory`);
      }
    } else if (config[internalKey].ignoreInstance) {
      if (environment === 'fileUploading') {
        ignore = true;
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  }
  return {hasError, error, ignore};
}

async function assignInvertValue(environment, config, object, mainModel, mainObject, {propertyName, internalKey}, objectDict, organization, {
  objectModel,
  objectType,
  propertyToOrganization,
  invertProperty,
  invertPropertyMultiply
}, addMessage, form, uri, hasError, error, getListOfValue) {
  // add the object to the mainObject
  let ignore;
  if (mainObject[propertyName]) {
    // have to remove the mainObject from the object
    const previousObject = await objectModel.findOne({_uri: mainObject[propertyName]});
    if (invertPropertyMultiply) {
      previousObject[invertProperty] = previousObject[invertProperty]?.filter(item => item !== uri) || [];
    } else {
      previousObject[invertProperty] = null;
    }
    await previousObject.save();
  }


  if (((environment === 'fileUploading' && !object[getFullPropertyURI(mainModel, propertyName)]) || (environment === 'interface' && !form[propertyName])) && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else {
        throw new Server400Error(`Property ${propertyName} are mandatory`);
      }
    } else if (config[internalKey].ignoreInstance) {
      if (environment === 'fileUploading') {
        ignore = true;
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  } else if ((object && object[getFullPropertyURI(mainModel, propertyName)]) || (form[propertyName])) {
    mainObject[propertyName] = environment === 'fileUploading' ? getValue(object, mainModel, propertyName) : form[propertyName];
    if (environment === 'interface' || !objectDict[mainObject[propertyName]]) {
      // in this case, the object is not in the file, get the object from database and add the mainObject to it
      const object = await objectModel.findOne({_uri: mainObject[propertyName]});
      if (!object) {
        if (environment === 'fileUploading') {
          addTrace('        Error: bad reference');
          addTrace(`            ${objectType} ${mainObject[propertyName]} appears neither in the file nor in the sandbox`);
          addMessage(8, 'badReference',
            {uri, referenceURI: mainObject[propertyName], type: objectType}, {rejectFile: true});
          hasError = true;
          error += 1;
        } else {
          throw new Server400Error(`${objectType} ${objectURI} is not in the database`)
        }

      } else if (propertyToOrganization && object[propertyToOrganization] !== organization._uri) {
        if (environment === 'fileUploading') {
          addTrace('        Error:');
          addTrace(`            ${objectType} ${mainObject[propertyName]} does not belong to this organization`);
          addMessage(8, 'subjectDoesNotBelong', {
            uri,
            type: objectType,
            subjectURI: mainObject[propertyName]
          }, {rejectFile: true});
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error(`${objectType} ${mainObject[propertyName]} does not belong to this organization`)
        }
      } else {
        if (invertPropertyMultiply) {
          if (!object[invertProperty])
            object[invertProperty] = [];
          if (!object[invertProperty].includes(uri)) {
            object[invertProperty] = [...object[invertProperty], uri]
          }
        }

        await object.save();
      }

    } // if the object is in the file, don't have to worry about adding the mainObject to the it

  }
  return {hasError, error, ignore};
}

async function assignInvertValues(environment, config, object, mainModel, mainObject, {propertyName, internalKey}, objectDict, organization, {
  objectModel,
  objectType,
  propertyToOrganization,
  invertProperty,
  invertPropertyMultiply
}, addMessage, form, uri, hasError, error, getListOfValue) {
  // add the object to the mainObject
  let ignore;
  if (mainObject[propertyName] && mainObject[propertyName].length) {
    // have to remove the mainObject from the objects
    for (const objectUri of mainObject[propertyName]) {
      const previousObject = await objectModel.findOne({_uri: objectUri});
      if (invertPropertyMultiply) {
        previousObject[invertProperty] = previousObject[invertProperty]?.filter(item => item !== uri) || [];
      } else {
        previousObject[invertProperty] = null;
      }
      await previousObject.save();
    }
  }


  if (((environment === 'fileUploading' && !object[getFullPropertyURI(mainModel, propertyName)]) || (environment === 'interface' && (!form[propertyName] || !form[propertyName].length))) && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else {
        throw new Server400Error(`Property ${propertyName} are mandatory`);
      }
    } else if (config[internalKey].ignoreInstance) {
      if (environment === 'fileUploading') {
        ignore = true;
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  } else if ((object && object[getFullPropertyURI(mainModel, propertyName)]) || (form[propertyName])) {
    mainObject[propertyName] = [];
    for (const objectURI of environment === 'fileUploading'? getListOfValue(object, mainModel, propertyName) : form[propertyName]) {
      mainObject[propertyName] = [...mainObject[propertyName], objectURI]
      // add mainObject to object
      if (environment === 'interface' || !objectDict[objectURI]) {
        // in this case, the object is not in the file, get the object from database and add the mainObject to it
        const object = await objectModel.findOne({_uri: objectURI});
        if (!object) {
          if (environment === 'fileUploading') {
            addTrace('        Error: bad reference');
            addTrace(`            ${objectType} ${objectURI} appears neither in the file nor in the sandbox`);
            addMessage(8, 'badReference',
              {uri, referenceURI: objectURI, type: objectType}, {rejectFile: true});
            hasError = true;
            error += 1;
          } else {
            throw new Server400Error(`${objectType} ${objectURI} is not in the database`)
          }

        } else if (propertyToOrganization && object[propertyToOrganization] !== organization._uri) {
          if (environment === 'fileUploading') {
            addTrace('        Error:');
            addTrace(`            ${objectType} ${objectURI} does not belong to this organization`);
            addMessage(8, 'subjectDoesNotBelong', {
              uri,
              type: objectType,
              subjectURI: objectURI
            }, {rejectFile: true});
            error += 1;
            hasError = true;
          } else {
            throw new Server400Error(`${objectType} ${objectURI} does not belong to this organization`)
          }
        } else {
          if (invertPropertyMultiply) {
            if (!object[invertProperty])
              object[invertProperty] = [];
            if (!object[invertProperty].includes(uri)) {
              object[invertProperty] = [...object[invertProperty], uri]
            }
          }
          await object.save();
        }

      } // if the object is in the file, don't have to worry about adding the mainObject to the it
    }
  }
  return {hasError, error, ignore};
}

function assignValues(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, form, uri, hasError, error, getListOfValue) {
  if (mainObject[propertyName]) {
    // if the mode is updating
    mainObject[propertyName] = [];
  }
  if ((object && object[getFullPropertyURI(mainModel, propertyName)]) || form && form[propertyName]) {
    mainObject[propertyName] = environment === 'fileUploading' ? getListOfValue(object, mainModel, propertyName) : form[propertyName];
  }
  if ((!mainObject[propertyName] || !mainObject[propertyName].length) && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      } else if (environment === 'interface') {
        throw new Server400Error(`${propertyName} is mandatory`);
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  }
  return {hasError, error};
}

async function assignMeasure(environment, config, object, mainModel, mainObject, propertyName, internalKey, addMessage, uri, hasError, error, form) {
  if (mainObject[propertyName]) {
    // if the mode is updating, deleting the previous object
    await GDBMeasureModel.findOneAndDelete({_uri: mainObject[propertyName]});
    delete mainObject[propertyName];
  }
  let measureURI = environment === 'interface' ? null : getValue(object, mainModel, propertyName);
  let measureObject = environment === 'interface' ? null : getObjectValue(object, mainModel, propertyName);

  let numericalValue;
  if (measureObject) {
    numericalValue = getValue(measureObject, GDBMeasureModel, 'numericalValue');
  } else if (environment === 'interface' && form && propertyName) {
    numericalValue = form[propertyName];
  }

  if (!measureURI && !numericalValue && config[internalKey]) {
    if (config[internalKey].rejectFile) {
      if (environment === 'interface') {
        throw new Server400Error(`${propertyName} is Mandatory`);
      } else if (environment === 'fileUploading') {
        error += 1;
        hasError = true;
      }
    }
    if (environment === 'fileUploading')
      addMessage(8, 'propertyMissing',
        {
          uri,
          type: getPrefixedURI(object['@type'][0]),
          property: getPrefixedURI(getFullPropertyURI(mainModel, propertyName))
        },
        config[internalKey]
      );
  } else if (measureURI || numericalValue) {
    mainObject[propertyName] = measureURI ||
      GDBMeasureModel({
          numericalValue
        },
        {uri: measureObject ? measureObject['@id'] : null});
  }
  return {hasError, error};
}

async function dataReferredBySubjects(subjectType, objectUri, predicate) {
  const query = `${SPARQL.getSPARQLPrefixes()} 
  select * where {
  ?subject rdf:type ${subjectType} .
  ?subject ${predicate} <${objectUri}> .
  }`;
  let subjects = []
  await GraphDB.sendSelectQuery(query, false, ({subject}) => {
    subjects = [...subjects, subject.id]
  })
  return subjects
}

async function deleteDataAndAllReferees(objectUri, predicate) {
  let query;
  if (predicate) {
    query = `${SPARQL.getSPARQLPrefixes()} 
        delete where {
            ?subject ${predicate} <${objectUri}> .
        }`;
    await GraphDB.sendUpdateQuery(query, false);
  }

  query = `
        delete where {
            <${objectUri}> ?p ?o.
        }`
  await GraphDB.sendUpdateQuery(query, false);
}


async function checkAllReferees(objectUri, subjectType2Predicate, configLevel) {


  const regularReferee = {}
  const mandatoryReferee = {};
  for (let subjectType in subjectType2Predicate) {
    const subjects = await dataReferredBySubjects(subjectType, objectUri, subjectType2Predicate[subjectType]);
    if (configs[configLevel][rdfType2DataType[subjectType]]?.[subjectType2Predicate[subjectType]] && subjects?.length){
      // there are mandatory predicate being affected
      mandatoryReferee[subjectType] = subjects
    } else {
      regularReferee[subjectType] = subjects
    }
  }
  return {mandatoryReferee, regularReferee}
}



module.exports = {
  transSave,
  getFullPropertyURI,
  getFullTypeURIList,
  getValue,
  getObjectValue,
  assignValue,
  assignValues,
  assignMeasure,
  getFullObjectURI,
  assignImpactNorms,
  assignTimeInterval,
  assignInvertValues,
  assignInvertValue,
  dataReferredBySubjects,
  deleteDataAndAllReferees,
  checkAllReferees

};