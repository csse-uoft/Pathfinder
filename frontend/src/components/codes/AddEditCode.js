import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import SelectField from "../shared/fields/SelectField";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {updateCode} from "../../api/codeAPI";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
import {  baseLevelConfig, fullLevelConfig } from "../../helpers/attributeConfig"
import {isFieldRequired, validateField, validateFieldAndURI, validateForm, validateURI} from "../../helpers";
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


export default function AddEditCode() {

  const attriConfig = fullLevelConfig.code
  const classes = useStyles();
  const userContext = useContext(UserContext);
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
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
    definedBy: '',
    uri: '',
    specification: '',
    identifier: '',
    name: '',
    description: '',
    codeValue: '',
    iso72Value: ''
  });

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    objectForm: {},
    definedBy: {}
  });


  useEffect(() => {

    Promise.all([
      fetchDataTypeInterfaces('organization').then(({interfaces, success}) => {
        if (success) {
          setOptions(options => ({...options, definedBy: interfaces}));
        }
      }),
    ]).then(() => {
      if ((mode === 'edit' || mode === 'view') && uri) {
          fetchDataType('code', encodeURIComponent(uri)).then(res => {
            if (res.success) {
              const {code} = res;
              setForm({...code, uri: code._uri});
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
        navigate('/codes');
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
    definedBy: 'cids:definedBy',
    specification: 'cids:hasSpecification',
    identifier: 'tove_org:hasIdentifier',
    name: 'cids:hasName',
    description: 'cids:hasDescription',
    codeValue: 'schema:codeValue',
    iso72Value: 'iso21972:value'
  }

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('code', {form}).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/codes');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating code', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      updateCode(encodeURIComponent(uri), {form},).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/codes');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        console.log(e);
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating code', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const errors = {};

    validateForm(form, attriConfig, attribute2Compass, errors, ['identifier', 'uri'])

    setErrors(errors);

    return Object.keys(errors).length === 0;
    // && outcomeFormErrors.length === 0 && indicatorFormErrors.length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ?
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Code </Typography>
          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          {form.definedBy ? <Typography variant={'h6'}> {`Defined By:`} </Typography> : null}
          <Typography variant={'body1'}> <Link to={`/organizations/${encodeURIComponent(form.definedBy)}/view`}
                                               colorWithHover color={'#2f5ac7'}>{options.definedBy[form.definedBy]}</Link> </Typography>
          {form.specification ? <Typography variant={'h6'}> {`specification:`} </Typography> : null}
          <Typography variant={'body1'}> {form.specification} </Typography>
          {form.identifier ? <Typography variant={'h6'}> {`identifier:`} </Typography> : null}
          <Typography variant={'body1'}> {form.identifier} </Typography>
          {form.codeValue ? <Typography variant={'h6'}> {`Code Value:`} </Typography> : null}
          <Typography variant={'body1'}> {form.codeValue} </Typography>
          {form.iso72Value ? <Typography variant={'h6'}> {`iso72 Value:`} </Typography> : null}
          <Typography variant={'body1'}> {form.iso72Value} </Typography>
          <Typography variant={'h6'}> {`Description:`} </Typography>
          <Typography variant={'body1'}> {`${form.description || 'Not Given'}`} </Typography>


        </Paper>
        : (<Paper sx={{p: 2, position: 'relative'}} variant={'outlined'}>
          <Typography variant={'h4'}> Code </Typography>
          <GeneralField
            disabled={!userContext.isSuperuser}
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
            key={'definedBy'}
            label={'Defined By'}
            value={form.definedBy}
            options={options.definedBy}
            error={!!errors.definedBy}
            required={isFieldRequired(attriConfig, attribute2Compass, 'definedBy')}
            helperText={
              errors.definedBy
            }
            onBlur={validateField(form, attriConfig,'definedBy',attribute2Compass['definedBy'], setErrors)}
            onChange={e => {
              setForm(form => ({
                  ...form, definedBy: e.target.value
                })
              );
            }}
          />


          <GeneralField
            key={'identifier'}
            label={'Identifier'}
            value={form.identifier}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.identifier = e.target.value}
            error={!!errors.identifier}
            helperText={errors.identifier}
            required={isFieldRequired(attriConfig, attribute2Compass, 'identifier')}
            onBlur={validateFieldAndURI(form, attriConfig,'identifier',attribute2Compass['identifier'], setErrors)}
          />

          <GeneralField
            key={'specification'}
            label={'Specification'}
            value={form.specification}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.specification = e.target.value}
            error={!!errors.specification}
            helperText={errors.specification}
            required={isFieldRequired(attriConfig, attribute2Compass, 'specification')}
            onBlur={validateField(form, attriConfig,'specification',attribute2Compass['specification'], setErrors)}
          />

          <GeneralField
            disabled={!userContext.isSuperuser}
            key={'codeValue'}
            label={'Code Value'}
            value={form.codeValue}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.codeValue = e.target.value}
            error={!!errors.codeValue}
            helperText={errors.codeValue}
            required={isFieldRequired(attriConfig, attribute2Compass, 'codeValue')}
            onBlur={validateField(form, attriConfig,'codeValue',attribute2Compass['codeValue'], setErrors)}
          />

          <GeneralField
            disabled={!userContext.isSuperuser}
            key={'iso72Value'}
            label={'iso72 Value'}
            value={form.iso72Value}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.iso72Value = e.target.value}
            error={!!errors.iso72Value}
            helperText={errors.iso72Value}
            required={isFieldRequired(attriConfig, attribute2Compass, 'iso72Value')}
            onBlur={validateField(form, attriConfig,'iso72Value',attribute2Compass['iso72Value'], setErrors)}
          />

          <GeneralField
            key={'description'}
            label={'Description'}
            value={form.description}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.description = e.target.value}
            error={!!errors.description}
            helperText={errors.description}
            minRows={4}
            required={isFieldRequired(attriConfig, attribute2Compass, 'description')}
            multiline
            onBlur={validateField(form, attriConfig,'description',attribute2Compass['description'], setErrors)}
          />

          <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                       dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Code?' :
                         'Are you sure you want to update this Code?'}
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
            navigate(`/code/${encodeURIComponent(uri)}/edit`);
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