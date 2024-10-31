import React, {useEffect, useState, useContext} from 'react';
import {Autocomplete, Button, Grid, Paper, TextField, Typography} from "@mui/material";
import {createFilterOptions} from '@mui/material/Autocomplete';
import Dropdown from "./fields/MultiSelectField";
import {UserContext} from "../../context";
import GeneralField from "./fields/GeneralField";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {fetchDataTypeInterfaces} from "../../api/generalAPI";
import {fullLevelConfig} from "../../helpers/attributeConfig";
import {isFieldRequired, validateField, validateURI} from "../../helpers";
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

export default function IndicatorField({
                                         defaultValue,
                                         required,
                                         onChange,
                                         label,
                                         disabled,
                                         importErrors,
                                         disabledOrganization,
                                         disabledURI,
                                         attribute2Compass
                                       }) {

  const [state, setState] = useState(defaultValue || {});
  const [options, setOptions] = useState({});
  const [stakeholderOptions, setStakeholderOptions] = useState({});
  const [datasetOptions, setDatasetOptions] = useState({});
  const [subIndicatorOptions, setSubIndicatorOptions] = useState({});
  const userContext = useContext(UserContext);
  const [codesInterfaces, setCodesInterfaces] = useState({});

  const [errors, setErrors] = useState({...importErrors});

  const attriConfig = fullLevelConfig.indicator;

  function SubIndicatorRelationships({id}) {
    return <div style={{ paddingTop: '10px' }}>
      <div style={{paddingTop: '20px', paddingBottom: '20px', border: '2px solid lightgray'}}>
        <Dropdown
          label="Organizations"
          key={`organization_${id}`}
          options={options}
          value={state.subIndicatorRelationships[id].organizations}
          sx={{mt: '16px', minWidth: 350}}
          onChange={(e) => {
            const relationships = state.subIndicatorRelationships;
            relationships[id].organizations = e.target.value;

            setState(state => ({...state, subIndicatorRelationships: relationships}));
            const st = state;
            st.subIndicatorRelationships = relationships;
            onChange(st);
          }
          }
          error={!!errors?.subIndicatorRelationships?.[id]?.organizations}
          helperText={errors?.subIndicatorRelationships?.[id]?.organizations}
          // required={isFieldRequired(attriConfig, attribute2Compass, 'subthemes')}
          // onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}
        />
        <Dropdown
          label="subIndicators"
          options={subIndicatorOptions}
          key={`subIndicators_${id}`}
          value={state.subIndicatorRelationships[id].subIndicators}
          sx={{mt: '16px', minWidth: 350}}
          onChange={(e) => {
            // const relationships = state.subIndicatorRelationships;
            // relationships[id].subIndicators = e.target.value;
            // setState(state => ({...state, subIndicatorRelationships: relationships}));
            // const st = state;
            // st.subIndicatorRelationships = relationships;
            // onChange(st);
            state.subIndicatorRelationships[id].subIndicators = e.target.value
          }
          }
          error={!!errors?.subIndicatorRelationships?.[id]?.subIndicators}
          helperText={errors?.subIndicatorRelationships?.[id]?.subIndicators}
          twoLayerLabels
          // required={isFieldRequired(attriConfig, attribute2Compass, 'siubthemes')}
          // onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}

        />
      </div>

      {id === state.subIndicatorRelationships.length - 1 ?
        <div>
          <Button onClick={() => {
            const relationships = state.subIndicatorRelationships;
            relationships.push({organizations: [], subIndicators: []});
            setState(state => ({...state, subIndicatorRelationships: relationships}));
            const st = state;
            st.subIndicatorRelationships = relationships;
            onChange(st);
          }
          }> Add Relationship</Button>

          {id > 0 ? <Button onClick={() => {
            const relationships = state.subIndicatorRelationships;
            relationships.pop();
            setState(state => ({...state, subIndicatorRelationships: relationships}));
            const st = state;
            st.subIndicatorRelationships = relationships;
            onChange(st);
          }
          }> Remove </Button> : null}
        </div>
        : null}
    </div>;

  }


  useEffect(() => {
    fetchDataTypeInterfaces('code').then(({success, interfaces}) => {
      if (success) {
        setCodesInterfaces(interfaces);
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occur when fetching code interface", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchDataTypeInterfaces('indicator').then(({success, interfaces}) => {
      if (success) {
        delete interfaces[state.uri];
        const uri2uri = {}
        for (let uri in interfaces) {
          uri2uri[uri] = uri
        }
        setSubIndicatorOptions({uri: uri2uri, name: interfaces});
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occur when fetching indicator interface", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    setErrors({...importErrors});
  }, [importErrors]);

  useEffect(() => {
    fetchDataTypeInterfaces('organization').then(({success, interfaces}) => {
      if (success) {
        setOptions(interfaces);
      }
    });
  }, []);

  useEffect(() => {
    fetchDataTypeInterfaces('dataset').then(({success, interfaces}) => {
      if (success) {
        setDatasetOptions(interfaces);
      }
    });
  }, []);


  useEffect(() => {
    fetchDataTypeInterfaces('stakeholder').then(({success, interfaces}) => {
      if (success) {
        setStakeholderOptions(interfaces);
      }
    });
  }, []);

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
      {label ? <Typography variant="h5">
        {label}
      </Typography> : <div/>}
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
                required={isFieldRequired(attriConfig, attribute2Compass, 'name')}
                error={!!errors.name}
                helperText={errors.name}
                onBlur={validateField(defaultValue, attriConfig, 'name', attribute2Compass['name'], setErrors)}
              />
            </Grid>

            <Grid item xs={12}>
              <URIField
                add={!(disabled || disabledURI)}
                edit={disabled || disabledURI}
                label="URI"
                sx={{mt: '16px', minWidth: 350}}
                value={state.uri}
                onChange={handleChange('uri')}
                required={isFieldRequired(attriConfig, attribute2Compass, 'uri')}
                error={!!errors.uri}
                helperText={errors.uri}
                onBlur={validateURI(defaultValue, setErrors)}
              />
            </Grid>
            <Typography variant={'h5'}  sx={{ marginTop: '20px' }}> SubTheme Relationships </Typography>
            <Grid item xs={12}>
              {
                state.subIndicatorRelationships.map((relationship, id) => <SubIndicatorRelationships id={id}/>
                )
              }
            </Grid>
            <Grid item xs={12}>
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
            <Grid item xs={12}>
              <TextField
                sx={{mt: 2}}
                fullWidth
                label="Identifier"
                type="text"
                defaultValue={state.identifier}
                onChange={handleChange('identifier')}
                disabled={disabled}
                required={isFieldRequired(attriConfig, attribute2Compass, 'identifier')}
                error={!!errors.identifier}
                helperText={errors.identifier}
                onBlur={validateField(defaultValue, attriConfig, 'identifier', attribute2Compass['identifier'], setErrors)}
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
                required={isFieldRequired(attriConfig, attribute2Compass, 'organization')}
                disabled={disabled}
                onBlur={validateField(defaultValue, attriConfig, 'organization', attribute2Compass['organization'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
              <Dropdown
                label="Access"
                key={'Access'}
                options={options}
                onChange={(e) => {
                  setState(state => ({...state, accesss: e.target.value}));
                  const st = state;
                  st.accesss = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.accesss}
                error={!!errors.accesss}
                helperText={errors.accesss}
                required={isFieldRequired(attriConfig, attribute2Compass, 'accesss')}
                disabled={disabled}
                onBlur={validateField(defaultValue, attriConfig, 'accesss', attribute2Compass['accesss'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
              <Dropdown
                label="Codes"
                key={'codes'}
                options={codesInterfaces}
                onChange={(e) => {
                  setState(state => ({...state, codes: e.target.value}));
                  const st = state;
                  st.codes = e.target.value;
                  onChange(st);
                }
                }
                fullWidth
                value={state.codes}
                error={!!errors.codes}
                helperText={errors.codes}
                required={isFieldRequired(attriConfig, attribute2Compass, 'codes')}
                disabled={disabled}
                onBlur={validateField(defaultValue, attriConfig, 'codes', attribute2Compass['codes'], setErrors)}

              />
            </Grid>

            <Grid item xs={12}>
              <Dropdown
                label="Datasets"
                key={'datasets'}
                options={datasetOptions}
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
                disabled={disabled}
                onBlur={validateField(defaultValue, attriConfig, 'datasets', attribute2Compass['datasets'], setErrors)}

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
                required={isFieldRequired(attriConfig, attribute2Compass, 'unitOfMeasure')}
                error={!!errors.unitOfMeasure}
                helperText={errors.unitOfMeasure}
                onBlur={validateField(defaultValue, attriConfig, 'unitOfMeasure', attribute2Compass['unitOfMeasure'], setErrors)}

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
                required={isFieldRequired(attriConfig, attribute2Compass, 'baseline')}
                error={!!errors.baseline}
                helperText={errors.baseline}
                onBlur={validateField(defaultValue, attriConfig, 'baseline', attribute2Compass['baseline'], setErrors)}

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
                required={isFieldRequired(attriConfig, attribute2Compass, 'threshold')}
                error={!!errors.threshold}
                helperText={errors.threshold}
                onBlur={validateField(defaultValue, attriConfig, 'threshold', attribute2Compass['threshold'], setErrors)}

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