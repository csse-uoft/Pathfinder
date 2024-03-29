import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import Dropdown from "./fields/MultiSelectField";
import {fetchOrganizationsInterfaces, fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {isValidURL} from "../../helpers/validation_helpers";


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
  const [options, setOptions] = useState({})
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
                onBlur={() => {
                  if (!state.unitOfMeasure) {
                    setErrors(errors => ({...errors, unitOfMeasure: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, unitOfMeasure: null}));
                  }
                }
                }
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
                onBlur={() => {
                  if (!state.description) {
                    setErrors(errors => ({...errors, description: 'This field cannot be empty'}));
                  }else {
                    setErrors(errors => ({...errors, description: null}));
                  }
                }
                }
              />
            </Grid>
          </Grid>
        </>
      }
    </Paper>
  );
}