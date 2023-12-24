import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import GeneralField from "./fields/GeneralField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {fetchHowMuchImpacts} from "../../api/howMuchImpactApi";
import {fetchImpactRisks} from "../../api/impactRiskApi";
import Dropdown from "./fields/MultiSelectField";
import {fetchDataTypeInterfaces} from "../../api/generalAPI";
import {isFieldRequired, validateField, validateForm, validateURI, validateFieldAndURI} from "../../helpers";
import {fullLevelConfig} from "../../helpers/attributeConfig";

const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});

const attribute2Compass = {
  stakeholders: 'cids:forStakeholder',
  codes: 'cids:hasCode',
  name: 'cids:hasName',
  comment: 'cids:hasComment',
  forStakeholderOutcome:'cids:forOutcome',
  forOrganization: 'cids:forOrganization',
  impactScale: 'cids:hasImpactScale',
  impactDepth: 'cids:hasImpactDepth',
  impactDuration: 'cids:hasImpactDuration',
  hasTime: 'time:hasTime',
  reportedImpact: 'cids:hasReportedImpact',
  expectation: 'cids:hasExpectation',
  impactRisks: 'cids:hasImpactRisk',

}

function LoadingAutoComplete({
                               label,
                               options,
                               state,
                               onChange,
                               disabled,
                               error,
                               helperText,
                               required,
                               onBlur
                             }) {
  return (
    <Autocomplete
      sx={{mt: 2}}
      options={Object.keys(options)}
      getOptionLabel={(key) => options[key]}
      fullWidth
      value={state}
      onChange={onChange}
      disabled={disabled}
      filterOptions={filterOptions}
      renderInput={(params) =>
        <TextField
          {...params}
          required={required}
          label={label}
          disabled={disabled}
          error={error}
          helperText={helperText}
          onBlur={onBlur}
        />
      }
    />
  );
}

