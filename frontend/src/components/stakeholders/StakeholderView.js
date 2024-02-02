import React, { useEffect, useState, useContext } from 'react';
import {Chip, Container, ListItemIcon, Menu, MenuItem, Typography} from "@mui/material";
import {Add as AddIcon, Check as YesIcon, People} from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import {deleteOrganization, fetchOrganizations} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {fetchStakeholder, fetchStakeholders} from "../../api/stakeholderAPI";
import {navigate, navigateHelper} from "../../helpers/navigatorHelper";

export default function StakeholderView({ organizationUser, groupUser, superUser, multi, single, uri }) {
    const {enqueueSnackbar} = useSnackbar();
    const navigator = useNavigate();
    const navigate = navigateHelper(navigator)
    const userContext = useContext(UserContext);
    const [state, setState] = useState({
        loading: true,
        data: [],
        selectedId: null,
        deleteDialogTitle: '',
        showDeleteDialog: false,
    });
    const [dropDown, setDropDown] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [trigger, setTrigger] = useState(true);

    useEffect(() => {
        if (multi) {
            fetchStakeholders().then(res => {
                if(res.success)
                    console.log(res.stakeholders)
                    setState(state => ({...state, loading: false, data: res.stakeholders}));
            }).catch(e => {
                reportErrorToBackend(e)
                setState(state => ({...state, loading: false}))
                navigate('/dashboard');
                enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
            });
        } else if (single) {
            fetchStakeholder(encodeURIComponent(uri)).then(res => {
                if(res.success)
                    console.log(res.stakeholder)
                    setState(state => ({...state, loading: false, data: [res.stakeholder]}));
            }).catch(e => {
                reportErrorToBackend(e)
                setState(state => ({...state, loading: false}))
                navigate('/dashboard');
                enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
            });
        }

    }, [trigger]);

    const showDeleteDialog = (id) => {
        setState(state => ({
            ...state, selectedId: id, showDeleteDialog: true,
            deleteDialogTitle: 'Delete organization ' + id + ' ?'
        }));
    };


    const handleDelete = async (id, form) => {

        deleteOrganization(id).then(({success, message})=>{
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
            setTrigger(!trigger);
            enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
        });

    };

    const columns = [
        {
            label: 'Stakeholder Name',
            body: ({name}) => {
                return name
            },
        },
        {
            label: 'Stakeholder Description',
            body: ({description}) => {
                return description;
            }
        },
        {
            label: 'Region',
            body: ({catchmentArea}) => {
                return catchmentArea
            }
        },
        {
            label: 'Stakeholder Characteristic(s)',
            body: ({characteristics}) => { //TODO: what if there are multiple characteristics? // solution: give a list.
                return characteristics?.map(characteristicUri => <Link colorWithHover to={`/characteristic/${encodeURIComponent(characteristicUri)}/view`}>{characteristicUri}</Link>)
            }
        },

        {
            label: ' ',
            body: ({_uri, editable}) =>
                <DropdownMenu urlPrefix={'stakeholder'} objectUri={encodeURIComponent(_uri)} hideViewOption hideDeleteOption
                              hideEditOption={!editable}
                              handleDelete={() => showDeleteDialog(_uri)}/>
        }
    ];

    if (state.loading)
        return <Loading message={`Loading organizations...`}/>;

    return (
        <Container>
            <Typography variant={'h2'}> Stakeholder Class View </Typography>
            <DataTable
                title={"Stakeholders"}
                data={state.data}
                columns={columns}
                idField="id"
                customToolbar={
                    <div>
                        <Chip
                            disabled={!userContext.isSuperuser}
                            onClick={(e) => {
                                setDropDown(true);
                                setAnchorEl(e.currentTarget);
                            }}
                            color="primary"
                            icon={<AddIcon/>}
                            label="Add new Stakeholder"
                            variant="outlined"/>
                        <Menu
                            open={dropDown}
                            anchorEl={anchorEl}
                            onClose={() => {
                                setAnchorEl(null);
                                setDropDown(false);
                            }}
                        >
                            <MenuItem onClick={() => {
                                navigate("/stakeholder/new" );
                            }} variant="inherit" sx={{width:'180px', padding: '4px 12px', height: '25px'}} >
                                Organization
                            </MenuItem>
                        </Menu>
                    </div>

                }

            />
            <DeleteModal
                objectId={state.selectedId}
                title={state.deleteDialogTitle}
                show={state.showDeleteDialog}
                onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
                delete={handleDelete}
            />
        </Container>
    );
}
