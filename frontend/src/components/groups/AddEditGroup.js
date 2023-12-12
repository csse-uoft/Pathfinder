import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import Dropdown from "../shared/fields/MultiSelectField";
import SelectField from "../shared/fields/SelectField";
import {updateGroup} from "../../api/groupApi";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
import {fullLevelConfig} from "../../helpers/attributeConfig";
import {validateField, validateForm, validateURI} from "../../helpers";

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


export default function AddEditGroup() {

  const attriConfig = fullLevelConfig.group
  const classes = useStyles();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const {uri, viewMode} = useParams();
  const mode = uri ? viewMode : 'new';
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
    label: '',
    administrator: '',
    organizations: [],
    comment: '',
    uri: '',
  });
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    organizations: {},
    administrators: {},
  });
  const attribute2Compass = {
    label: 'rdfs:label',
    administrator: ':hasAdministrator',
    organizations: ':hasOrganization',
    comment: 'rdfs:comment',
    uri: '',
  }

  useEffect(() => {
    if (!userContext.isSuperuser && !userContext.groupAdminOfs.length > 0) {
      navigate('/groups');
      enqueueSnackbar('Wrong auth', {variant: 'error'});
    }
    Promise.all([
      fetchDataTypeInterfaces('organization')
        .then(({interfaces}) => {
          options.organizations = interfaces;
        }).catch(e => {
        if (e.json)
          setErrors(e.json);
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching organizations", {variant: 'error'});
      }),
      fetchDataTypes('user').then(({data}) => {
        data.map((user) => {
          options.administrators[user._uri] = `${user.person.familyName} ${user.person.givenName} URI: ${user._uri}`;
        });
      }).catch(e => {
        if (e.json)
          setErrors(e.json);
        reportErrorToBackend(e);
        setLoading(false);
        enqueueSnackbar(e.json?.message || "Error occurs when fetching users", {variant: 'error'});
      }),
    ]).then(() => {
      if ((mode === 'edit' || mode === 'view') && uri) {
        fetchDataType('group', encodeURIComponent(uri)).then(res => {
          if (res.success) {
            const group = res.group;
            setForm({
              label: group.label || '',
              administrator: group.administrator || '',
              comment: group.comment || '',
              organizations: group.organizations || [],
              uri: group._uri || '',
              organizationNames: group.organizationNames
            });
            setLoading(false);
          }
        }).catch(e => {
          if (e.json)
            setErrors(e.json);
          reportErrorToBackend(e);
          setLoading(false);
          enqueueSnackbar(e.json?.message || "Error occurs when fetching group", {variant: 'error'});
        });
      } else if ((mode === 'edit' || mode === 'view') && !uri) {
        navigate('/groups');
        enqueueSnackbar("No URI provided", {variant: 'error'});
      } else if (mode === 'new') {
        setLoading(false);
      }
    }).catch(e => {
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });


  }, [mode]);

  const handleSubmit = () => {
    if (validate()) {
      setState(state => ({...state, submitDialog: true}));
    }
  };

  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('group', form).then((ret) => {
        if (ret.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/groups');
          enqueueSnackbar(ret.message || 'Success', {variant: "success"});
        }

      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when creating organization', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    } else if (mode === 'edit') {
      updateGroup(encodeURIComponent(uri), form).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          navigate('/groups');
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating group', {variant: "error"});
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
          <Typography variant={'h6'}> {`Label:`} </Typography>
          <Typography variant={'body1'}> {`${form.label}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          <Typography variant={'h6'}> {`Administrator:`} </Typography>
          <Typography variant={'body1'}> {`${form.administrator}`} </Typography>
          {form.organizations.length ? <Typography variant={'h6'}> {`Orgaizations:`} </Typography> : null}
          {form.organizations.map(organizationURI => {
            return (
              <Typography variant={'body1'}>
                <Link to={`/organizations/${encodeURIComponent(organizationURI)}/view`} colorWithHover
                      color={'#2f5ac7'}>{form.organizationNames[organizationURI]}</Link>
              </Typography>
            );
          })}
          {form.comment ? <Typography variant={'h6'}> {`Comment:`} </Typography> : null}
          <Typography variant={'body1'}> {`${form.comment}`} </Typography>

          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/groups/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>

        </Paper>
        :
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Group </Typography>
          <GeneralField
            key={'label'}
            label={'Label'}
            value={form.label}
            disabled={!userContext.isSuperuser}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.label = e.target.value}
            error={!!errors.label}
            helperText={errors.label}
            required={attriConfig[attribute2Compass['label']]?.ignoreInstance}
            onBlur={validateField(form, attriConfig, 'label', attribute2Compass['label'], setErrors)}
          />
          <GeneralField
            key={'uri'}
            label={'URI'}
            value={form.uri}
            disabled={mode !== 'new'}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.uri = e.target.value}
            error={!!errors.uri}
            helperText={errors.uri}
            onBlur={validateURI(form, setErrors)}
          />
          <SelectField
            key={'administrator'}
            disabled={!userContext.isSuperuser}
            label={'Group Administrator'}
            value={form.administrator}
            options={options.administrators}
            error={!!errors.administrator}
            helperText={errors.administrator}
            onChange={e => {
              setForm(form => ({
                  ...form, administrator: e.target.value
                })
              );
            }}
            required={attriConfig[attribute2Compass['administrator']]?.ignoreInstance}
            onBlur={validateField(form, attriConfig, 'administrator', attriConfig['administrator'], setErrors)}
          />

          <Dropdown
            label="Organizations"
            key={'organizations'}
            value={form.organizations}
            onChange={e => {
              form.organizations = e.target.value;
            }}
            options={options.organizations}
            error={!!errors.organizations}
            helperText={errors.organizations}
            required={attriConfig[attribute2Compass['organizations']]?.ignoreInstance}
            onBlur={validateField(form, attriConfig, 'organizations', attriConfig['organizations'], setErrors)}
          />
          <GeneralField
            key={'comment'}
            label={'Comment'}
            value={form.comment}
            sx={{mt: '16px', minWidth: 350}}
            onChange={e => form.comment = e.target.value}
            error={!!errors.comment}
            helperText={errors.comment}
            required={attriConfig[attribute2Compass['comment']]?.ignoreInstance}
            onBlur={validateField(form, attriConfig, 'comment', attriConfig['comment'], setErrors)}
          />

          <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
            Submit
          </Button>

          <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                       dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Group?' :
                         'Are you sure you want to update this Group?'}
                       buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                         key={'cancel'}>{'cancel'}</Button>,
                         <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                        key={'confirm'}
                                        onClick={handleConfirm} children="confirm" autoFocus/>]}
                       open={state.submitDialog}/>
        </Paper>
      }

    </Container>);

}