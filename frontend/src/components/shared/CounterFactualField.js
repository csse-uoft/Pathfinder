import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {UserContext} from "../../context";
import Dropdown from "./fields/MultiSelectField";
import GeneralField from "./fields/GeneralField";
import {fetchDataTypeInterfaces} from "../../api/generalAPI";
import {isFieldRequired, validateField} from "../../helpers";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
import URIField from "./URIFields";


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

export default function CounterFactualField({
                                              defaultValue,
                                              onChange,
                                              label,
                                              disabled,
                                              importErrors,
                                              disableURI,
                                              attribute2Compass,
                                            }) {

  const [state, setState] = useState(defaultValue || {});

  const attriConfig = configs[CONFIGLEVEL].counterfactual

  const [options, setOptions] = useState({features: {}});

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({...importErrors});


  const userContext = useContext(UserContext);


  useEffect(() => {
    Promise.all([
      fetchDataTypeInterfaces('feature').then(({success, interfaces}) => {
        if (success) {
          setOptions(op => ({...op, features: interfaces}));
        }
      })
    ]).then(() => setLoading(false));

  }, []);
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
                onBlur={validateField(state, attriConfig, 'locatedIns', attribute2Compass['locatedIns'], setErrors)}
              />
            </Grid>
            <Grid item xs={12}>
              <URIField
                add={!disableURI}
                edit={disableURI}
                sx={{mt: 2, minWidth: 775}}
                label="URI"
                value={state.uri}
                onChange={handleChange('uri')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'uri')}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={validateField(state, attriConfig, 'uri', attribute2Compass['uri'], setErrors)}
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
                onBlur={validateField(state, attriConfig, 'startTime', attribute2Compass['startTime'], setErrors)}
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
                onBlur={validateField(state, attriConfig, 'endTime', attribute2Compass['endTime'], setErrors)}
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Value"
                type="text"
                value={state.value}
                disabled={disabled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'value')}
                onChange={handleChange('value')}
                onBlur={validateField(state, attriConfig, 'value', attribute2Compass['value'], setErrors)}
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
                onBlur={validateField(state, attriConfig, 'description', attribute2Compass['description'], setErrors)}
              />
            </Grid>


          </Grid>
        </>
      }
    </Paper>
  );
}
