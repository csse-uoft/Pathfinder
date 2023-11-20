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

export default function CounterFacutalField({
                                       defaultValue,
                                       required,
                                       onChange,
                                       label,
                                       disabled,
                                       importErrors,
                                     }) {

  const [state, setState] = useState(defaultValue || {});

  const [options, setOptions] = useState({themes: {}, indicators: {}, codes: {}, outcomes: {}, partOf: {}});

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});


  const userContext = useContext(UserContext);


  useEffect(() => {
    Promise.all([
      fetchThemes()
        .then(res => {
          if (res.success)
            res.themes.map(
              theme => {
                options.themes[theme._uri] = theme.name;
              }
            );
        }),
      fetchOrganizationsInterfaces().then(({success, organizations}) => {
        if (success) {
          const options = {};
          organizations.map(organization => {
            // only organization which the user serves as an editor should be able to add
            options[organization._uri] = organization.legalName;
          });
          setOptions(op => ({...op, organization: options}));
        }
      }),
      fetchCodesInterfaces().then(({success, codesInterfaces}) => {
        if (success) {
          setOptions(op => ({...op, codes: codesInterfaces}));
        }
      }),
      fetchFeatureInterfaces().then(({success, featuresInterfaces}) => {
        if (success) {
          setOptions(op => ({...op, features: featuresInterfaces}))
        }
      })
    ]).then(() => setLoading(false));

  }, []);

  useEffect(() => {
    if (state.organization) {
      Promise.all([fetchIndicators(encodeURIComponent(state.organization)), fetchImpactModelInterfaces(encodeURIComponent(state.organization))]).
      then(([{indicators}, {impactModelInterfaces}]) => {
        const inds = {};
        indicators.map(indicator => {
          inds[indicator._uri] = indicator.name;
        });
        setOptions(ops => ({...ops, indicators: inds, partOf: impactModelInterfaces}));
      })
    }

      if (state.organization) {
          fetchOutcomes(encodeURIComponent(state.organization)).then(({success, outcomes}) => {
              if (success) {
                  const outs = {};
                  outcomes.map(outcome => {
                      outs[outcome._uri] = outcome.name;
                  });
                  setOptions(ops => ({...ops, outcomes: outs}));
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
                required={required}
              />
            </Grid>
              
            <Grid item xs={3}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.startTime}
                label={'Start Time'}
                minWidth={187}
                onChange={handleChange('startTime')}
                required={required}
                disabled={disabled}
                error={!!errors.startTime}
                helperText={errors.startTime}
                onBlur={() => {
                  if (!state.startTime) {
                    setErrors(errors => ({...errors, startTime: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, startTime: null}));
                  }
                }
                }
              />
            </Grid>

            <Grid item xs={3}>
              <GeneralField
                fullWidth
                type={'datetime'}
                value={state.endTime}
                label={'End Time'}
                minWidth={187}
                onChange={handleChange('endTime')}
                required={required}
                disabled={disabled}
                error={!!errors.endTime}
                helperText={errors.endTime}
                onBlur={() => {
                  if (!state.endTime) {
                    setErrors(errors => ({...errors, endTime: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, endTime: null}));
                  }
                }
                }
              />
            </Grid>

            <Dropdown
            label="Stakeholders"
            key={'stakeholders'}
            value={form.stakeholders}
            onChange={e => {
              form.stakeholders = e.target.value;
            }}
            options={options.stakeholders}
            error={!!errors.stakeholders}
            helperText={errors.stakeholders}
            // sx={{mb: 2}}
          />
          
            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Description"
                type="text"
                defaultValue={state.description}
                onChange={handleChange('description')}
                required={required}
                disabled={disabled}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                minRows={4}
                onBlur={() => {
                  if (!state.description) {
                    setErrors(errors => ({...errors, description: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, description: null}));
                  }
                }
                }
              />
            </Grid>


            <GeneralField
            disabled={!userContext.isSuperuser}
            key={'Value'}
            label={'Value'}
            value={form.Value}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.Value = e.target.value}
            error={!!errors.Value}
            helperText={errors.Value}
          />


          </Grid>
        </>
      }
    </Paper>
  );
}
