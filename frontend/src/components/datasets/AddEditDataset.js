import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useState, useContext, useEffect} from "react";
import {Loading} from "../shared";
import {Button, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";

import {useSnackbar} from "notistack";

import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType, fetchDataType, updateDataType} from "../../api/generalAPI";
import {CONFIGLEVEL} from "../../helpers/attributeConfig";
import configs from "../../helpers/attributeConfig";
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


export default function AddEditDataset() {

    const attriConfig = configs[CONFIGLEVEL].dataset

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
        identifier: '',
        name: '',
        description: '',
        dateCreated: '',
    });

    const attribute2Compass = {
        identifier: 'schema:identifier',
        name: 'schema:name',
        description: 'schema:description',
        dateCreated: 'schema:dateCreated',
    }


    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ((mode === 'edit' && uri) || (mode === 'view' && uri)) {
            fetchDataType('dataset', encodeURIComponent(uri)).then(({success, dataset}) => {
                if (success) {
                    dataset.uri = dataset._uri;
                    console.log(dataset)
                    setForm(dataset);
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
        } else if (mode === 'edit' && !uri) {
            navigate(-1);
            enqueueSnackbar("No URI or orgUri provided", {variant: 'error'});
        } else if (mode === 'new') {
            setLoading(false);
            // navigate(-1);
            // enqueueSnackbar("No orgId provided", {variant: 'error'});
        } else if (mode === 'new') {
            setLoading(false);
        } else {
            navigate(-1);
            enqueueSnackbar('Wrong auth', {variant: 'error'});
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
            createDataType('dataset', {form}).then((ret) => {
                if (ret.success) {
                    setState({loadingButton: false, submitDialog: false,});
                    navigate('/Datasets');
                    enqueueSnackbar(ret.message || 'Success', {variant: "success"});
                }

            }).catch(e => {
                if (e.json) {
                    setErrors(e.json);
                }
                reportErrorToBackend(e);
                enqueueSnackbar(e.json?.message || 'Error occurs when creating dataset', {variant: "error"});
                setState({loadingButton: false, submitDialog: false,});
            });
        } else if (mode === 'edit') {
            updateDataType('dataset', encodeURIComponent(uri), {form}).then((res) => {
                if (res.success) {
                    setState({loadingButton: false, submitDialog: false,});
                    navigate('/datasets');
                    enqueueSnackbar(res.message || 'Success', {variant: "success"});
                }
            }).catch(e => {
                if (e.json) {
                    setErrors(e.json);
                }
                console.log(e);
                reportErrorToBackend(e);
                enqueueSnackbar(e.json?.message || 'Error occurs when updating dataset', {variant: "error"});
                setState({loadingButton: false, submitDialog: false,});
            });
        }

    };

    const validate = () => {
        console.log(form);
        const errors = {};
        validateForm(form, attriConfig, attribute2Compass, errors, ['uri'])
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
                    <Typography variant={'h6'}> {`Name:`} </Typography>
                    <Typography variant={'body1'}> {`${form.name}`} </Typography>
                    {form.identifier ? <Typography variant={'h6'}> {`identifier:`} </Typography> : null}
                    <Typography variant={'body1'}> {form.identifier} </Typography>
                    <Typography variant={'h6'}> {`Date Created:`} </Typography>
                    <Typography variant={'body1'}> {form.dateCreated ? `${(new Date(form.dateCreated)).toLocaleDateString()}`: 'Not Given'} </Typography>
                    <Typography variant={'h6'}> {`Description:`} </Typography>
                    <Typography variant={'body1'}> {`${form.description}`} </Typography>



                </Paper>
                : (<Paper sx={{p: 2, position: 'relative'}} variant={'outlined'}>
                    <Typography variant={'h4'}> Dataset </Typography>
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

                    <GeneralField
                        fullWidth
                        type={'date'}
                        value={form.dateCreated}
                        label={'Date Created'}
                        onChange={e => form.dateCreated = e.target.value}
                        sx={{mt: '16px', minWidth: 350}}
                        error={!!errors.dateCreated}
                        helperText={errors.dateCreated}
                        required={isFieldRequired(attriConfig, attribute2Compass, 'dateCreated')}
                        onBlur={validateField(form, attriConfig, 'dateCreated', attribute2Compass['dateCreated'], setErrors)}
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
                        onBlur={validateField(form, attriConfig, 'identifier', attribute2Compass['identifier'], setErrors)}
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
                        multiline
                        required={isFieldRequired(attriConfig, attribute2Compass, 'description')}
                        onBlur={validateField(form, attriConfig, 'description', attribute2Compass['description'], setErrors)}
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