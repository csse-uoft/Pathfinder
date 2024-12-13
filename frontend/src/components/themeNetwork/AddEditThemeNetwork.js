import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/dialogs/Dialogs";
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
import * as PropTypes from "prop-types";
import SelectField from "../shared/fields/SelectField";
import URIField from "../shared/fields/URIFields";

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


export default function AddEditThemeNetwork() {

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
    dateCreated: '',
    forOrganization: '',
    themeEdges: []
  });
  const [loading, setLoading] = useState(true);

  const [themeEdges, setThemeEdges] = useState({});
  const [organizations, setOrganizations] = useState({});



  useEffect(() => {
    fetchDataTypeInterfaces('Organization').then(({interfaces}) => {
      setOrganizations(interfaces);
    });
  }, []);

  useEffect(() => {
    fetchDataTypeInterfaces('hasSubThemePropertie').then(({interfaces}) => {
      setThemeEdges(interfaces);
    });
  }, []);


  useEffect(() => {
    if (mode === 'edit' && uri || mode === 'view') {
      fetchDataType('themeNetwork', encodeURIComponent(uri)).then(res => {
        if (res.success) {
          res.themeNetwork.uri = res.themeNetwork._uri
          setForm(
            res.themeNetwork
          );
          setLoading(false);
        }
      }).catch(e => {
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
        navigate('/themes');
      });
    } else if (mode === 'edit' && !uri) {
      navigate('/themeNetworks');
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
      createDataType('themeNetwork', {form}).then((ret) => {
          if (ret.success) {
            setState({loadingButton: false, submitDialog: false,});
            navigate('/themeNetworks');
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
      updateDataType('themeNetwork', encodeURIComponent(uri), {form}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/themeNetworks');
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
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const attribute2Compass = {
    name: 'cids:hasName',
    description: 'cids:hasDescription',
  };

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
        <Typography variant={'h4'}> Theme Network </Typography>

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

        <URIField
          add={mode === 'new'}
          edit={mode !== 'new'}
          key={'uri'}
          label={'URI'}
          value={form.uri}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.uri = e.target.value}
          error={!!errors.uri}
          helperText={errors.uri}
          onBlur={validateURI(form, setErrors)}
        />

        <SelectField
          key={'organization'}
          label={'Organization'}
          value={form.forOrganization}
          options={organizations}
          error={!!errors.forOrganization}
          helperText={
            errors.forOrganization
          }
          onChange={e => {
            setForm(form => ({
                ...form, forOrganization: e.target.value
              })
            );
          }}
        />

        <Dropdown
          label="themeEdges"
          options={themeEdges}
          key={`themeEdges`}
          value={form.themeEdges}
          sx={{mt: '16px', minWidth: 350}}
          onChange={(e) => {
            setForm(state => ({...state, themeEdges: e.target.value}));
          }
          }
          error={!!errors?.themeEdges}
          helperText={errors?.themeEdges}
          // required={isFieldRequired(attriConfig, attribute2Compass, 'siubthemes')}
          // onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}
        />

        <GeneralField
          fullWidth
          type={'date'}
          value={form.dateCreated}
          label={'Date Created'}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => {
            setForm(form => ({
                ...form, dateCreated: e.target.value
              })
            );
          }}
          error={!!errors.dateCreated}
          helperText={errors.dateCreated}
        />

        <GeneralField
          disabled={operationMode === 'view'}
          key={'description'}
          label={'Description'}
          value={form.description}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.description = e.target.value}
          error={!!errors.description}
          helperText={errors.description}
          multiline
          minRows={4}
        />


        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>

        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Theme Network?' :
                       'Are you sure you want to update this Theme Network?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>)}

    </Container>);

}