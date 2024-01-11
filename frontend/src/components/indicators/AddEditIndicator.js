import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import {updateIndicator} from "../../api/indicatorApi";
import IndicatorField from "../shared/indicatorField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces} from "../../api/generalAPI";
import {validateForm} from "../../helpers";
import {fullLevelConfig} from "../../helpers/attributeConfig";
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
    access: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [indicatorReportInterfaces, setIndicatorReportInterfaces] = useState({});

  const attriConfig = fullLevelConfig.indicator;
  const attribute2Compass = {
    name: 'cids:hasName',
    description: 'cids:hasDescription',
    organization: 'cids:definedBy',
    indicator: 'cids:hasIndicatorReport',
    numericalValue: 'cids:hasThreshold',
    unitOfMeasure: 'iso21972:unit_of_measure',
    startTime: 'cids:hasTime',
    endTime: 'cids:hasTime',
    dateCreated: 'schema:dateCreated',
    hasAccesss: 'cids:hasAccess',
    datasets: 'dcat:dataset',
    identifier: 'tove_org:hasIdentifier',
    baseline: 'cids:hasBaseline',
    threshold: 'cids:hasThreshold',
    codes: 'cids:hasCode',
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
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('indicator', {form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organization-indicators');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateIndicator({form}, encodeURIComponent(uri)).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/organization-indicators');
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

  const validate = () => {
    const error = {};
    validateForm(form, attriConfig, attribute2Compass, error, ['uri']);
    setErrors(error);
    return Object.keys(error).length === 0;
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
          />

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
        </Paper>}

    </Container>);

}