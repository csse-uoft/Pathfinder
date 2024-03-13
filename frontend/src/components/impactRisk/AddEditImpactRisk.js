import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import GeneralField from "../shared/fields/GeneralField";
import SelectField from "../shared/fields/SelectField";
import {createDataType, fetchDataType, updateDataType} from "../../api/generalAPI";
import {isFieldRequired, validateField, validateForm, validateURI} from "../../helpers";
import {fullLevelConfig} from "../../helpers/attributeConfig";
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


export default function AddEditImpactRisk() {
  const attriConfig = fullLevelConfig.impactRisk
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const classes = useStyles();
  const {uri, orgUri, operationMode} = useParams();
  const mode = uri ? operationMode : 'new';
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const ops = {

    'Evidence Risk': 'Evidence Risk',
    'External Risk': 'External Risk',
    'Stakeholder Participation Risk': 'Stakeholder Participation Risk',
    'Drop Off Risk': 'Drop Off Risk',
    'Efficiency Risk': 'Efficiency Risk',
    'Execution Risk': 'Execution Risk',
    'Alignment Risk': 'Alignment Risk',
    'Endurance Risk': 'Endurance Risk',
    'Unexpected Impact Risk': 'Unexpected Impact Risk'

  }

  const [form, setForm] = useState({
    hasIdentifier: '',
    uri: '',
  });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchDataType('impactRisk', encodeURIComponent(uri)).then(({success, impactRisk}) => {
        if (success) {
          impactRisk.uri = impactRisk._uri;
          console.log(impactRisk)
          setForm(impactRisk);
          setLoading(false);
        }
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        reportErrorToBackend(e);
        setLoading(false);
        navigate(-1);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (mode === 'edit' && (!uri || !orgUri)) {
      navigate(-1);
      enqueueSnackbar("No URI or orgUri provided", {variant: 'error'});
    } else if (mode === 'new' && !orgUri) {
      setLoading(false);
      // navigate(-1);
      // enqueueSnackbar("No orgId provided", {variant: 'error'});
    } else if (mode === 'new' && orgUri) {
      setForm(form => ({...form, organization: orgUri}));
      setLoading(false);
    } else {
      navigate(-1);
      enqueueSnackbar('Wrong auth', {variant: 'error'});
    }

  }, [mode, uri]);

  const handleSubmit = () => {
    if (validate()) {
      console.log(form);
      setState(state => ({...state, submitDialog: true}));
    }
  };
  const attribute2Compass = {
    hasIdentifier:'tove_org:hasIdentifier',
 
  }
  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('impactRisk', {form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate(-1);
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating Impact risk', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateDataType('impactRisk', encodeURIComponent(uri), {form}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating ImpactRisk', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const error = {};
    validateForm(form, attriConfig, attribute2Compass, error, ['uri'])
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ? (
        <Paper sx={{p: 2}} variant={'outlined'}>

          <Typography variant={'h6'}> {`Identifier:`} </Typography>
          <Typography variant={'body1'}> {`${form.hasIdentifier || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>


          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/impactReport/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>

        </Paper>
      ) : (<Paper sx={{p: 2, position: 'relative'}} variant={'outlined'}>
        <Typography variant={'h4'}> Impact Risk </Typography>

        <SelectField
          key={'hasIdentifier'}
          label={'Identifier'}
          value={form.hasIdentifier}
          options={ops}
          error={!!errors.hasIdentifier}
          helperText={
            errors.hasIdentifier
          }
          onChange={e => {
            setForm(form => ({
                ...form, hasIdentifier: e.target.value
              })
            );
          }}
          required={isFieldRequired(attriConfig, attribute2Compass, 'hasIdentifier')}
          onBlur={validateField(form, attriConfig, 'hasIdentifier', attribute2Compass['hasIdentifier'], setErrors)}
        />

        <GeneralField
          key={'uri'}
          label={'URI'}
          value={form.uri}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.uri = e.target.value}
          error={!!errors.uri}
          helperText={errors.uri}
          onBlur={validateURI(form, setErrors)}
        />


        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>


        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Impact Model?' :
                       'Are you sure you want to update this Impact Model?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>)}

    </Container>);

}