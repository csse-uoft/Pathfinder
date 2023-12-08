import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";
import {useSnackbar} from "notistack";
import {UserContext} from "../../context";
import ImpactReportField from "../shared/ImpactReportField";
import {updateIndicatorReport} from "../../api/indicatorReportApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
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


export default function AddEditImpactReport() {
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
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
    stakeholderOutcome: {},
    howMuchImpact: {},
    impactRisk: {}
  });

  const [form, setForm] = useState({
    name: '',
    comment: '',
    impactScale: null,
    impactDepth: null,
    impactDuration: null,
    forStakeholderOutcome: null,
    reportedImpact: null,
    organization: null,
    impactRisks: null,
    startTime: '',
    endTime: '',
    uri: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDataTypeInterfaces('organization'), fetchDataTypeInterfaces('howMuchImpact'), fetchDataTypes('impactRisk')]).then(
      ([organizationRet, {howMuchImpactInterfaces}, {impactRisks}]) => {
        const impactRiskInterfaces = {}
        impactRisks.map(impactRisk => {
          impactRiskInterfaces[impactRisk._uri] = impactRisk.hasIdentifier
        })
        setOps(ops => ({...ops, organization: organizationRet.interfaces, howMuchImpact: howMuchImpactInterfaces, impactRisk: impactRiskInterfaces}));
        setLoading(false);
      }
    ).catch(([e]) => {
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organizations", {variant: 'error'});
    });

  }, []);

  useEffect(() => {
    if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
      fetchDataType('impactReport', encodeURIComponent(uri)).then(({success, impactReport}) => {
        if (success) {
          impactReport.uri = impactReport._uri;
          impactReport.organization = impactReport.forOrganization;

          setForm(impactReport);
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
      createDataType('impactReport', {form}).then((ret) => {
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
    // if (!form.name)
    //   error.name = 'The field cannot be empty';
    // if (!form.comment)
    //   error.comment = 'The field cannot be empty';
    // if (!form.organization)
    //   error.organization = 'The field cannot be empty';
    // if (!form.indicator)
    //   error.indicator = 'The field cannot be empty';
    // if (!form.startTime)
    //   error.startTime = 'The field cannot be empty';
    // if (!form.endTime)
    //   error.endTime = 'The field cannot be empty';
    // if (form.uri && !isValidURL(form.uri))
    //   error.uri = 'The field cannot be empty';
    if (!!form.startTime && !!form.endTime && form.startTime > form.endTime) {
      error.startTime = 'The date must be earlier than the end date';
      error.endTime = 'The date must be later than the start date';
    }

    // if (!form.numericalValue)
    //   error.numericalValue = 'The field cannot be empty';
    // if (form.numericalValue && isNaN(form.numericalValue))
    //   error.numericalValue = 'The field must be a number';
    // if (!form.unitOfMeasure)
    //   error.unitOfMeasure = 'The field cannot be empty';
    // if (!form.dateCreated)
    //   error.dateCreated = 'The field cannot be empty';
    setErrors(error);
    return Object.keys(error).length === 0;
  };

  if (loading)
    return <Loading/>;

  return (
    <Container maxWidth="md">
      {mode === 'view' ? (
        <Paper sx={{p: 2}} variant={'outlined'}>
          <Typography variant={'h4'}> Impact Report </Typography>
          <Typography variant={'h6'}> {`Name:`} </Typography>
          <Typography variant={'body1'}> {`${form.name || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`URI:`} </Typography>
          <Typography variant={'body1'}> {`${form.uri}`} </Typography>
          <Typography variant={'h6'}> {`Comment:`} </Typography>
          <Typography variant={'body1'}> {`${form.comment || 'Not Given'}`} </Typography>
          <Typography variant={'h6'}> {`Organization:`} </Typography>
          <Typography variant={'body1'}> <Link to={`/organizations/${encodeURIComponent(form.organization)}/view`}
                                               colorWithHover
                                               color={'#2f5ac7'}>{ops.organization[form.organization] || 'Not Given'}</Link>
          </Typography>

          <Typography variant={'h6'}> {`Impact Scale:`} </Typography>
          <Typography variant={'body1'}> { form.impactScale? <Link to={`/howMuchImpact/${encodeURIComponent(form.impactScale)}/view`}
                                                colorWithHover
                                                color={'#2f5ac7'}>{ops.howMuchImpact[form.impactScale] || 'Not Given'} </Link> :'Not Given'}
          </Typography>

          <Typography variant={'h6'}> {`Impact Depth:`} </Typography>
          <Typography variant={'body1'}> {form.impactDepth ? <Link to={`/howMuchImpact/${encodeURIComponent(form.impactDepth)}/view`}
                                                colorWithHover
                                                color={'#2f5ac7'}>{ops.howMuchImpact[form.impactDepth]}</Link> : 'Not Given'}
          </Typography>

          <Typography variant={'h6'}> {`Impact Duration:`} </Typography>
          <Typography variant={'body1'}> {form.impactDuration ? <Link to={`/howMuchImpact/${encodeURIComponent(form.impactDuration)}/view`}
                                                                   colorWithHover
                                                                   color={'#2f5ac7'}>{ops.howMuchImpact[form.impactDuration]}</Link> : 'Not Given'}
          </Typography>
          <Typography variant={'h6'}> {`Impact Risk:`} </Typography>
          {form.impactRisks?.length?
            form.impactRisks.map(code => <Typography variant={'body1'}> {<Link to={`/impactRisk/${encodeURIComponent(code)}/view`} colorWithHover
                                                                         color={'#2f5ac7'}>{ops.impactRisk[code]}</Link>} </Typography>)

            : <Typography variant={'body1'}> {`Not Given`} </Typography>}

          <Button variant="contained" color="primary" className={classes.button} onClick={() => {
            navigate(`/impactReport/${encodeURIComponent(uri)}/edit`);
          }
          }>
            Edit
          </Button>
        
        </Paper>
      ) : (<Paper sx={{p: 2}} variant={'outlined'}>
        <Typography variant={'h4'}> Impact Report </Typography>
          <ImpactReportField
          disabled={mode === 'view'}
          disabledOrganization={!!orgUri}
          defaultValue={form}
          required
          onChange={(state) => {
            setForm(form => ({...form, ...state}));
          }}
          uriDiasbled={mode !== 'new'}
          importErrors={errors}
        />
          
        <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmit}>
          Submit
        </Button>

        <AlertDialog dialogContentText={"You won't be able to edit the information after clicking CONFIRM."}
                     dialogTitle={mode === 'new' ? 'Are you sure you want to create this new Indicator Report?' :
                       'Are you sure you want to update this Impact Report?'}
                     buttons={[<Button onClick={() => setState(state => ({...state, submitDialog: false}))}
                                       key={'cancel'}>{'cancel'}</Button>,
                       <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                      key={'confirm'}
                                      onClick={handleConfirm} children="confirm" autoFocus/>]}
                     open={state.submitDialog}/>
      </Paper>)}

    </Container>);

}