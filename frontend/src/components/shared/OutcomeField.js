import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {fetchThemes} from "../../api/themeApi";
import {fetchOutcomes} from "../../api/outcomeApi";
import {fetchOrganizations, fetchOrganizationsInterfaces} from "../../api/organizationApi";
import {UserContext} from "../../context";
import Dropdown from "./fields/MultiSelectField";
import {fetchIndicators} from "../../api/indicatorApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {fetchCodesInterfaces} from "../../api/codeAPI";
import GeneralField from "./fields/GeneralField";
import {fetchImpactModelInterfaces} from "../../api/impactModelAPI";
import {fetchFeatureInterfaces} from "../../api/featureAPI";
import {fetchDataTypeInterfaces} from "../../api/generalAPI";
import {fullLevelConfig} from "../../helpers/attributeConfig";
import {isFieldRequired, validateField, validateURI} from "../../helpers";


const filterOptions = createFilterOptions({
  ignoreAccents: false,
  matchFrom: 'start'
});


function LoadingAutoComplete({
                               label,
                               options,
                               property,
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
      options={Object.keys(options[property])}
      getOptionLabel={(key) => options[property][key]}
      fullWidth
      disabled={disabled}
      value={state[property]}
      onChange={onChange(property)}
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

export default function OutcomeField({
                                       defaultValue,
                                       required,
                                       onChange,
                                       label,
                                       disableURI,
                                       disabled,
                                       importErrors,
                                       attribute2Compass
                                     }) {

  const [state, setState] = useState(defaultValue || {});

  const [options, setOptions] = useState({themes: {}, indicators: {}, codes: {}, outcomes: {}, partOf: {}});

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});


  const userContext = useContext(UserContext);

  const attriConfig = fullLevelConfig.outcome;


  useEffect(() => {
    Promise.all([
      fetchDataTypeInterfaces('theme')
        .then(res => {
          if (res.success)
            options.themes = res.interfaces;
        }),
      fetchDataTypeInterfaces('organization').then(({success, interfaces}) => {
        if (success) {
          setOptions(op => ({...op, organization: interfaces}));
        }
      }),
      fetchCodesInterfaces().then(({success, interfaces}) => {
        if (success) {
          setOptions(op => ({...op, codes: interfaces}));
        }
      }),
      fetchFeatureInterfaces().then(({success, interfaces}) => {
        if (success) {
          setOptions(op => ({...op, features: interfaces}));
        }
      })
    ]).then(() => setLoading(false));

  }, []);

  useEffect(() => {
    if (state.organization) {
      Promise.all([fetchDataTypeInterfaces('indicator', encodeURIComponent(state.organization)), fetchDataTypeInterfaces('impactModel', encodeURIComponent(state.organization))]).then(([indicatorRet, impactModelRet]) => {
        setOptions(ops => ({...ops, indicators: indicatorRet.interfaces, partOf: impactModelRet.interfaces}));
      });
    }

    if (state.organization) {
      fetchDataTypeInterfaces('outcome', encodeURIComponent(state.organization)).then(({success, interfaces}) => {
        if (success) {
          setOptions(ops => ({...ops, outcomes: interfaces}));
        }
      });
    }
  }, [state.organization]);
  //   console.log(options)
  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  const handleChange = name => (e, value) => {
    setState(state => {
      state[name] = value ?? e.target.value;
      return state;
    });
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
                disabled={disabled || disableURI}
                required={isFieldRequired(attriConfig, attribute2Compass, 'uri')}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={validateURI(defaultValue, setErrors)}
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

            <Grid item xs={8}>
              <Dropdown
                label="Located In"
                key={'locatedIn'}
                options={options.features}
                onChange={(e) => {
                  setState(state => ({...state, locatedIns: e.target.value}));
                  const st = state;
                  st.locatedIns = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.locatedIns}
                error={!!errors.locatedIns}
                helperText={errors.locatedIns}
                required={isFieldRequired(attriConfig, attribute2Compass, 'locatedIns')}
                onBlur={validateField(defaultValue, attriConfig, 'locatedIns', attribute2Compass['locatedIns'], setErrors)}
              />
            </Grid>
            <Grid item xs={6}>
              <Dropdown
                label="Themes"
                options={options.themes}
                value={state.themes}
                onChange={(e) => {
                  setState(state => ({...state, themes: e.target.value}));
                  const st = state;
                  st.themes = e.target.value;
                  onChange(st);
                }
                }
                // error={!!errors.themes}
                // helperText={errors.themes}
                disabled={disabled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'themes')}
                onBlur={validateField(defaultValue, attriConfig, 'themes', attribute2Compass['themes'], setErrors)}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingAutoComplete
                key={'organization'}
                label={"Organization"}
                options={options}
                property={'organization'}
                state={state}
                onChange={handleChange}
                error={!!errors.organization}
                helperText={errors.organization}
                required={isFieldRequired(attriConfig, attribute2Compass, 'organization')}
                disabled={disabled}
                onBlur={validateField(defaultValue, attriConfig, 'organization', attribute2Compass['organization'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
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
                minWidth={775}
                disabled={disabled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'codes')}
                onBlur={validateField(defaultValue, attriConfig, 'codes', attribute2Compass['codes'], setErrors)}

              />
            </Grid>
            <Grid item xs={12}>
              <Dropdown
                label="Indicators"
                key={'indicators'}
                options={options.indicators}
                onChange={(e) => {
                  setState(state => ({...state, indicators: e.target.value}));
                  const st = state;
                  st.indicators = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.indicators}
                error={!!errors.indicators}
                helperText={errors.indicators}
                required={isFieldRequired(attriConfig, attribute2Compass, 'indicators')}
                disabled={disabled || !state.organization}
                onBlur={validateField(defaultValue, attriConfig, 'indicators', attribute2Compass['indicators'], setErrors)}

              />
            </Grid>
            <Grid item xs={12}>
              <LoadingAutoComplete
                key={'partOf'}
                label={"Part Of"}
                options={options}
                property={'partOf'}
                state={state}
                onChange={handleChange}
                error={!!errors.partOf}
                helperText={errors.partOf}
                required={isFieldRequired(attriConfig, attribute2Compass, 'partOf')}
                disabled={!state.organization}
                onBlur={validateField(defaultValue, attriConfig, 'partOf', attribute2Compass['partOf'], setErrors)}

              />
            </Grid>
            <Grid item xs={12}>
              <Dropdown
                label="Can Produce"
                key={'CanProduce'}
                options={options.outcomes}
                onChange={(e) => {
                  setState(state => ({...state, canProduces: e.target.value}));
                  const st = state;
                  st.canProduces = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.canProduces}
                error={!!errors.canProduces}
                helperText={errors.canProduces}
                required={isFieldRequired(attriConfig, attribute2Compass, 'canProduces')}
                disabled={disabled || !state.organization}
                onBlur={validateField(defaultValue, attriConfig, 'canProduces', attribute2Compass['canProduces'], setErrors)}

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
                minRows={4}
                onBlur={validateField(defaultValue, attriConfig, 'description', attribute2Compass['description'], setErrors)}

              />
            </Grid>


          </Grid>
        </>
      }
    </Paper>
  );
}
