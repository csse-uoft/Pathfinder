import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";

import {useSnackbar} from "notistack";
import Dropdown from "../shared/fields/MultiSelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {updateCharacteristic} from "../../api/characteristicApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces,} from "../../api/generalAPI";
import {fullLevelConfig} from "../../helpers/attributeConfig";
import {isFieldRequired, validateField, validateForm, validateURI} from "../../helpers";
const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginLeft: 10,
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
  link: {
    marginTop: 20,
    marginLeft: 15,
    color: '#007dff',
  }
}));


export default function AddEditCharacteristic() {

  const attriConfig = fullLevelConfig.characteristic
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const classes = useStyles();
  const userContext = useContext(UserContext);
  const {uri, viewMode} = useParams();
  const mode = uri ? viewMode : 'new';
  const {enqueueSnackbar} = useSnackbar();

  const [state, setState] = useState({
    submitDialog: false,
    loadingButton: false,
  });
  const [errors, setErrors] = useState(
    {}
  );


  const [form, setForm] = useState({
    stakeholders: [],
    codes: [],
    name: '',
    value: ''
  });
  // const [outcomeForm, setOutcomeForm] = useState([
  // ]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    stakeholders: {},
    codes: {}
  });


  useEffect(() => {

    Promise.all([
      fetchDataTypeInterfaces('code').then(({interfaces, success}) => {
        if (success) {
          setOptions(options => ({...options, codes: interfaces}));
        }
      }),
      fetchDataTypeInterfaces('stakeholder').then(({interfaces, success}) => {
        if (success) {
          setOptions(options => ({...options, stakeholders: interfaces}));
        }
      })
    ]).then(() => {
      if ((mode === 'edit' || mode === 'view') && uri) {
        fetchDataType('characteristic', encodeURIComponent(uri)).then(res => {
          if (res.success) {
            const {characteristic} = res;
            setForm({...characteristic, uri: characteristic._uri});
            setLoading(false);
          }
        }).catch(e => {
            if (e.json)
              setErrors(e.json);
            console.log(e);
            setLoading(false);
            reportErrorToBackend(e);
            enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
          }
        );
      } else if ((mode === 'edit' || mode === 'view') && !uri) {
        navigate('/characteristics');
        enqueueSnackbar("No URI provided", {variant: 'error'});
      } else {
        setLoading(false);
      }
    }).catch(e => {
      console.log(e);
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e);
      setLoading(false);

      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });


  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const attribute2Compass = {
    stakeholders: 'cids:forStakeholder',
    codes: 'cids:hasCode',
    name: 'cids:hasName',
    value: 'iso21972:value'
  }

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('characteristic',{form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/characteristics');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating characteristic', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      updateCharacteristic(encodeURIComponent(uri), {form},).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/characteristics');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating characteristic', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const errors = {};
    validateForm(form, attriConfig, attribute2Compass, errors, ['uri'])
    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ?
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Characteristic </Typography>
          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          {form.stakeholders?.length? <Typography variant={'h6'}> {`Stakeholders:`} </Typography>: null}
          {form.stakeholders?.map(stakeholder =>
            <Typography variant={'body1'}> <Link to={`/stakeholder/${encodeURIComponent(stakeholder)}/view`}
                                                 colorWithHover color={'#2f5ac7'}>{options.stakeholders[stakeholder] || stakeholder}</Link> </Typography>
          )}
          {form.codes?.length? <Typography variant={'h6'}> {`Codes:`} </Typography>:null}
          {form.codes?.map(code =>
            <Typography variant={'body1'}> <Link to={`/code/${encodeURIComponent(code)}/view`}
                                                 colorWithHover color={'#2f5ac7'}>{options.codes[code] || code}</Link> </Typography>
          )}

          {form.specification ? <Typography variant={'h6'}> {`specification:`} </Typography> : null}
          <Typography variant={'body1'}> {form.specification} </Typography>
          {form.value ? <Typography variant={'h6'}> {`Value:`} </Typography> : null}
          <Typography variant={'body1'}> {form.value} </Typography>


        </Paper>
        : (<Paper sx={{p: 2, position: 'relative'}} variant={'outlined'}>
          <Typography variant={'h4'}> Characteristic </Typography>
          <GeneralField
            disabled={!userContext.isSuperuser}
            key={'name'}
            label={'Name'}
            value={form.name}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.name = e.target.value}
            error={!!errors.name}
            helperText={errors.name}
            required={isFieldRequired(attriConfig, attribute2Compass, 'name')}
            onBlur={validateField(form, attriConfig, 'name', attribute2Compass['name'], setErrors)}
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

          <Dropdown
            label="Stakeholders"
            key={'stakeholders'}
            value={form.stakeholders}
            onChange={e => {
              form.stakeholders = e.target.value;
            }}
            options={options.stakeholders}
            error={!!errors.stakeholders}
            helperText={errors.stakeholders}
            required={isFieldRequired(attriConfig, attribute2Compass, 'stakeholders')}
            onBlur={validateField(form, attriConfig, 'stakeholders', attribute2Compass['stakeholders'], setErrors)}
          />

          <Dropdown
            label="Codes"
            key={'codes'}
            value={form.codes}
            onChange={e => {
              form.codes = e.target.value;
            }}
            options={options.codes}
            error={!!errors.codes}
            helperText={errors.codes}
            required={isFieldRequired(attriConfig, attribute2Compass, 'codes')}
            onBlur={validateField(form, attriConfig, 'codes', attribute2Compass['codes'], setErrors)}
          />


          <GeneralField
            disabled={!userContext.isSuperuser}
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


          <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                       dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Characteristic?' :
                         'Are you sure you want to update this Characteristic?'}
                       buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                         key={'cancel'}>{'cancel'}</Button>,
                         <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                        key={'confirm'}
                                        onClick={handleConfirm} children="confirm" autoFocus/>]}
                       open={state.submitDialog}/>
        </Paper>)}


      <Paper sx={{p: 2}} variant={'outlined'}>
        {mode === 'view' ?
          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/characteristic/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>
          :
          <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
            Submit
          </Button>}

      </Paper>

    </Container>);

}