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
import Dropdown from "../shared/fields/MultiSelectField";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, updateDataType} from "../../api/generalAPI";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
import {isFieldRequired, validateField, validateURI} from "../../helpers";
import URIField from "../shared/URIFields";

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


export default function AddEditHowMuchImpact() {
  const attriConfig = configs[CONFIGLEVEL].howMuchImpact
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

  const [ops, setOps] = useState({
    counterfactuals: {},
    indicators: {},
  });

  const [form, setForm] = useState({
    counterfactuals: [],
    indicator: '',
    uri: '',
    subtype: '',
    value: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDataTypeInterfaces('counterfactual'), fetchDataTypeInterfaces('indicator')]).then(
      ([counterfactualRet, indicatorRet]) => {
        const options = ops;
        options["counterfactuals"] = counterfactualRet.interfaces
        options["indicators"] = indicatorRet.interfaces
        setOps(ops => ({...ops, options}));
        // setLoading(false);
      }
    ).catch(([e]) => {
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching data", {variant: 'error'});
    });

  }, []);

  useEffect(() => {
    if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchDataType('howMuchImpact', encodeURIComponent(uri)).then(({success, howMuchImpact}) => {
        if (success) {
          howMuchImpact.uri = howMuchImpact._uri;
          console.log(howMuchImpact)
          setForm(howMuchImpact);
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

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('howMuchImpact', {form}).then((ret) => {
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
        enqueueSnackbar(e.json?.message || 'Error occurs when creating indicator report', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit' && uri) {
      updateDataType('howMuchImpact', encodeURIComponent(uri), {form}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
          // navigate(`/impactReports/${encodeURIComponent(form.organization)}`);
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating howMuchImpact', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const attribute2Compass = {
    indicator: 'cids:forIndicator',
    value: 'iso21972:value',
    counterfactuals: 'cids:hasCounterfactual',
    startTime: 'cids:hasTime',
    endTime: 'cids:hasTime'
  }

  const validate = () => {
    const error = {};
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ? (
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> How Much Impact </Typography>
          <Typography variant={'h6'}> {`Description:`} </Typography>
          <Typography variant={'body1'}> {`${form.description || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          <Typography variant={'h6'}> {`Value:`} </Typography>
          <Typography variant={'body1'}> {`${form.value}`} </Typography>
          <Typography variant={'h6'}> {`Indicator:`} </Typography>
          <Typography variant={'body1'}> <Link to={`/indicator/${encodeURIComponent(form.indicator)}/view`} colorWithHover color={'#2f5ac7'}>{ops.indicators[form.indicator]}</Link> </Typography>
          <Typography variant={'h6'}> {`Time Interval:`} </Typography>
          <Typography variant={'body1'}> {(form.startTime && form.endTime)? `${(new Date(form.startTime)).toLocaleString()} to ${(new Date(form.endTime)).toLocaleString()}` : 'Not Given'} </Typography>

          <Typography variant={'h6'}> {`Counterfactuals:`} </Typography>

          {form.counterfactuals?.length?
            form.counterfactuals.map(counterfactual => <Typography variant={'body1'}> {<Link to={`/counterfactual/${encodeURIComponent(counterfactual)}/view`} colorWithHover
                                                                         color={'#2f5ac7'}>{ops.counterfactuals[counterfactual]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}



          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/impactReport/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>

        </Paper>
      ) : (<Paper sx={{p: 2, position: 'relative'}} variant={'outlined'}>
        <Typography variant={'h4'}> How Much Impact </Typography>

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

        <GeneralField
          key={'value'}
          label={'Value'}
          value={form.value}
          sx={{mt: '16px', minWidth: 350}}
          onChange={e => form.value = e.target.value}
          error={!!errors.value}
          helperText={errors.value}
          required={isFieldRequired(attriConfig, attribute2Compass, 'value')}
          onBlur={validateField(form, attriConfig, 'value', attribute2Compass['value'], setErrors)}
        />


        <SelectField
          key={'indicator'}
          label={'Indicator'}
          value={form.indicator}
          options={ops.indicators}
          error={!!errors.indicator}
          helperText={
            errors.indicator
          }
          onChange={e => {
            setForm(form => ({
                ...form, indicator: e.target.value
              })
            );
          }}
          required={isFieldRequired(attriConfig, attribute2Compass, 'indicator')}
          onBlur={validateField(form, attriConfig, 'indicator', attribute2Compass['indicator'], setErrors)}
        />

        <Dropdown
          label="Counterfactuals"
          key={'counterfactuals'}
          options={ops.counterfactuals}
          onChange={(e) => {
            form.counterfactuals = e.target.value
          }
          }
          value={form.counterfactuals}
          error={!!errors.counterfactuals}
          helperText={errors.counterfactuals}
          required={isFieldRequired(attriConfig, attribute2Compass, 'counterfactuals')}
          onBlur={validateField(form, attriConfig, 'counterfactuals', attribute2Compass['counterfactuals'], setErrors)}
        />

        <SelectField
          key={'subtype'}
          label={'Subtype'}
          value={form.subtype}
          options={{impactScale: 'Impact Scale', impactDepth: 'Impact Depth', impactDuration: 'impact Duration'}}
          error={!!errors.subtype}
          helperText={
            errors.subtype
          }
          disabled={mode === 'edit'}
          onChange={e => {
            setForm(form => ({
                ...form, subtype: e.target.value
              })
            );
          }}
        />

        <GeneralField
          fullWidth
          type={'datetime'}
          value={form.startTime}
          label={'Start Time'}
          disabled={form.subtype !== 'impactDuration'}
          error={!!errors.startTime}
          helperText={errors.startTime}
          onChange={e => {
            setForm(form => ({
                ...form, startTime: e.target.value
              })
            );
          }}
          required={isFieldRequired(attriConfig, attribute2Compass, 'startTime')}
          onBlur={validateField(form, attriConfig, 'startTime', attribute2Compass['startTime'], setErrors)}
        />

        <GeneralField
          fullWidth
          type={'datetime'}
          value={form.endTime}
          label={'End Time'}
          disabled={form.subtype !== 'impactDuration'}
          error={!!errors.endTime}
          helperText={errors.endTime}
          onChange={e => {
            setForm(form => ({
                ...form, endTime: e.target.value
              })
            );
          }}
          required={isFieldRequired(attriConfig, attribute2Compass, 'endTime')}
          onBlur={validateField(form, attriConfig, 'endTime', attribute2Compass['endTime'], setErrors)}
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