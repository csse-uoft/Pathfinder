import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {fetchOrganizations} from "../../api/organizationApi";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import { saveAs } from 'file-saver';
import {navigate, navigateHelper} from "../../helpers/navigatorHelper";
import Dropdown from "../shared/fields/MultiSelectField";
import {dataExport} from "../../api/dataExportApi";
const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginLeft: 10,
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
  link: {
    marginTop: 20,
    marginLeft: 15,
    color: '#007dff',
  }
}));


export default function DataExportPage() {
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const classes = useStyles();
  const userContext = useContext(UserContext);
  const {enqueueSnackbar} = useSnackbar();


  const [state, setState] = useState({
    loading: true,
    submitDialog: false,
    loadingButton: false,
    fileType: 'JSON-ld',
    // useParams().fileType,
    organizations: [],
    level: 'Basic',
    properties: [],
    dataTypes: [],

    errorDialog: false,
    success: false,
    fail: false,
  });
  const [options, setOptions] = useState({
    fileTypes: ['JSON-ld'],
    properties: ['All'],
    organizations: {},
    levels: ['Basic', 'Essential'],
    dataTypes: {'Basic': {'cids:Indicator': 'cids:Indicator', 'cids:Outcome': 'cids:Outcome', 'cids:Theme': 'cids:Theme', 'cids:IndicatorReport': 'cids:IndicatorReport'},
      'Essential': {'cids:ImpactNorms':'cids:ImpactNorms','cids:Indicator': 'cids:Indicator', 'cids:Outcome': 'cids:Outcome', 'cids:Theme': 'cids:Theme', 'cids:IndicatorReport': 'cids:IndicatorReport',
        'cids:Code': 'cids:Code', 'cids:StakeholderOutcome': 'cids:StakeholderOutcome', 'cids:ImpactReport': 'cids:ImpactReport', 'cids:HowMuchImpact': 'cids:HowMuchImpact',
        'cids:Stakeholder': 'cids:Stakeholder', 'cids:Characteristic': 'cids:Characteristic'}}
  });
  const [errors, setErrors] = useState(
    {}
  );
  const [errorMessage, setErrorMessage] = useState({
    title: '',
    message: ''
  });


  useEffect(() => {
    fetchOrganizations().then(res => {
      if (res.success)
        res.organizations.map(organization => {
          options.organizations[organization._uri] = organization.legalName;
        });
      setState(state => ({...state, loading: false}));
    }).catch(e => {
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });


  }, []);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = async () => {
    try {
      setState(state => ({...state, loadingButton: true}));
      const {data} = await dataExport(state.organizations, state.level, state.properties, state.dataTypes)
      if (data) {
        setState(state => ({...state, loadingButton: false, submitDialog: false, success: true}));
        const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(file, 'dataExport.json');
      }

    } catch (e) {
      setState(state => ({...state, loadingButton: false, submitDialog: false, fail: true, traceOfUploading: e.json?.message}));
      reportErrorToBackend(e);
      // enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    }
  };

  const validate = () => {
    const error = {};
    if ((!state.organizations) || !state.organizations.length) {
      error.organizations = 'The field cannot be empty';
    }
    if (!state.fileType) {
      error.fileType = 'The field cannot be empty';
    }
    if (!state.level) {
      error.level = 'The field cannot be empty';
    }
    if ((!state.dataTypes) || !state.dataTypes.length) {
      error.dataTypes = 'The field cannot be empty';
    }
    setErrors(error);
    return Object.keys(error).length === 0;
  };


  if (state.loading)
    return <Loading message={`Loading organizations...`}/>;

  return (
    <Container maxWidth="md">
      <Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Data Export </Typography>

        <Dropdown
          key={'organizations'}
          label={'Organizations'}
          value={state.organizations}
          options={options.organizations}
          error={!!errors.organizations}
          helperText={
            errors.organizations
          }
          onChange={e => {
            setState(state => ({
                ...state, organizations: e.target.value
              })
            );
          }}
        />

        <SelectField
          key={'level'}
          label={'Level'}
          value={state.level}
          options={options.levels}
          error={!!errors.level}
          helperText={
            errors.level
          }
          noEmpty
          onChange={e => {
            setState(state => ({
                ...state, level: e.target.value, dataTypes: []
              })
            );
          }}
        />

        <Dropdown
          chooseAll
          key={'dataTypes'}
          label={'Data Types'}
          disabled={!state.level}
          value={state.dataTypes}
          options={options.dataTypes[state.level] || []}
          error={!!errors.dataTypes}
          helperText={
            errors.dataTypes
          }
          onChange={e => {
            setState(state => ({
                ...state, dataTypes: e.target.value
              })
            );
          }}
        />

        {/*<Dropdown*/}
        {/*  key={'properties'}*/}
        {/*  label={'Properties'}*/}
        {/*  value={state.properties}*/}
        {/*  options={options.properties}*/}
        {/*  error={!!errors.properties}*/}
        {/*  helperText={*/}
        {/*    errors.properties*/}
        {/*  }*/}
        {/*  onChange={e => {*/}
        {/*    setState(state => ({*/}
        {/*        ...state, properties: e.target.value*/}
        {/*      })*/}
        {/*    );*/}
        {/*  }}*/}
        {/*/>*/}

        <SelectField
          noEmpty
          key={'fileType'}
          label={'File Type'}
          value={state.fileType}
          options={options.fileTypes}
          error={!!errors.fileType}
          helperText={
            errors.fileType
          }
          onBlur={() => {
            if (!state.fileType) {
              setErrors(errors => ({...errors, fileType: 'The field cannot be empty'}));
            } else {
              setErrors(errors => ({...errors, fileType: null}));
            }
          }}
          onChange={e => {
            setState(state => ({
                ...state, fileType: e.target.value
              })
            );
          }}
        />


        <AlertDialog
          dialogContentText={state.loadingButton ? 'Please wait...' : "You won't be able to edit the information after clicking CONFIRM."}
          dialogTitle={state.loadingButton ? 'File upload in progress...' : 'Are you sure you want to submit?'}
          buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                            key={'cancel'}>{'cancel'}</Button>,
            <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                           key={'confirm'}
                           onClick={handleConfirm} children="confirm" autoFocus/>]}
          open={state.submitDialog}/>

        <AlertDialog
          dialogContentText={errorMessage.message}
          dialogTitle={errorMessage.title}
          buttons={[<Button onClick={() => setState(state => ({...state, errorDialog: false}))}
                            key={'cancel'} autoFocus>{'OK'}</Button>,]}
          open={state.errorDialog}/>


        <AlertDialog
          dialogContentText={state.traceOfUploading}
          dialogTitle={'Success'}
          buttons={[<Button onClick={() => {
            const file = new Blob([state.traceOfUploading], { type: 'text/plain' });
            saveAs(file, 'traceOfUploads.txt');
            setState(state => ({...state, success: false}));
            window.location.reload();
          }}
                            key={'Download file upload log'}>{'Download file upload log'}</Button>,
            <Button onClick={() => {
              setState(state => ({...state, success: false}));
              window.location.reload();
            }}
                    key={'ok'}>{'ok'}</Button>
          ]}
          open={state.success}/>

        <AlertDialog
          dialogContentText={state.traceOfUploading}
          dialogTitle={'Error'}
          buttons={[<Button onClick={() => {
            const file = new Blob([state.traceOfUploading], { type: 'text/plain' });
            saveAs(file, 'traceOfUploads.txt');
            setState(state => ({...state, fail: false}));
            window.location.reload();
          }}
                            key={'Download file upload log'}>{'Download file upload log'}</Button>,
            <Button onClick={() => {
              setState(state => ({...state, fail: false}));
              window.location.reload();
            }}
                    key={'ok'}>{'ok'}</Button>
          ]}
          open={state.fail}/>
      </Paper>



      <Paper sx={{p: 2}} variant={'outlined'}>
        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>
      </Paper>

    </Container>);

}