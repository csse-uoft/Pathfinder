import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {UserContext} from "../../context";
import {useSnackbar} from "notistack";
import GeneralField from "./fields/GeneralField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import Dropdown from "./fields/MultiSelectField";
import {fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
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

export default function IndicatorReportField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, uriDiasbled, attribute2Compass}) {

  const [state, setState] = useState(
    defaultValue ||
    {});

  const [options, setOptions] = useState({
    datasets: {}, organization: {}
  });
  const [indicators, setIndicators] = useState({})
  const {enqueueSnackbar} = useSnackbar();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});

  const userContext = useContext(UserContext);

  const attriConfig = configs[CONFIGLEVEL].indicatorReport;


  useEffect(() => {
    fetchDataTypeInterfaces('dataset').then(({success, interfaces}) => {
      if(success) {
        setOptions(op => ({...op, datasets: interfaces}));
      }
    })
  }, []);


  useEffect(() => {
    fetchDataTypeInterfaces('organization').then(({success, interfaces}) => {
      if (success) {
        setOptions(op => ({...op, organization: interfaces}));
        return interfaces;
      }
    }).then((organizations) => {
        Promise.all(Object.keys(organizations).map(organizationUri => {
          return fetchDataTypeInterfaces('indicator', encodeURIComponent(organizationUri)).then(({success, interfaces}) => {
            if (success) {
              setOptions(op => ({
                  ...op,
                  [organizationUri]: interfaces
                })
              );
              setIndicators(interfaces)
            }
          });
        })).then(() => {
          setLoading(false);
          setOptions(op => {
            return op
          })
        }).catch(e => {
          if (e.json) {
            setErrors(e.json);
          }
          console.log(e);
          reportErrorToBackend(e)
          enqueueSnackbar(e.json?.message || 'Error occurs when fetching data', {variant: "error"});
          setLoading(false);
        });
      }
    ).catch(e => {
      if (e.json) {
        setErrors(e.json);
      }
      reportErrorToBackend(e)
      console.log(e);
      enqueueSnackbar(e.json?.message || 'Error occurs when fetching data', {variant: "error"});
      setLoading(false);
    });

  }, []);

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  const handleChange = name => (e, value) => {
    console.log(name)
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
                required={isFieldRequired(attriConfig, attribute2Compass, 'uri')}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={validateURI(defaultValue, setErrors)}
              />
            </Grid>


            <Grid item xs={4}>
            <TextField
              sx={{mt: 2}}
              fullWidth
              label="Numerical Value"
              type="text"
              defaultValue={state.numericalValue}
              onChange={handleChange('numericalValue')}
              disabled={disabled}
              required={isFieldRequired(attriConfig, attribute2Compass, 'numericalValue')}
              error={!!errors.numericalValue}
              helperText={errors.numericalValue}
              onBlur={validateField(defaultValue, attriConfig, 'numericalValue', attribute2Compass['numericalValue'], setErrors)}
            />
            </Grid>


            <Grid item xs={4}>
              <LoadingAutoComplete
                label="Organization"
                options={options.organization}
                state={state.organization}
                onChange={handleChange('organization')}
                error={!!errors.organization}
                helperText={errors.organization}
                required={isFieldRequired(attriConfig, attribute2Compass, 'organization')}
                disabled={disabled || disabledOrganization}
                onBlur={validateField(defaultValue, attriConfig, 'organization', attribute2Compass['organization'], setErrors)}
              />
            </Grid>
            <Grid item xs={4}>
              <LoadingAutoComplete
                label={"Indicator"}
                disabled={disabled || !state.organization}
                options={state.organization? options[state.organization]: []}
                state={state.organization? state.indicator: null}
                onChange={
                  handleChange('indicator')
                }
                error={!!errors.indicator}
                helperText={errors.indicator}
                required={isFieldRequired(attriConfig, attribute2Compass, 'indicator')}
                onBlur={validateField(defaultValue, attriConfig, 'indicator', attribute2Compass['indicator'], setErrors)}
              />
            </Grid>
            <Grid item xs={3}>
              <GeneralField
                sx={{mt: 2}}
                fullWidth
                label={"Unit Of Measure"}
                value={state.unitOfMeasure}
                required={isFieldRequired(attriConfig, attribute2Compass, 'unitOfMeasure')}
                disabled={disabled}
                error={!!errors.unitOfMeasure}
                helperText={errors.unitOfMeasure}
                minWidth={187}
                onChange={handleChange('unitOfMeasure')}
                onBlur={validateField(defaultValue, attriConfig, 'unitOfMeasure', attribute2Compass['unitOfMeasure'], setErrors)}
              />
            </Grid>
            <Grid item xs={4}>
              <GeneralField
                fullWidth
                type={'date'}
                value={state.dateCreated}
                label={'Date Created'}
                onChange={handleChange('dateCreated')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'dateCreated')}
                disabled={disabled}
                error={!!errors.dateCreated}
                helperText={errors.dateCreated}
                minWidth={187}
                onBlur={validateField(defaultValue, attriConfig, 'dateCreated', attribute2Compass['dateCreated'], setErrors)}
              />
            </Grid>
            <Grid item xs={4}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.startTime}
                label={'Start Time'}
                minWidth={187}
                onChange={handleChange('startTime')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'startTime')}
                disabled={disabled}
                error={!!errors.startTime}
                helperText={errors.startTime}
                onBlur={validateField(defaultValue, attriConfig, 'startTime', attribute2Compass['startTime'], setErrors)}
              />
            </Grid>

            <Grid item xs={4}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.endTime}
                label={'End Time'}
                minWidth={187}
                onChange={handleChange('endTime')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'endTime')}
                disabled={disabled}
                error={!!errors.endTime}
                helperText={errors.endTime}
                onBlur={validateField(defaultValue, attriConfig, 'endTime', attribute2Compass['endTime'], setErrors)}
              />
            </Grid>
            <Grid item xs={12}>
              <Dropdown
                label="Has Access"
                key={'hasAccesss'}
                options={options.organization}
                onChange={(e) => {
                  setState(state => ({...state, hasAccesss: e.target.value}));
                  const st = state;
                  st.hasAccesss = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.hasAccesss}
                error={!!errors.hasAccesss}
                helperText={errors.hasAccesss}
                required={isFieldRequired(attriConfig, attribute2Compass, 'hasAccesss')}
                onBlur={validateField(defaultValue, attriConfig, 'hasAccesss', attribute2Compass['hasAccesss'], setErrors)}
              />
            </Grid>
            <Grid item xs={12}>
              <Dropdown
                label="Datasets"
                key={'datasets'}
                options={options.datasets}
                onChange={(e) => {
                  setState(state => ({...state, datasets: e.target.value}));
                  const st = state;
                  st.datasets = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.datasets}
                error={!!errors.datasets}
                helperText={errors.datasets}
                required={isFieldRequired(attriConfig, attribute2Compass, 'datasets')}
                onBlur={validateField(defaultValue, attriConfig, 'datasets', attribute2Compass['datasets'], setErrors)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Comment"
                type="text"
                defaultValue={state.comment}
                onChange={handleChange('comment')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'comment')}
                disabled={disabled}
                error={!!errors.comment}
                helperText={errors.comment}
                multiline
                minRows={2}
                onBlur={validateField(defaultValue, attriConfig, 'comment', attribute2Compass['comment'], setErrors)}
              />
            </Grid>


          </Grid>
        </>
      }
    </Paper>
  );
}
