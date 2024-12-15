import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/dialogs/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import IndicatorField from "../shared/fields/IndicatorField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, updateDataType} from "../../api/generalAPI";
import {validateForm} from "../../helpers";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
import Dropdown from "../shared/fields/MultiSelectField";
import DataTypeGraph from "../shared/fields/dataTypeGraph";
const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
}));


export default function AddEditIndicator() {
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const classes = useStyles();
  const {uri, orgUri, operationMode} = useParams();
  const mode = uri ? operationMode : 'new';
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);

  const [codesInterfaces, setCodesInterfaces] = useState({});
  const [datasetInterfaces, setDatasetInterfaces] = useState({});

  const [state, setState] = useState({
    popReportGenerator: false,
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const [form, setForm] = useState({
    name: '',
    identifier: '',
    description: '',
    unitOfMeasure: '',
    uri: '',
    organization: null,
    baseline: '',
    threshold: '',
    codes: [],
    dateCreated: '',
    accesss: [],
    datasets: [],
    subIndicatorRelationships: [{organizations: [],subIndicators: []}],
  });

  const [loading, setLoading] = useState(true);
  const [indicatorReportInterfaces, setIndicatorReportInterfaces] = useState({});

  const attriConfig = configs[CONFIGLEVEL].indicator;

  const attribute2Compass = {
    name: 'cids:hasName',
    identifier: 'tove_org:hasIdentifier',
    description: 'cids:hasDescription',
    unitOfMeasure: 'iso21972:unit_of_measure',
    organization: 'cids:forOrganization',
    baseline: 'cids:hasBaseline',
    threshold: 'cids:hasThreshold',
    codes: 'cids:hasCode',
    dateCreated: 'schema:dateCreated',
    accesss: 'cids:hasAccess',
    datasets: 'dcat:dataset'
  }


  useEffect(() => {
    fetchDataTypeInterfaces('dataset').then(({success, interfaces}) => {
      if (success) {
        setDatasetInterfaces(interfaces)
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json)
      reportErrorToBackend(e)
      enqueueSnackbar(e.json?.message || "Error occur when fetching dataset interface", {variant: 'error'});
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('code').then(({success, interfaces}) => {
      if (success) {
        setCodesInterfaces(interfaces)
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json)
      reportErrorToBackend(e)
      enqueueSnackbar(e.json?.message || "Error occur when fetching code interface", {variant: 'error'});
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('indicatorReport').then(({success, interfaces}) => {
      if (success){
        setIndicatorReportInterfaces(interfaces)
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json)
      reportErrorToBackend(e)
      enqueueSnackbar(e.json?.message || "Error occur when fetching code interface", {variant: 'error'});
    })
  }, [])

  useEffect(() => {
    if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchDataType('indicator', encodeURIComponent(uri)).then(({success, indicator}) => {
        if (success) {
          indicator.uri = indicator._uri;
          indicator.subIndicatorRelationships = indicator.subIndicatorRelationships?.length? indicator.subIndicatorRelationships : [{organizations: [],subIndicators: []}]
          setForm(indicator);
          setLoading(false);
        }
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (mode === 'edit' && (!uri || !orgUri)) {
      navigate('/organization-indicators');
      enqueueSnackbar("No ID or orgId provided", {variant: 'error'});
    } else if (mode === 'new' && !orgUri) {
      setLoading(false);
      // navigate('/organization-indicators');
      // enqueueSnackbar("No orgId provided", {variant: 'error'});
    } else if (mode === 'new' && orgUri) {
      setForm(form => ({...form, organization: orgUri}));
      setLoading(false);
    } else {
      navigate('/organization-indicators');
      enqueueSnackbar('Wrong auth', {variant: 'error'});
    }

  }, [mode, uri]);

  const handleSubmit = () => {
    if (validate()) {
      if (popReportGenerator()) {
        setState(state => ({...state, popReportGenerator: true}))
      } else {
        handleSubmitNext()
      }
    }
  };

  const handleSubmitNext = () => {
    setState(state => ({...state, submitDialog: true}));
  }

  const popReportGenerator = () => {
    return !form.reportGenerator && haveNonBlankRelationship()
  }

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    const subIndicatorRelationships = form.subIndicatorRelationships.filter(relationship => relationship)
    if (mode === 'new') {
      createDataType('indicator', {
        form: {
          ...form, subIndicatorRelationships
        }}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/indicators');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating indicator', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateDataType('indicator',encodeURIComponent(uri), {form: {
          ...form, subIndicatorRelationships
        }}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/indicators');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating indicator', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const blankRelationship = (relationship) => {
    return !relationship.organizations.length && !relationship.subIndicators.length
  }

  const haveNonBlankRelationship = () => {
    return form.subIndicatorRelationships?.some(relationship => relationship && !blankRelationship(relationship))
  }




  const validate = () => {
    const errors = {};
    validateForm(form, attriConfig, attribute2Compass, errors, ['uri']);
    form.subIndicatorRelationships.map((relationship, index) => {
      if (!relationship)
        return
      if (!blankRelationship(relationship) && (!relationship.organizations.length || !relationship.subIndicators.length)) {
        if (!errors.subIndicatorRelationships) {
          errors.subIndicatorRelationships = {}
        }
        if (!errors.subIndicatorRelationships[index]) {
          errors.subIndicatorRelationships[index] = {}
        }
        if (!relationship.organizations.length) {
          errors.subIndicatorRelationships[index].organizations = 'Blank value is not valid';
          // errors.subIndicatorRelationships[index].subIndicators = 'Blank value is not valid';
        }
        if (!relationship.subIndicators.length) {
          errors.subIndicatorRelationships[index].subIndicators = 'Blank value is not valid';
        }
      }
      // if (!index && ((relationship.organizations.length && !relationship.subIndicators.length) || (!relationship.organizations.length && relationship.subIndicators.length))) {
      //   if (!errors.subIndicatorRelationships) {
      //     errors.subIndicatorRelationships = {[index]: {}}
      //   }
      //   if (!relationship.organizations.length) {
      //     errors.subIndicatorRelationships[index].organizations = 'Blank value is not valid'
      //   }
      //   if (!relationship.subIndicators.length) {
      //     errors.subIndicatorRelationships[index].subIndicators = 'Blank value is not valid'
      //   }
      // }
    })
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ?
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Indicator </Typography>
          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          <Typography variant={'h6'}> {`Organization:`} </Typography>
          <Typography variant={'body1'}> {<Link to={`/organizations/${encodeURIComponent(form.organization)}/view`} colorWithHover
                                                color={'#2f5ac7'}>{form.organizationName}</Link>} </Typography>
          <Typography variant={'h6'}> {`Date Created:`} </Typography>
          <Typography variant={'body1'}> {form.dateCreated ? `${(new Date(form.dateCreated)).toLocaleDateString()}`: 'Not Given'} </Typography>
          <Typography variant={'h6'}> {`Unit of Measure:`} </Typography>
          <Typography variant={'body1'}> {`${form.unitOfMeasure || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`Baseline:`} </Typography>
          <Typography variant={'body1'}> {`${form.baseline || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`Threshold:`} </Typography>
          <Typography variant={'body1'}> {`${form.threshold || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`Identifier:`} </Typography>
          <Typography variant={'body1'}> {`${form.identifier || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`Indicator Reports:`} </Typography>
          {form.indicatorReports?.length?
            form.indicatorReports.map(indicatorReport => <Typography variant={'body1'}> {<Link to={`/indicatorReport/${encodeURIComponent(indicatorReport)}/view`} colorWithHover
                                                                                               color={'#2f5ac7'}>{indicatorReportInterfaces[indicatorReport]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}
          <Typography variant={'h6'}> {`Codes:`} </Typography>
          {form.codes?.length?
            form.codes.map(code => <Typography variant={'body1'}> {<Link to={`/code/${encodeURIComponent(code)}/view`} colorWithHover
                                                                         color={'#2f5ac7'}>{codesInterfaces[code]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}
          <Typography variant={'h6'}> {`Datasets:`} </Typography>
          {form.datasets?.length?
            form.datasets.map(dataset => <Typography variant={'body1'}>{datasetInterfaces[dataset]} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Typography variant={'h6'}> {`Description:`} </Typography>
          <Typography variant={'body1'}> {`${form.description || 'Not Given'}`} </Typography>

          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/indicator/${encodeURIComponent(uri)}/edit`);
          }

          }>
            Edit
          </Button>

        </Paper>
        :
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Indicator </Typography>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{flex: 0.5}}>
          <IndicatorField
            disabled={mode === 'view'}
            disabledURI={mode !== 'new'}
            disabledOrganization={!!orgUri}
            defaultValue={form}
            required
            onChange={(state) => {
              setForm(form => ({...form, ...state}));
            }}
            importErrors={errors}
            attribute2Compass={attribute2Compass}
          />
            </div>
            <div style={{ flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
              <DataTypeGraph Indicator/>
            </div>
          </div>

          {mode === 'view' ?
            <div/> :
            <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
              Submit
            </Button>}

          <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                       dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Indicator?' :
                         'Are you sure you want to update this Indicator?'}
                       buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                         key={'cancel'}>{'cancel'}</Button>,
                         <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                        key={'confirm'}
                                        onClick={handleConfirm} children="confirm" autoFocus/>]}
                       open={state.submitDialog}/>

          <AlertDialog dialogContentText={"Do you want this indicator automatically generate corresponding \n" +
            "indicator reports based on given subIndicators' indicator reports? \n" +
            "Notice: Once you made the choice, you will not be able to change later"}
                       dialogTitle={'Automatic generation of indicator reports'}
                       dialogTitleColor={'red'}
                       buttons={[<Button onClick={() => {
                         setState(state => ({...state, popReportGenerator: false}))
                       }}
                                         key={'return'}>{'Return'}</Button>,
                         , <Button onClick={() => {
                         setState(state => ({...state, popReportGenerator: false}))
                         setForm(form => ({...form, reportGenerator: 'no'}))
                         handleSubmitNext()
                       }}
                                         key={'NO'}>{'NO'}</Button>,
                         <Button noDefaultStyle variant="text" color="primary"
                                        key={'yes'}
                                        onClick={() => {
                                          setState(state => ({...state, popReportGenerator: false}))
                                          setForm(form => ({...form, reportGenerator: 'auto'}))
                                          handleSubmitNext()
                                        }} children="Yes" autoFocus/>]}
                       open={state.popReportGenerator}/>
        </Paper>}

    </Container>);

}