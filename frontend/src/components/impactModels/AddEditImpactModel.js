import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import {
  updateIndicatorReport
} from "../../api/indicatorReportApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isFieldRequired, validateField, validateForm, validateURI, validateFieldAndURI} from "../../helpers";
import {navigateHelper} from "../../helpers/navigatorHelper";
import GeneralField from "../shared/fields/GeneralField";
import SelectField from "../shared/fields/SelectField";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
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


export default function AddEditImpactModel() {
  const attriConfig = fullLevelConfig.impactNorms
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
    organization: {},
    outcome: {},
    indicator: {},
    impactReport: {},
    indicatorReport: {},
    stakeholderOutcome: {}
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    organization: null,
    dateCreated: '',
    uri: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataTypeInterfaces('outcome').then(({interfaces}) => {
      setOps(ops => ({...ops, outcome: interfaces}))
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('indicator').then(({interfaces}) => {
      setOps(ops => ({...ops, indicator: interfaces}))
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('impactReport').then(({interfaces}) => {
      setOps(ops => ({...ops, impactReport: interfaces}))
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('indicatorReport').then(({interfaces}) => {
      setOps(ops => ({...ops, indicatorReport: interfaces}))
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('stakeholderOutcome').then(({interfaces}) => {
      setOps(ops => ({...ops, stakeholderOutcome: interfaces}))
    })
  }, [])

  useEffect(() => {
    fetchDataTypeInterfaces('organization').then(({interfaces}) => {
      setOps(ops => ({...ops, organization: interfaces}))
    })
  }, [])

  useEffect(() => {
    if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchDataType('impactModel', encodeURIComponent(uri)).then(({success, impactNorms}) => {
        if (success) {
          setForm(impactNorms);
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
  
  const attribute2Compass = {
    name: 'cids:hasName',
    description: 'cids:hasName',
    organization: 'cids:forOrganization',
    dateCreated:  "schema:dateCreated"
  }

  const handleSubmit = () => {
    if (validate()) {
      console.log(form);
      setState(state => ({...state, submitDialog: true}));
    }
  };


  const handleConfirm = () => {
    setState(state => ({...state, loadingButton: true}));
    if (mode === 'new') {
      createDataType('impactModel', {form}).then((ret) => {
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
      updateIndicatorReport(encodeURIComponent(uri), {form}).then((res) => {
        if (res.success) {
          setState({loadingButton: false, submitDialog: false,});
          enqueueSnackbar(res.message || 'Success', {variant: "success"});
          navigate(`/impactReports/${encodeURIComponent(form.organization)}`);
        }
      }).catch(e => {
        if (e.json) {
          setErrors(e.json);
        }
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || 'Error occurs when updating outcome', {variant: "error"});
        setState({loadingButton: false, submitDialog: false,});
      });
    }

  };

  const validate = () => {
    const error = {};
    validateForm(form, attriConfig, attribute2Compass, errors, ['uri'])
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ? (
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Impact Model </Typography>
          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form._uri}`} </Typography>
          <Typography variant={'h6'}> {`Organization:`} </Typography>
          <Typography variant={'body1'}> <Link to={`/organizations/${encodeURIComponent(form.organization)}/view`}
                                               colorWithHover
                                               color={'#2f5ac7'}>{ops.organization[form.organization]}</Link>
          </Typography>

          <Typography variant={'h6'}> {`Description:`} </Typography>
          <Typography variant={'body1'}> {`${form.description || 'Not Given'}`} </Typography>

          <Typography variant={'h6'}> {`Date Created:`} </Typography>
          <Typography variant={'body1'}> {form.dateCreated? `${(new Date(form.dateCreated)).toLocaleDateString()}` : 'Not Given'} </Typography>
          <Typography variant={'h6'}> {`Stakeholders:`} </Typography>
          {form.stakeholders?.length?
            form.stakeholders.map(stakeholder => <Typography variant={'body1'}> {<Link to={`/stakeholder/${encodeURIComponent(stakeholder)}/view`} colorWithHover
                                                                               color={'#2f5ac7'}>{ops.organization[stakeholder]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Typography variant={'h6'}> {`Outcomes:`} </Typography>
          {form.outcomes?.length?
            form.outcomes.map(outcome => <Typography variant={'body1'}> {<Link to={`/outcome/${encodeURIComponent(outcome)}/view`} colorWithHover
                                                                                       color={'#2f5ac7'}>{ops.outcome[outcome]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Typography variant={'h6'}> {`Indicators:`} </Typography>
          {form.indicators?.length?
            form.indicators.map(indicator => <Typography variant={'body1'}> {<Link to={`/indicator/${encodeURIComponent(indicator)}/view`} colorWithHover
                                                                               color={'#2f5ac7'}>{ops.indicator[indicator]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Typography variant={'h6'}> {`Impact Reports:`} </Typography>
          {form.impactReports?.length?
            form.impactReports.map(impactReport => <Typography variant={'body1'}> {<Link to={`/impactReport/${encodeURIComponent(impactReport)}/view`} colorWithHover
                                                                               color={'#2f5ac7'}>{ops.impactReport[impactReport]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Typography variant={'h6'}> {`Indicator Reports:`} </Typography>
          {form.indicatorReports?.length?
            form.indicatorReports.map(indicatorReport => <Typography variant={'body1'}> {<Link to={`/indicatorReport/${encodeURIComponent(indicatorReport)}/view`} colorWithHover
                                                                                         color={'#2f5ac7'}>{ops.indicatorReport[indicatorReport]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Typography variant={'h6'}> {`Stakeholder Outcome:`} </Typography>
          {form.stakeholderOutcomes?.length?
            form.stakeholderOutcomes.map(so => <Typography variant={'body1'}> {<Link to={`/stakeholderOutcome/${encodeURIComponent(so)}/view`} colorWithHover
                                                                                               color={'#2f5ac7'}>{ops.stakeholderOutcome[so]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/impactReport/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>

        </Paper>
      ) : (<Paper sx={{p: 2, position: 'relative'}} variant={'outlined'}>
        <Typography variant={'h4'}> Impact Model </Typography>
        <GeneralField
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

        <SelectField
          key={'organization'}
          label={'Organization'}
          value={form.organization}
          options={ops.organization}
          error={!!errors.organization}
          helperText={
            errors.organization
          }
          onChange={e => {
            setForm(form => ({
                ...form, organization: e.target.value
              })
            );
          }}

          required={isFieldRequired(attriConfig, attribute2Compass, 'organization')}
          onBlur={validateFieldAndURI(form, attriConfig,'organization',attribute2Compass['organization'], setErrors)}
        />
        <GeneralField
          fullWidth
          type={'date'}
          value={form.dateCreated}
          label={'Date Created'}
          onChange={e => form.dateCreated = e.target.value}
          error={!!errors.dateCreated}
          helperText={errors.dateCreated}
          required={isFieldRequired(attriConfig, attribute2Compass, 'date')}
          onBlur={validateField(form, attriConfig,'date',attribute2Compass['date'], setErrors)}
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
          onBlur={validateField(form, attriConfig,'description',attribute2Compass['description'], setErrors)}
          multiline
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