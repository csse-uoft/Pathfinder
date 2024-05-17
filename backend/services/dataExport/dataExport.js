const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOrganizationModel, GDBOrganizationIdModel, GDBStakeholderOrganizationModel} = require("../../models/organization");
const {SPARQL, GraphDB,} = require("graphdb-utils");
const {GDBThemeModel} = require("../../models/theme");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBMeasureModel} = require("../../models/measure");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {GDBCodeModel} = require("../../models/code");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {GDBHowMuchImpactModel} = require("../../models/howMuchImpact");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {GDBDataSetModel} = require("../../models/dataset");
const {GDBCounterfactualModel} = require("../../models/counterfactual");
const {GDBImpactRiskModel} = require("../../models/impactRisk");

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
    'cids:IndicatorReport': GDBIndicatorReportModel,
    'tove_org:OrganizationID': GDBOrganizationIdModel,
    'cids:ImpactReport': GDBImpactReportModel,
    'cids:StakeholderOutcome': GDBStakeholderOutcomeModel,
    'cids:Code': GDBCodeModel,
    'time:DateTimeInterval': GDBDateTimeIntervalModel,
    'time:Instant': GDBInstant,
    'cids:Stakeholder': GDBStakeholderOrganizationModel,
    'cids:Characteristic': GDBCharacteristicModel,
    'cids:HowMuchImpact': GDBHowMuchImpactModel,
    'cids:ImpactNorms': GDBImpactNormsModel,
    'dcat:Dataset': GDBDataSetModel,
    'cids:Counterfactual': GDBCounterfactualModel,
    'cids:ImpactRisk': GDBImpactRiskModel
  };


  const level2Property = {
    Basic: {
      'http://ontology.eil.utoronto.ca/cids/cids#Organization': {
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicator': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalName": 'string'
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
    Essential: {
      'http://ontology.eil.utoronto.ca/cids/cids#ImpactNorms': {
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicator': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholder": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholderOutcome": 'uri',
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport': 'uri',
        'http://ontology.eil.utoronto.ca/cids/cids#hasImpactReport': 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Organization': {
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicator': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCharacteristic": 'uri',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalName": 'string',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalStatus": 'string',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalId": 'tove_org:OrganizationID'
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Code': {
        "http://ontology.eil.utoronto.ca/cids/cids#definedBy": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://ontology.eil.utoronto.ca/tove/organization#hasIdentifier": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasSpecification": 'uri',
        "http://schema.org/codeValue": 'string',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Indicator': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholderOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forTheme": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#definedBy": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasBaseline": 'iso21972:Measure',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Outcome': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholderOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forTheme": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',

      },
      'http://ontology.eil.utoronto.ca/cids/cids#Theme': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#StakeholderOutcome': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#forStakeholder": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImportance": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#isUnderserved": 'boolean',
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactReport": 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#ImpactReport': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#forOrganization": 'uri',
        "http://www.w3.org/2006/time#hasTime": 'time:DateTimeInterval',
        "http://ontology.eil.utoronto.ca/cids/cids#forOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactScale": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactDepth": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasComment": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#HowMuchImpact': {
        "http://ontology.eil.utoronto.ca/cids/cids#forIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Stakeholder': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://schema.org/description": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCatchmentArea": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCharacteristic": 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Characteristic': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasValue": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forStakeholder": 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#IndicatorReport': {
        "http://ontology.eil.utoronto.ca/cids/cids#forOrganization": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
        "http://ontology.eil.utoronto.ca/cids/cids#hasComment": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://www.w3.org/2006/time#hasTime": 'time:DateTimeInterval',
      },
      'http://ontology.eil.utoronto.ca/ISO21972/iso21972#Measure': {
        'http://ontology.eil.utoronto.ca/ISO21972/iso21972#numerical_value': 'number'
      },
      "http://ontology.eil.utoronto.ca/tove/organization#OrganizationID": {
        "http://ontology.eil.utoronto.ca/tove/organization#hasIdentifier": "string",
        "http://ontology.eil.utoronto.ca/tove/organization#issuedBy": "uri",
      },
      "http://www.w3.org/2006/time#DateTimeInterval": {
        "http://www.w3.org/2006/time#hasBeginning": 'time:Instant',
        "http://www.w3.org/2006/time#hasEnd": 'time:Instant',
      },
      "http://www.w3.org/2006/time#Instant": {
        "http://www.w3.org/2006/time#inXSDDate": "string"
      }

    },
    Full: {
      'http://ontology.eil.utoronto.ca/cids/cids#ImpactNorms': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://schema.org/hasDescription": 'string',
        "http://schema.org/dateCreated": 'date',
        'http://ontology.eil.utoronto.ca/cids/cids#forOrganization': 'uri',
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicator': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholder": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholderOutcome": 'uri',
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport': 'uri',
        'http://ontology.eil.utoronto.ca/cids/cids#hasImpactReport': 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Organization': {
        'http://ontology.eil.utoronto.ca/cids/cids#hasIndicator': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCharacteristic": 'uri',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalName": 'string',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalStatus": 'string',
        "http://ontology.eil.utoronto.ca/tove/organization#hasLegalId": 'tove_org:OrganizationID'
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Code': {
        "http://ontology.eil.utoronto.ca/cids/cids#definedBy": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://ontology.eil.utoronto.ca/tove/organization#hasIdentifier": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasSpecification": 'uri',
        "http://schema.org/codeValue": 'string',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Indicator': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicatorReport": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholderOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forTheme": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#definedBy": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasBaseline": 'iso21972:Measure',
        "http://ontology.eil.utoronto.ca/cids/cids#hasThreshold": 'iso21972:Measure',
        "http://www.w3.org/ns/dcat#dataset": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasAccess": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasIdentifier": 'string',
        "http://schema.org/dateCreated": 'date',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Outcome': {
        "http://ontology.eil.utoronto.ca/cids/cids#canProduce": 'uri',
        "http://schema.org/dateCreated": 'date',
        'http://www.w3.org/2001/sw/BestPractices/OEP/SimplePartWhole/part.owl#partOf': 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasStakeholderOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forTheme": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Theme': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#StakeholderOutcome': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#forStakeholder": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#fromPerspectiveOf": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImportance": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#isUnderserved": 'boolean',
        "http://ontology.eil.utoronto.ca/cids/cids#intendedImpact": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactReport": 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#ImpactReport': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#forOrganization": 'uri',
        "http://www.w3.org/2006/time#hasTime": 'time:DateTimeInterval',
        "http://ontology.eil.utoronto.ca/cids/cids#forOutcome": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactScale": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactDepth": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasComment": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasImpactDuration": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasReportedImpact": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasReportedRisk": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasExpectation": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#HowMuchImpact': {
        "http://ontology.eil.utoronto.ca/cids/cids#forIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCounterfactual": 'uri',
        "http://www.w3.org/2006/time#hasTime": 'time:DateTimeInterval',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Counterfactual': {
        "http://schema.org/description": 'string',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
        "http://www.w3.org/2006/time#hasTime": 'time:DateTimeInterval',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#ImpactRisk': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasIdentifier": 'string',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Stakeholder': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasDescription": 'string',
        "http://schema.org/description": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCatchmentArea": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCharacteristic": 'uri',
        'http://www.w3.org/2001/sw/BestPractices/OEP/SimplePartWhole/part.owl#partOf': 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#Characteristic': {
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasValue": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasCode": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forStakeholder": 'uri',
      },
      'http://ontology.eil.utoronto.ca/cids/cids#IndicatorReport': {
        "http://ontology.eil.utoronto.ca/cids/cids#forOrganization": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#forIndicator": 'uri',
        "http://ontology.eil.utoronto.ca/ISO21972/iso21972#value": 'iso21972:Measure',
        "http://ontology.eil.utoronto.ca/cids/cids#hasComment": 'string',
        "http://ontology.eil.utoronto.ca/cids/cids#hasName": 'string',
        "http://www.w3.org/2006/time#hasTime": 'time:DateTimeInterval',
        "http://www.w3.org/ns/dcat#dataset": 'uri',
        "http://ontology.eil.utoronto.ca/cids/cids#hasAccess": 'uri',
        "http://schema.org/dateCreated": 'date',
      },
      'http://ontology.eil.utoronto.ca/ISO21972/iso21972#Measure': {
        'http://ontology.eil.utoronto.ca/ISO21972/iso21972#numerical_value': 'number'
      },
      "http://ontology.eil.utoronto.ca/tove/organization#OrganizationID": {
        "http://ontology.eil.utoronto.ca/tove/organization#hasIdentifier": "string",
        "http://ontology.eil.utoronto.ca/tove/organization#issuedBy": "uri",
      },
      "http://www.w3.org/2006/time#DateTimeInterval": {
        "http://www.w3.org/2006/time#hasBeginning": 'time:Instant',
        "http://www.w3.org/2006/time#hasEnd": 'time:Instant',
      },
      "http://www.w3.org/2006/time#Instant": {
        "http://www.w3.org/2006/time#inXSDDate": "string"
      },
      "http://www.w3.org/ns/dcat#Dataset": {
        "http://schema.org/identifier": "string",
        "http://schema.org/name": "string",
        "http://schema.org/description": "string",
        "http://schema.org/dateCreated": "date",
      }

    },
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
    let ret = [];
    const writtenObject = {
      "@context": "http://ontology.eil.utoronto.ca/cids/contexts/cidsContext.json",
      "@type": object.schemaOptions.rdfTypes.slice(-1)[0],
      "@id": object._uri,
    };
    for (let property in object.schema) {
      const propertyType = level2Property[level][SPARQL.getFullURI(object.schemaOptions.rdfTypes.slice(-1)[0])]?.[SPARQL.getFullURI(object.schema[property].internalKey)];
      if ((propertyType === 'boolean' && object[property] === false) || (object[property] && propertyType)) {
        const propertyUri = object[property];
        writtenObject[SPARQL.getFullURI(object.schema[property].internalKey)] = propertyUri;
        if (datatype2Model[propertyType]) {
          const nestedObject = await datatype2Model[propertyType].findOne({_uri: propertyUri});
          ret = [...ret, ...await writeAnObjectAndItsNestedObjects(nestedObject)];
        }
      }
    }
    ret = [...ret, writtenObject];
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
    const pathTypes = {
      'Basic':
        ['cids:hasIndicator',
          'cids:hasOutcome',
          'cids:forTheme',
          '^cids:forOrganization',
          '^cids:forOutcome'
        ],
      'Essential':
        ['cids:hasIndicator',
          'cids:hasOutcome',
          'cids:forTheme',
          '^cids:forOrganization',
          '^cids:forOutcome',
          'cids:definedBy',
          'cids:hasCode',
          '^cids:forIndicator',
          'cids:forStakeholder',
          'cids:hasCharacteristic',
          'cids:hasImpactModel'
        ],
      'Full': ['cids:hasIndicator',
        'cids:hasOutcome',
        'cids:forTheme',
        '^cids:forOrganization',
        '^cids:forOutcome',
        'cids:definedBy',
        'cids:hasCode',
        '^cids:forIndicator',
        'cids:forStakeholder',
        'cids:hasCharacteristic',
        'cids:hasImpactModel',
        'cids:hasCounterfactual',
        'cids:hasImpactRisk',
        'dcat:dataset'
      ]
    };
    dataTypes.map(dataType => {
      if (!data[orgUri][dataType]) {
        data[orgUri][dataType] = [];
      }
    });
    await fetchAllObjectUrisFromOrganization(orgUri, pathTypes[level], dataTypes);
  }

  for (let orgUri in data) {
    ret = [...ret, [...await writeAllDataObjectOfAnOrganization(orgUri, level)]];
  }


  return res.status(200).json({data: ret});
};

module.exports = {dataExportHandler};