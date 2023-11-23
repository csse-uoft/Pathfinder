import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import CounterFactualField from "../shared/CounterFactualField";
import {createOutcome, fetchOutcome, updateOutcome} from "../../api/outcomeApi";
import {navigate, navigateHelper} from "../../helpers/navigatorHelper";
import {createCounterfactual, fetchCounterfactual} from "../../api/counterfactualApi";

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
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const classes = useStyles();
  const {uri, orgUri
    , operationMode} = useParams();
  const mode = uri? operationMode : 'new';
  const {enqueueSnackbar} = useSnackbar();
  const userContext = useContext(UserContext);

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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchCounterfactual(encodeURIComponent(uri)).then(({success, counterfactual}) => {
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
      createCounterfactual({form}).then((ret) => {
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
      updateOutcome({form}, encodeURIComponent(uri)).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate(-1);
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
    const error = {};
    // if (!form.locatedIns)
    //   error.locatedIns = 'The field cannot be empty';
    // if (!form.indicators.length)
    //   error.indicators = 'The field cannot be empty';
    // if (!form.outcomes.length)
    //   error.outcomes = 'The field cannot be empty';
    // if (!form.locatedIn)
    //   error.locatedIn = 'The field cannot be empty';

    // if (!form.themes.length)
    //   error.themes = 'The field cannot be empty';
    // if (!form.description)
    //   error.description = 'The field cannot be empty'
    // if(form.uri && !isValidURL(form.uri))
    //   error.uri = 'Not a valid URI';
    // if (!form.dateCreated)
    //   error.dateCreated = 'The field cannot be empty';

    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view'?
        (
          <Paper sx={{p: 2}} variant={'outlined'}>
            <Typography variant={'h6'}> {`Located In:`} </Typography>
            <Typography variant={'body1'}> {`${form.locatedIn || 'Not Given'}`} </Typography>
            <Typography variant={'h6'}> {`Time Interval:`} </Typography>
            <Typography variant={'body1'}> {(form.startTime && form.endTime)? `${(new Date(form.startTime)).toLocaleString()} to ${(new Date(form.endTime)).toLocaleString()}` : 'Not Given'} </Typography>
            <Typography variant={'h6'}> {`Description:`} </Typography>
            <Typography variant={'body1'}> {`${form.description}`} </Typography>
            <Typography variant={'h6'}> {`Value:`} </Typography>
            <Typography variant={'body1'}> {`${form.value}`} </Typography>


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
          required
          onChange={(state) => {
            setForm(form => ({...form, ...state}));
          }}
          importErrors={errors}
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