import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import {reportErrorToBackend} from "../../api/errorReportApi";
import Dropdown from "./fields/MultiSelectField";
import {fetchDataTypeInterfaces} from "../../api/generalAPI";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
import {isFieldRequired, validateField, validateURI} from "../../helpers";


const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});


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

export default function StakeholderOutcomeField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, uriDiasbled, attribute2Compass}) {

  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({stakeholders: {}, codes: {}, organizations: {}, outcomes: {}, indicators: {}});
  const {enqueueSnackbar} = useSnackbar();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  const userContext = useContext(UserContext);

  const attriConfig = configs[CONFIGLEVEL].stakeholderOutcome;


  useEffect(() => {
    Promise.all([
      fetchDataTypeInterfaces('code'), fetchDataTypeInterfaces('organization'), fetchDataTypeInterfaces('stakeholder')
    ]).then(([codeRet, organizationRet, stakeholderRet]) => {

      setOptions(op => ({...op, stakeholders: stakeholderRet.interfaces, codes: codeRet.interfaces, organizations: organizationRet.interfaces}));
      setLoading(false)
    }).catch(([e1, e2, e3]) => {
      const errorJson = e1.json || e2.json || e3.json
      if (errorJson) {
        setErrors(errorJson)
      }
      reportErrorToBackend(errorJson)
      console.log(e1, e2, e3)
      enqueueSnackbar(errorJson?.message || 'Error occurs when fetching data', {variant: "error"});
      setLoading(false);
    })
  }, [])

  useEffect(() => {
      Promise.all([
        fetchDataTypeInterfaces('outcome'), fetchDataTypeInterfaces('indicator')
      ]).then(([outcomeRet, indicatorRet]) => {
        setOptions(op => ({...op, outcomes: outcomeRet.interfaces, indicators: indicatorRet.interfaces}));
      });
  }, [])

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  const handleChange = name => (e, value) => {
    if(name !== 'indicator'){
      setState(state => {
        state[name] = value ?? e.target.value;
        return state;
      });
    } else {
      setState(state => {
        state.indicator = value;
        state.unitOfMeasure = indicators[value]?.unitOfMeasure?.label;
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
                fullWidth
                label="Name"
                type="text"
                defaultValue={state.name}
                onChange={handleChange('name')}
                disabled={disabled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'name')}
                error={!!errors.name}
                helperText={errors.name}
                onBlur={validateField(defaultValue, attriConfig, 'name', attribute2Compass['name'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="URI"
                type="text"
                defaultValue={state.uri}
                onChange={handleChange('uri')}
                disabled={disabled || uriDiasbled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'uri')}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={validateURI(defaultValue, setErrors)}
              />
            </Grid>

            <Grid item xs={6}>
              <LoadingAutoComplete
                label="Stakeholder"
                options={options.stakeholders}
                state={state.stakeholder}
                onChange={handleChange('stakeholder')}
                error={!!errors.stakeholder}
                helperText={errors.stakeholder}
                required={isFieldRequired(attriConfig, attribute2Compass, 'stakeholder')}
                onBlur={validateField(defaultValue, attriConfig, 'stakeholder', attribute2Compass['stakeholder'], setErrors)}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingAutoComplete
                label="From Perspective Of"
                options={options.stakeholders}
                state={state.fromPerspectiveOf}
                onChange={handleChange('fromPerspectiveOf')}
                error={!!errors.fromPerspectiveOf}
                helperText={errors.fromPerspectiveOf}
                required={isFieldRequired(attriConfig, attribute2Compass, 'fromPerspectiveOf')}
                onBlur={validateField(defaultValue, attriConfig, 'fromPerspectiveOf', attribute2Compass['fromPerspectiveOf'], setErrors)}
              />
            </Grid>
            <Grid item xs={12}>
              <LoadingAutoComplete
                label={"Outcome"}
                options={options.outcomes}
                state={state.outcome}
                onChange={
                  handleChange('outcome')
                }
                disabled={!state.organization}
                error={!!errors.outcome}
                helperText={errors.outcome}
                required={isFieldRequired(attriConfig, attribute2Compass, 'outcome')}
                onBlur={validateField(defaultValue, attriConfig, 'outcome', attribute2Compass['outcome'], setErrors)}

              />
            </Grid>
            <Grid item xs={6}>
              <Dropdown
                label="Indicators"
                options={options.indicators}
                value={state.indicators}
                disabled={!state.organization}
                required={isFieldRequired(attriConfig, attribute2Compass, 'indicators')}
                onChange={(e) => {
                  setState(state => ({...state, indicators: e.target.value}));
                  const st = state;
                  st.indicators = e.target.value;
                  onChange(st);
                }
                }
                onBlur={validateField(defaultValue, attriConfig, 'indicators', attribute2Compass['indicators'], setErrors)}
              />
            </Grid>

            <Grid item xs={6}>
              <LoadingAutoComplete
                label="Intended Impact"
                options={{'Positive': 'positive', 'negative': 'negative', 'neutral': 'neutral'}}
                state={state.intendedImpact}
                onChange={handleChange('intendedImpact')}
                error={!!errors.intendedImpact}
                helperText={errors.intendedImpact}
                required={isFieldRequired(attriConfig, attribute2Compass, 'intendedImpact')}
                onBlur={validateField(defaultValue, attriConfig, 'intendedImpact', attribute2Compass['intendedImpact'], setErrors)}
              />
            </Grid>
            <Grid item xs={6}>
              <Dropdown
                label="Codes"
                options={options.codes}
                value={state.codes}
                onChange={(e) => {
                  setState(state => ({...state, codes: e.target.value}));
                  const st = state;
                  st.codes = e.target.value;
                  onChange(st);
                }
                }
                required={isFieldRequired(attriConfig, attribute2Compass, 'codes')}
                onBlur={validateField(defaultValue, attriConfig, 'codes', attribute2Compass['codes'], setErrors)}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingAutoComplete
                label={"Importance"}
                options={{'high importance': 'high importance', 'moderate': 'moderate'}}
                state={state.importance}
                onChange={
                  handleChange('importance')
                }
                error={!!errors.importance}
                helperText={errors.importance}
                required={isFieldRequired(attriConfig, attribute2Compass, 'importance')}
                onBlur={validateField(defaultValue, attriConfig, 'importance', attribute2Compass['importance'], setErrors)}

              />
            </Grid>
            <Grid item xs={3}>
              <LoadingAutoComplete
                label={"Is Underserved"}
                options={{true: 'true', false: 'false'}}
                state={state.isUnderserved}
                onChange={
                  handleChange('isUnderserved')
                }
                error={!!errors.isUnderserved}
                helperText={errors.isUnderserved}
                required={isFieldRequired(attriConfig, attribute2Compass, 'isUnderserved')}
                onBlur={validateField(defaultValue, attriConfig, 'isUnderserved', attribute2Compass['isUnderserved'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Description"
                type="text"
                defaultValue={state.description}
                onChange={handleChange('description')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'description')}
                disabled={disabled}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                minRows={2}
                onBlur={validateField(defaultValue, attriConfig, 'description', attribute2Compass['description'], setErrors)}
              />
            </Grid>


          </Grid>
        </>
      }
    </Paper>
  );
}
