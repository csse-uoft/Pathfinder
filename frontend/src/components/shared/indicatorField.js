import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import Dropdown from "./fields/MultiSelectField";
import {fetchOrganizationsInterfaces, fetchOrganizations} from "../../api/organizationApi";
import {fetchStakeholderInterfaces, fetchStakeholders} from "../../api/stakeholderAPI";
import {UserContext} from "../../context";
import {isValidURL} from "../../helpers/validation_helpers";
import GeneralField from "./fields/GeneralField";


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
      options={Object.keys(options)}
      getOptionLabel={(key) => options[key]}
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

export default function IndicatorField({defaultValue, required, onChange, label, disabled, importErrors, disabledOrganization, disabledURI}) {

  const [state, setState] = useState(defaultValue || {});
  const [options, setOptions] = useState({});
  const [stakeholderOptions, setStakeholderOptions] = useState({});
  const userContext = useContext(UserContext);

  const [errors, setErrors] = useState({...importErrors});


  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  useEffect(() => {
    fetchOrganizationsInterfaces().then(({success, organizations}) => {
      if(success) {
        const options ={};
        organizations.map(organization => {
          // felt out the organization this user serves as the editor
          options[organization._uri] = organization.legalName;
        })
        setOptions(options)

      }
    })
  }, []);


  useEffect(() => {
        fetchStakeholders().then(({success, stakeholders}) => {
            if(success) {
                //console.log("stakeholders")
                //console.log(stakeholders);
                const options = {};
                stakeholders.map(stakeholder => {
                    options[stakeholder._uri] = stakeholder.name;
                })
                setStakeholderOptions(options);
            }
        })
    }, [])

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
      {label? <Typography variant="h5">
        {label}
      </Typography>: <div/>}
      {
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
                required={required}
                error={!!errors.name}
                helperText={errors.name}
                onBlur={() => {
                  if (!state.name) {
                    setErrors(errors => ({...errors, name: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, name: null}));
                  }
                }
                }
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
                disabled={disabled || disabledURI}
                required={required}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={() => {
                  if (state.uri && !isValidURL(state.uri)) {
                    setErrors(errors => ({...errors, uri: 'Invalid URI'}));
                  }else {
                    setErrors(errors => ({...errors, uri: null}));
                  }
                }
                }
              />
            </Grid>
              <Grid item xs={4}>
                  <GeneralField
                      fullWidth
                      type={'date'}
                      value={state.dateCreated}
                      label={'Date Created'}
                      onChange={handleChange('dateCreated')}
                      required={required}
                      disabled={disabled}
                      error={!!errors.dateCreated}
                      helperText={errors.dateCreated}
                      minWidth={187}
                      onBlur={() => {
                          if (!state.dateCreated) {
                              setErrors(errors => ({...errors, dateCreated: 'This field cannot be empty'}));
                          } else {
                              setErrors(errors => ({...errors, dateCreated: null}));
                          }
                      }
                      }
                  />
              </Grid>
              <Grid item xs={8}>
                  <TextField
                      sx={{mt: 2}}
                      fullWidth
                      label="Identifier"
                      type="text"
                      defaultValue={state.identifier}
                      onChange={handleChange('identifier')}
                      disabled={disabled}
                      required={required}
                      error={!!errors.identifier}
                      helperText={errors.identifier}
                      onBlur={() => {
                          if (!state.identifier) {
                              setErrors(errors => ({...errors, identifier: 'This field cannot be empty'}));
                          } else {
                              setErrors(errors => ({...errors, identifier: null}));
                          }
                      }
                      }
                  />
              </Grid>

            <Grid item xs={12}>
              <LoadingAutoComplete
                key={'organization'}
                label={"Organization"}
                options={options}
                property={'organization'}
                state={state}
                onChange={handleChange}
                error={!!errors.organization}
                helperText={errors.organization}
                required={required}
                disabled={disabled}
                onBlur={() => {
                  if (!state.organization) {
                    setErrors(errors => ({...errors, organization: 'This field cannot be empty'}));
                  } else {
                    setErrors(errors => ({...errors, organization: null}));
                  }
                }
                }
              />
            </Grid>

              <Grid item xs={12}>
                  <Dropdown
                      label="Access"
                      key={'Access'}
                      options={options}
                      onChange={(e) => {
                          setState(state => ({...state, access: e.target.value}));
                          const st = state;
                          st.access = e.target.value;
                          onChange(st);
                      }
                      }
                      fullWidth
                      value={state.access}
                      error={!!errors.access}
                      helperText={errors.access}
                      required={required}
                      disabled={disabled}
                      // onBlur={() => {
                      //     if (!state.outcomes) {
                      //         setErrors(errors => ({...errors, outcomes: 'This field cannot be empty'}));
                      //     } else {
                      //         setErrors(errors => ({...errors, outcomes: null}));
                      //     }
                      // }
                      // }
                  />
              </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Unit of Measure"
                type="text"
                defaultValue={state.unitOfMeasure}
                onChange={handleChange('unitOfMeasure')}
                disabled={disabled}
                required={required}
                error={!!errors.unitOfMeasure}
                helperText={errors.unitOfMeasure}
                // onBlur={() => {
                //   if (!state.unitOfMeasure) {
                //     setErrors(errors => ({...errors, unitOfMeasure: 'This field cannot be empty'}));
                //   }else {
                //     setErrors(errors => ({...errors, unitOfMeasure: null}));
                //   }
                // }
                // }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Baseline"
                type="text"
                defaultValue={state.baseline}
                onChange={handleChange('baseline')}
                disabled={disabled}
                required={required}
                error={!!errors.baseline}
                helperText={errors.baseline}
                // onBlur={() => {
                //   if (!state.baseline) {
                //     setErrors(errors => ({...errors, baseline: 'This field cannot be empty'}));
                //   }else {
                //     setErrors(errors => ({...errors, baseline: null}));
                //   }
                // }
                // }
              />
            </Grid>
              <Grid item xs={12}>
                  <TextField
                      sx={{mt: 2}}
                      fullWidth
                      label="Threshold"
                      type="text"
                      defaultValue={state.threshold}
                      onChange={handleChange('threshold')}
                      disabled={disabled}
                      required={required}
                      error={!!errors.threshold}
                      helperText={errors.threshold}
                      // onBlur={() => {
                      //     if (!state.threshold) {
                      //         setErrors(errors => ({...errors, threshold: 'This field cannot be empty'}));
                      //     }else {
                      //         setErrors(errors => ({...errors, threshold: null}));
                      //     }
                      // }
                      // }
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
                required={required}
                disabled={disabled}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                minRows={4}
                // onBlur={() => {
                //   if (!state.description) {
                //     setErrors(errors => ({...errors, description: 'This field cannot be empty'}));
                //   }else {
                //     setErrors(errors => ({...errors, description: null}));
                //   }
                // }
                // }
              />
            </Grid>
          </Grid>
        </>
      }
    </Paper>
  );
}