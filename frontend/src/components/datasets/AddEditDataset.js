import {makeStyles} from "@mui/styles";
import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState, useContext} from "react";
import {Link, Loading} from "../shared";
import {Button, Chip, Container, Paper, Typography} from "@mui/material";
import GeneralField from "../shared/fields/GeneralField";
import LoadingButton from "../shared/LoadingButton";
import {AlertDialog} from "../shared/Dialogs";

import {useSnackbar} from "notistack";

import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {isValidURL} from "../../helpers/validation_helpers";
import {updateCode} from "../../api/codeAPI";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {createDataType} from "../../api/generalAPI";
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
    // const [outcomeForm, setOutcomeForm] = useState([
    // ]);
    // We are not fetching anything when we create a new dataset. so loading is false (we can even delete it if needed)
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState({
        objectForm: {},
        definedBy: {}
    });




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
            updateCode(encodeURIComponent(uri), {form},).then((res) => {
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
        const error = {};
        // Object.keys(form).map(key => {
        //   if (key !== 'uri' && !form[key]) {
        //     error[key] = 'This field cannot be empty';
        //   }
        // });

        if (form.identifier && !isValidURL(form.identifier)){
            error.identifier = 'The field should be a valid URI'
        }
        if (form.name === '')
            error.name = 'The field cannot be empty';
        // if (form.identifier === '')
        //     error.identifier = 'The field cannot be empty';
        // if (!form.description)
        //     error.description = 'The field cannot be empty';
        // if (!form.dateCreated)
        //     error.dateCreated = 'The field cannot be empty';

        setErrors(error);

        return Object.keys(error).length === 0;
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
                        required
                        sx={{mt: '16px', minWidth: 350}}
                        onChange={e => form.name = e.target.value}
                        error={!!errors.name}
                        helperText={errors.name}
                        onBlur={() => {
                            if (!form.name) {
                                setErrors(errors => ({...errors, name: 'This field cannot be empty'}));
                            } else {
                                setErrors(errors => ({...errors, name: ''}));
                            }

                        }}
                    />

                    <GeneralField
                        key={'uri'}
                        label={'URI'}
                        value={form.uri}
                        sx={{mt: '16px', minWidth: 350}}
                        onChange={e => form.uri = e.target.value}
                        error={!!errors.uri}
                        helperText={errors.uri}
                        onBlur={() => {
                            if (form.uri && !isValidURL(form.uri)) {
                                setErrors(errors => ({...errors, uri: 'Please input an valid URI'}));
                            } else {
                                setErrors(errors => ({...errors, uri: ''}));
                            }

                        }}
                    />

                    <GeneralField
                        fullWidth
                        type={'date'}
                        value={form.dateCreated}
                        label={'Date Created'}
                        required
                        onChange={e => form.dateCreated = e.target.value}
                        sx={{mt: '16px', minWidth: 350}}
                        error={!!errors.dateCreated}
                        helperText={errors.dateCreated}

                        // onBlur={() => {
                        //     if (!form.dateCreated) {
                        //         setErrors(errors => ({...errors, dateCreated: 'This field cannot be empty'}));
                        //     } else {
                        //         setErrors(errors => ({...errors, dateCreated: null}));
                        //     }
                        // }
                        // }
                    />


                    <GeneralField
                        key={'identifier'}
                        label={'Identifier'}
                        value={form.identifier}
                        sx={{mt: '16px', minWidth: 350}}
                        onChange={e => form.identifier = e.target.value}
                        error={!!errors.identifier}
                        helperText={errors.identifier}
                        required
                        // onBlur={() => {
                        //     if (!form.identifier || !isValidURL(form.identifier)) {
                        //         setErrors(errors => ({...errors, identifier: 'Please input an valid URI'}));
                        //     } else {
                        //         setErrors(errors => ({...errors, identifier: ''}));
                        //     }
                        // }}
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
                        required
                        multiline
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