export default function ImpactReportField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, uriDiasbled}) {
  const attriConfig = fullLevelConfig.characteristic
  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({
    organizations : {},stakeholderOutcomes: {}, indicators: {}, impactScales: {}, impactDepths: {}, impactDurations: {}, impactRisks: {}
  });

  const {enqueueSnackbar} = useSnackbar();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  const userContext = useContext(UserContext);
  const [form, setForm] = useState({
    name: '',
    comment: '',
    impactScale: null,
    impactDepth: null,
    impactDuration: null,
    forStakeholderOutcome: null,
    reportedImpact: null,
    organization: null,
    impactRisks: null,
    startTime: '',
    endTime: '',
    uri: '',
  });

  useEffect(() => {
    Promise.all([fetchHowMuchImpacts('ImpactScale'), fetchHowMuchImpacts('ImpactDepth'), fetchHowMuchImpacts('ImpactDuration'), fetchImpactRisks()])
      .then(([impactScaleRet, impactDepthRet, impactDurationRet, {impactRisks}]) => {
        const impactScales = {};
        const impactDepths = {};
        const impactDurations = {};
        const impactRisksDict = {}
        if (impactScaleRet.howMuchImpacts.length) {
          impactScaleRet.howMuchImpacts.map(impactScale => {
            impactScales[impactScale._uri] = impactScale.description || impactScale._uri
          })
        }
        if (impactDepthRet.howMuchImpacts.length) {
          impactDepthRet.howMuchImpacts.map(impactDepth => {
            impactDepths[impactDepth._uri] = impactDepth.description || impactDepth._uri
          })
        }
        if (impactDurationRet.howMuchImpacts.length) {
          impactDurationRet.howMuchImpacts.map(impactDuration => {
            impactDurations[impactDuration._uri] = impactDuration.description || impactDuration._uri
          })
        }
        if (impactRisks.length) {
          impactRisks.map(impactRisk => {
            impactRisksDict[impactRisk._uri] = impactRisk.hasIdentifier || impactRisk._uri
          })
        }
        setOptions(ops => ({...ops, impactScales, impactDepths, impactDurations, impactRisks: impactRisksDict}))
      }).catch()
  }, [])


  useEffect(() => {
    fetchDataTypeInterfaces('organization').then(({success, interfaces}) => {
      if (success) {
        setOptions(op => ({...op, organization: interfaces}));
        setLoading(false);
      }
    }).catch(e => {
      if (e.json) {
        setErrors(e.json);
      }
      reportErrorToBackend(e)
      console.log(e);
      enqueueSnackbar(e.json?.message || 'Error occurs when fetching organizations', {variant: "error"});
      setLoading(false);
    });

  }, []);

  useEffect(() => {
    if (state.organization) {
      fetchDataTypeInterfaces('stakeholderOutcome', encodeURIComponent(state.organization)).then(({interfaces}) => {
        console.log(interfaces)
        setOptions(ops => ({...ops, stakeholderOutcomes: interfaces}))
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e)
        console.log(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when fetching outcomes', {variant: "error"});
      })
    }

  }, [state.organization])

  useEffect(() => {
    if (state.organization) {
      fetchDataTypeInterfaces('indicator', encodeURIComponent(state.organization)).then(({interfaces}) => {
        setOptions(ops => ({...ops, indicators: interfaces}))
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e)
        console.log(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when fetching indicators', {variant: "error"});
      })
    }

  }, [state.organization])

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  const handleChange = name => (e, value) => {
    if(name !== 'outcome') {
      setState(state => {
        state[name] = value ?? e.target.value;
        return state;
      });
    } else {
      setState(state => {
        state.outcome = value;
        state.unitOfMeasure = outcomes[value]?.unitOfMeasure?.label;
        return state
      });
    }
    // state[name] = value ?? e.target.value;
    onChange(state);
  };

  return (
    <Paper variant="outlined" sx={{mt: 3, mb: 3, p: 2.5, borderRadius: 2}}>
      <Typography variant="h5">
        {loading && <CircularProgress color="inherit" size={20}/>} {label}
      </Typography>
      {!loading &&
        <>
          <Grid container columnSpacing={2}>
            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                key={'name'}
                fullWidth
                label="Name"
                type="text"
                defaultValue={state.name}
                onChange={handleChange('name')}
                disabled={disabled}
                error={!!errors.name}
                helperText={errors.name}
                required={isFieldRequired(attriConfig, attribute2Compass, 'name')}
                onBlur={validateField(form, attriConfig, 'name', attribute2Compass['name'], setErrors)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                key={'uri'}
                sx={{mt: 2}}
                fullWidth
                label="URI"
                type="text"
                defaultValue={state.uri}
                onChange={handleChange('uri')}
                disabled={disabled}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={validateURI(form, setErrors)}
              />
            </Grid>

            
            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Organization"
                key={'organization'}
                options={options.organizations}
                state={state.organization}
                onChange={handleChange('organization')}
                error={!!errors.organization}
                helperText={errors.organization}
                disabled={disabled || disabledOrganization}
                required={isFieldRequired(attriConfig, attribute2Compass, 'organization')}
                onBlur={validateFieldAndURI(form, attriConfig,'organization',attribute2Compass['organization'], setErrors)}
              />
            </Grid>
            <Grid item xs={4}>
              <LoadingAutoComplete
                key={'stakeholdersoutcome'}
                label={"Stakeholder Outcome"}
                disabled={disabled}
                options={options.stakeholderOutcomes}
                state={state.forStakeholderOutcome}
                onChange={
                  handleChange('forStakeholderOutcome')
                }
                error={!!errors.forStakeholderOutcome}
                helperText={errors.forStakeholderOutcome}
                required={isFieldRequired(attriConfig, attribute2Compass, 'stakeholdersoutcome')}
                onBlur={validateField(form, attriConfig, 'stakeholdersoutcome', attriConfig['stakeholdersoutcome'], setErrors)}

              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                key = {'impactscale'}
                label={"Impact Scale"}
                options={options.impactScales}
                state={state.impactScale}
                onChange={
                  handleChange('impactScale')
                }
                error={!!errors.impactScale}
                helperText={errors.impactScale}
                required={isFieldRequired(attriConfig, attribute2Compass, 'impactscale')}
                onBlur={validateField(form, attriConfig, 'impactscale', attriConfig['impactscale'], setErrors)}
              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                key = {'impactdepth'}
                label={"Impact Depth"}
                options={options.impactDepths}
                state={state.impactDepth}
                onChange={
                  handleChange('impactDepth')
                }
                error={!!errors.impactDepth}
                helperText={errors.impactDepth}
                required={isFieldRequired(attriConfig, attribute2Compass, 'impactdepth')}
                onBlur={validateField(form, attriConfig, 'impactdepth', attriConfig['impactdepth'], setErrors)}
              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                key = {'impactduration'}
                sx={{mt: 2}}
                label={"Impact Duration"}
                options={options.impactDurations}
                state={state.impactDuration}
                onChange={handleChange('impactDuration')}
                error={!!errors.impactDuration}
                helperText={errors.impactDuration}
                required={isFieldRequired(attriConfig, attribute2Compass, 'impactduration')}
                onBlur={validateField(form, attriConfig, 'impactduration', attriConfig['impactduration'], setErrors)}
              />
            </Grid>

            <Grid item xs={4}>
              <LoadingAutoComplete
                key = {'reportedimpact'}
                label="Reported Impact"
                options={{"positive": "positive", "negative": "negative", "neutral": "neutral"}}
                onChange={handleChange('reportedImpact')}
                value={state.reportedImpact}
                disabled={disabled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'reportedimpact')}
                onBlur={validateField(form, attriConfig, 'reportedimpact', attriConfig['reportedimpact'], setErrors)}
              />
            </Grid>

        
            <Grid item xs={3}>
              <GeneralField

                fullWidth
                key = {'startdate'}
                type={'datetime'}
                value={state.startTime}
                label={'Start Time'}
                minWidth={187}
                onChange={handleChange('startTime')}
                disabled={disabled}
                error={!!errors.startTime}
                helperText={errors.startTime}
                required={isFieldRequired(attriConfig, attribute2Compass, 'startdate')}
                onBlur={validateField(form, attriConfig, 'startdate', attriConfig['startdate'], setErrors)}
              />
            </Grid>

            <Grid item xs={3}>
              <GeneralField
                fullWidth
                key = {'enddate'}
                type={'datetime'}
                value={state.endTime}
                label={'End Time'}
                minWidth={187}
                onChange={handleChange('endTime')}
                disabled={disabled}
                error={!!errors.endTime}
                helperText={errors.endTime}
                required={isFieldRequired(attriConfig, attribute2Compass, 'enddate')}
                onBlur={validateField(form, attriConfig, 'enddate', attriConfig['enddate'], setErrors)}
              />
            </Grid>
            <Grid item xs={6}>
              <Dropdown
                key = {'impactrisk'}
                sx={{mt: 2}}
                label={"Impact Risk"}
                options={options.impactRisks}
                state={state.impactRisk}
                onChange={(e) => {
                  setState(state => ({...state, impactRisks: e.target.value}));
                  const st = state;
                  st.impactRisks = e.target.value;
                  onChange(st);
                }
                }
                error={!!errors.impactRisks}
                helperText={errors.impactRisks}
                required={isFieldRequired(attriConfig, attribute2Compass, 'impactrisk')}
                onBlur={validateField(form, attriConfig, 'impactrisk', attriConfig['impactrisk'], setErrors)}
              />


              
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                sx={{mt: 2}}
                key={'expectation'}
                label="Expectation"
                type="text"
                defaultValue={state.expectation}
                onChange={handleChange('expectation')}
                disabled={disabled}
                error={!!errors.expectation}
                helperText={errors.expectation}
                multiline
                minRows={4}
                required={isFieldRequired(attriConfig, attribute2Compass, 'expectation')}
                onBlur={validateField(form, attriConfig, 'expectation', attriConfig['expectation'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                key={'comment'}
                fullWidth
                label="Comment"
                type="text"
                defaultValue={state.comment}
                onChange={handleChange('comment')}
                disabled={disabled}
                error={!!errors.comment}
                helperText={errors.comment}
                multiline
                minRows={5}
                required={isFieldRequired(attriConfig, attribute2Compass, 'comment')}
                onBlur={validateField(form, attriConfig, 'comment', attriConfig['comment'], setErrors)}
              />
            </Grid>


          </Grid>
        </>
      }
    </Paper>
  );
}
