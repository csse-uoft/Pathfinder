import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, CircularProgress, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import {UserContext} from "../../context";
import Dropdown from "./fields/MultiSelectField";
import GeneralField from "./fields/GeneralField";
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

export default function CounterFactualField({
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
      fetchFeatureInterfaces().then(({success, featuresInterfaces}) => {
        if (success) {
          setOptions(op => ({...op, features: featuresInterfaces}))
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
                required={required}
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

            <Grid item xs={4}>
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

            <Grid item xs={4}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Value"
                type="text"
                value={state.value}
                disabled={disabled}
                required={required}
                onChange={handleChange('value')}
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
                //   } else {
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
