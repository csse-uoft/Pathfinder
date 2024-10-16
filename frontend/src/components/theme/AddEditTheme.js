import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isFieldRequired, validateField, validateURI, validateForm} from "../../helpers";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, updateDataType} from "../../api/generalAPI";
import Dropdown from "../shared/fields/MultiSelectField";
import {fetchCodesInterfaces} from "../../api/codeAPI";
import DataTypeGraph from "../shared/dataTypeGraph";

const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
}));


export default function AddEditTheme() {

  const classes = useStyles();
  const userContext = useContext(UserContext);
  const {uri, operationMode} = useParams();
  const mode = uri ? operationMode : 'new';
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const {enqueueSnackbar} = useSnackbar();

  const attriConfig = configs[CONFIGLEVEL].theme;


  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const [form, setForm] = useState({
    name: '',
    uri: '',
    description: '',
    subThemeRelationships: [{organizations: [], subThemes: []}],
    codes: []
  });
  const [loading, setLoading] = useState(true);

  const [codes, setCodes] = useState({});

  const [subThemes, setSubThemes] = useState({});

  const [organizations, setOrganizations] = useState({});

  useEffect(() => {
    fetchCodesInterfaces().then(({success, interfaces}) => {
      if (success) {
        setCodes(interfaces);
      }
    });
  }, []);

  useEffect(() => {
    fetchDataTypeInterfaces('Theme').then(({interfaces}) => {
      delete interfaces[form.uri];
      setSubThemes(interfaces);
    });
  }, []);

  useEffect(() => {
    fetchDataTypeInterfaces('Organization').then(({interfaces}) => {
      setOrganizations(interfaces);
    });
  }, []);


  useEffect(() => {
    if (mode === 'edit' && uri || mode === 'view') {
      fetchDataType('theme', encodeURIComponent(uri)).then(res => {
        if (res.success) {
          setForm({
            name: res.theme.name,
            description: res.theme.description,
            uri: res.theme._uri,
            codes: res.theme.codes || [],
            subThemeRelationships: res.theme.subThemeRelationships?.length ? res.theme.subThemeRelationships : [{
              organizations: [],
              subThemes: []
            }]
          });
          setLoading(false);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
        navigate('/themes');
      });
    } else if (mode === 'edit' && !uri) {
      navigate('/organizations');
      enqueueSnackbar("No URI provided", {variant: 'error'});
    } else if (mode === 'new') {
      setLoading(false);
    }
  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('theme', {form}).then((ret) => {
          if (ret.success) {
            setState({loadingButton: false, submitDialog: false,});
            navigate('/themes');
            enqueueSnackbar(ret.message || 'Success', {variant: "success"});
          }
        }
      ).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating theme', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      updateDataType('theme', encodeURIComponent(uri), {form}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/themes');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating the theme', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const errors = {};
    validateForm(form, attriConfig, attribute2Compass, errors, ['uri']);
    form.subThemeRelationships.map((relationship, index) => {
      if (index && (!relationship.organizations.length || !relationship.subThemes.length)) {
        if (!errors.subThemeRelationships) {
          errors.subThemeRelationships = {[index]: {}};
        }
        if (!relationship.organizations.length) {
          errors.subThemeRelationships[index].organizations = 'Blank value is not valid';
        }
        if (!relationship.subThemes.length) {
          errors.subThemeRelationships[index].subThemes = 'Blank value is not valid';
        }
      }
      if (!index && ((relationship.organizations.length && !relationship.subThemes.length) || (!relationship.organizations.length && relationship.subThemes.length))) {
        if (!errors.subThemeRelationships) {
          errors.subThemeRelationships = {[index]: {}};
        }
        if (!relationship.organizations.length) {
          errors.subThemeRelationships[index].organizations = 'Blank value is not valid';
        }
        if (!relationship.subThemes.length) {
          errors.subThemeRelationships[index].subThemes = 'Blank value is not valid';
        }
      }
    });
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const attribute2Compass = {
    name: 'cids:hasName',
    description: 'cids:hasDescription',
  };

  function SubThemeRelationships({id}) {
    return <div style={{paddingTop: '10px'}}>
      <div style={{paddingTop: '20px', paddingBottom: '20px', border: '2px solid lightgray'}}>
        <Dropdown
          label="Organizations"
          key={`organization_${id}`}
          options={organizations}
          value={form.subThemeRelationships[id].organizations}
          sx={{mt: '16px', minWidth: 350}}
          onChange={(e) => {
            const relationships = form.subThemeRelationships;
            relationships[id].organizations = e.target.value;
            setForm(state => ({...state, subThemeRelationships: relationships}));
          }
          }
          error={!!errors?.subThemeRelationships?.[id]?.organizations}
          helperText={errors?.subThemeRelationships?.[id]?.organizations}
          // required={isFieldRequired(attriConfig, attribute2Compass, 'subthemes')}
          // onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}
        />
        <Dropdown
          label="subThemes"
          options={subThemes}
          key={`subThemes_${id}`}
          value={form.subThemeRelationships[id].subThemes}
          sx={{mt: '16px', minWidth: 350}}
          onChange={(e) => {
            const relationships = form.subThemeRelationships;
            relationships[id].subThemes = e.target.value;
            setForm(state => ({...state, subThemeRelationships: relationships}));
          }
          }
          error={!!errors?.subThemeRelationships?.[id]?.subThemes}
          helperText={errors?.subThemeRelationships?.[id]?.subThemes}
          // required={isFieldRequired(attriConfig, attribute2Compass, 'siubthemes')}
          // onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}

        />
      </div>

      {id === form.subThemeRelationships.length - 1 ?
        <div>
          <Button onClick={() => {
            const relationships = form.subThemeRelationships;
            relationships.push({organizations: [], subThemes: []});
            setForm(state => ({...state, subThemeRelationships: relationships}));
          }
          }> Add Relationship </Button>

          {id > 0 ? <Button onClick={() => {
            const relationships = form.subThemeRelationships;
            relationships.pop();
            setForm(state => ({...state, subThemeRelationships: relationships}));
          }
          }> Remove </Button> : null}
        </div>
        : null}
    </div>;

  }

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ? (
        <Paper sx={{p: 2}} variant={'outlined'}>

          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          <Typography variant={'h6'}> {`description:`} </Typography>
          <Typography variant={'body1'}> {form.description} </Typography>
          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/themes/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>

        </Paper>
      ) : (<Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Theme </Typography>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{flex: 0.5}}>
            <GeneralField
              disabled={operationMode === 'view'}
              key={'name'}
              label={'Name'}
              value={form.name}
              required={isFieldRequired(attriConfig, attribute2Compass, 'name')}
              sx={{mt: '16px', minWidth: 350}}
              onChange={e => form.name = e.target.value}
              error={!!errors.name}
              helperText={errors.name}
              onBlur={validateField(form, attriConfig, 'name', attribute2Compass['name'], setErrors)}
            />

            <GeneralField
              disabled={mode !== 'new'}
              key={'uri'}
              label={'URI'}
              value={form.uri}
              sx={{mt: '16px', minWidth: 350}}
              onChange={e => form.uri = e.target.value}
              error={!!errors.uri}
              helperText={errors.uri}
              onBlur={validateURI(form, setErrors)}
            />

            <Dropdown
              label="Codes"
              options={codes}
              value={form.codes}
              sx={{mt: '16px', minWidth: 350}}
              onChange={(e) => {
                setForm(state => ({...state, codes: e.target.value}));
              }
              }
              required={isFieldRequired(attriConfig, attribute2Compass, 'codes')}
              onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}

            />

            <Typography variant={'h5'} sx={{marginTop: '20px'}}> SubTheme Relationships </Typography>
            {
              form.subThemeRelationships.map((relationship, id) => <SubThemeRelationships id={id}/>)
            }


            <GeneralField
              disabled={operationMode === 'view'}
              key={'description'}
              label={'Description'}
              value={form.description}
              sx={{mt: '16px', minWidth: 350}}
              onChange={e => form.description = e.target.value}
              error={!!errors.description}
              helperText={errors.description}
              required={isFieldRequired(attriConfig, attribute2Compass, 'description')}
              multiline
              minRows={4}
              onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}
            />
          </div>

          <div style={{ flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
            <DataTypeGraph Theme/>
          </div>
        </div>



        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>


        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Theme?' :
                       'Are you sure you want to update this Theme?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>)}

    </Container>);

}