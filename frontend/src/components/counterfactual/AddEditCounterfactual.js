import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/dialogs/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import CounterFactualField from "../shared/fields/CounterFactualField";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, updateDataType} from "../../api/generalAPI";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
import {validateForm} from "../../helpers";

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


export default function AddEditCounterfactual() {
  const attriConfig = configs[CONFIGLEVEL].counterfactual

  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const classes = useStyles();
  const {uri, orgUri
    , operationMode} = useParams();
  const mode = uri? operationMode : 'new';
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);

  const attribute2Compass = {
    startTime: 'cids:hasTime',
    endTime: 'cids:hasTime',
    description: 'schema:description',
    locatedIns: 'iso21972:located_in',
    value:'iso21972:value',
  }

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );

  const [form, setForm] = useState({
    startTime: '',
    endTime: '',
    description: '',
    locatedIns: [],
    value:'',
    uri: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchDataType('counterfactual', encodeURIComponent(uri)).then(({success, counterfactual}) => {
        if(success){
          counterfactual.uri = counterfactual._uri;
          setForm(counterfactual);
          setLoading(false)
        }
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        setLoading(false);
        console.log('here')
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if(mode === 'edit' && (!uri || !orgUri) ) {
      navigate(-1);
      enqueueSnackbar("No URI or orgUri provided", {variant: 'error'});
    } else if (mode === 'new' && !orgUri){
      setLoading(false);
      // navigate(-1);
      // enqueueSnackbar("No orgId provided", {variant: 'error'});
    } else if (mode === 'new' && orgUri) {
      setForm(form => ({...form, organizations: [orgUri]}))
      setLoading(false);
    } else {
      navigate(-1);
      enqueueSnackbar('Wrong auth', {variant: 'error'})
    }

  }, [mode, uri]);

  const handleSubmit = () => {
    console.log(form)
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('counterfactual', {form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate(-1);
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e)
        enqueueSnackbar(e.json?.message || 'Error occurs when creating counterfactual', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateDataType('counterfactual', encodeURIComponent(uri), {form}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          // navigate(-1);
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        enqueueSnackbar(e.json?.message || 'Error occurs when updating outcome', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const errors = {};
    validateForm(form, attriConfig, attribute2Compass, errors, [])
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view'?
        (
          <Paper sx={{p: 2}} variant={'outlined'}>
            <Typography variant={'h4'}> Counterfactual </Typography>
            <Typography variant={'h6'}> {`Located In:`} </Typography>
            <Typography variant={'body1'}> {`${form.locatedIn || 'Not Given'}`} </Typography>
            <Typography variant={'h6'}> {`Time Interval:`} </Typography>
            <Typography variant={'body1'}> {(form.startTime && form.endTime)? `${(new Date(form.startTime)).toLocaleString()} to ${(new Date(form.endTime)).toLocaleString()}` : 'Not Given'} </Typography>
            <Typography variant={'h6'}> {`Description:`} </Typography>
            <Typography variant={'body1'}> {form.description || 'Not Given'} </Typography>
            <Typography variant={'h6'}> {`Value:`} </Typography>
            <Typography variant={'body1'}> {form.value || 'Not Given'} </Typography>


            <Button variant="contained" color="primary" className={classes.button} onClick={()=>{
              navigate(`/outcome/${encodeURIComponent(uri)}/edit`);
            }
            }>
              Edit
            </Button>

          </Paper>
        )
        : (<Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Counterfactual </Typography>
        <CounterFactualField
          disabled={mode === 'view'}
          disabledOrganization={!!orgUri}
          disableURI={mode !== 'new'}
          defaultValue={form}
          onChange={(state) => {
            setForm(form => ({...form, ...state}));
          }}
          importErrors={errors}
          attribute2Compass={attribute2Compass}
        />

        {mode==='view'?
          <div/>:
          <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
            Submit
          </Button>}

        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Counterfactual?' :
                       'Are you sure you want to update this outcome?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>)}
    </Container>);

}