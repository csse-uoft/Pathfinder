import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {deleteTheme} from "../../api/themeApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes, fetchDataType} from "../../api/generalAPI";

export default function CodeView({ organizationUser, groupUser, superUser, multi, single, uri }) {
    const {enqueueSnackbar} = useSnackbar();
    const navigator = useNavigate();
    const navigate = navigateHelper(navigator)

    const userContext = useContext(UserContext);
    const [state, setState] = useState({
        loading: true,
        data: [],
        selectedUri: null,
        deleteDialogTitle: '',
        showDeleteDialog: false,
    });
    const [trigger, setTrigger] = useState(true);

    useEffect(() => {
        if (multi) {
            fetchDataTypes('code').then(res => {
                if(res.success)
                    setState(state => ({...state, loading: false, data: res.codes}));
            }).catch(e => {
                setState(state => ({...state, loading: false}))
                navigate('/dashboard');
                enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
            });
        } else if (single) {
            fetchDataType('code', encodeURIComponent(uri)).then(res => {
                if(res.success)
                    setState(state => ({...state, loading: false, data: [res.code]}));
            }).catch(e => {
                setState(state => ({...state, loading: false}))
                navigate('/dashboard');
                enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
            });
        }

    }, [trigger]);

    const showDeleteDialog = (uri) => {
        setState(state => ({
            ...state, selectedUri: uri, showDeleteDialog: true,
            deleteDialogTitle: 'Delete codes ' + uri + ' ?'
        }));
    };

    const handleDelete = async (uri, form) => {

        deleteTheme(uri).then(({success, message})=>{
            if (success) {
                setState(state => ({
                    ...state, showDeleteDialog: false,
                }));
                setTrigger(!trigger);
                enqueueSnackbar(message || "Success", {variant: 'success'})
            }
        }).catch((e)=>{
            setState(state => ({
                ...state, showDeleteDialog: false,
            }));
            reportErrorToBackend(e)
            setTrigger(!trigger);
            enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
        });

    };

    const columns = [
        {
            // label: 'Code Name',
            // body: ({_uri, name}) => {
            //     return <Link colorWithHover to={`/code/${encodeURIComponent(_uri)}/view`}>
            //         {name}
            //     </Link>
            // },
            // sortBy: ({name}) => name
            label: 'Code Name',
            body: ({name}) => {
                return name
            },
            sortBy: ({name}) => name
        },

        {
            label: 'Code URI',
            body: ({_uri}) => {
                if (multi)
                    return <Link colorWithHover to={`/code/${encodeURIComponent(_uri)}/view`}>
                        {_uri}
                    </Link>
                else if (single)
                    return _uri;
            },
            sortBy: ({_uri}) => _uri
        },

        {
            label: 'Code ID',
            body: ({identifier}) => {
                return identifier;
            }
        },
        {
            label: 'Code Description',
            body: ({description}) => {
                return description;
            }
        },

        {
            label: 'Defined By',
            body: ({definedBy}) => {
                return <Link colorWithHover to={`/organization/${encodeURIComponent(definedBy)}/view`}>
                    {definedBy}
                </Link>
            }
        },

        { // todo: which value to include? iso72 or codeValue?
            label: 'Value',
            body: ({codeValue, iso72Value}) => {
                return codeValue || iso72Value?.numericalValue;
            }
        },

        {
            label: ' ',
            body: ({_uri}) => {
                if (multi) {
                    return <DropdownMenu urlPrefix={'code'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                                         hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
                } else if (single) {
                    return null;
                }

            }

        }
    ];

    if (state.loading)
        return <Loading message={`Loading codes...`}/>;

    return (
        <Container>
            <DataTable
                title={multi ? "Codes" : "Code"}
                data={state.data}
                columns={columns}
                uriField="uriField"
                customToolbar={ multi ?
                    <Chip
                        disabled={!userContext.isSuperuser}
                        onClick={() => navigate('/code/new')}
                        color="primary"
                        icon={<AddIcon/>}
                        label="Add new Codes"
                        variant="outlined"/> : null
                }

            />
            <DeleteModal
                objectUri={state.selectedUri}
                title={state.deleteDialogTitle}
                show={state.showDeleteDialog}
                onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
                delete={handleDelete}
            />
        </Container>
    );
}
