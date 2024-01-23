import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon,} from "@mui/icons-material";
import { DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes, fetchDataType} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";
export default function ImpactReportView({multi, single, organizationUser, superUser, groupUser}) {
    const {enqueueSnackbar} = useSnackbar();
    const {uri} = useParams();
    const navigator = useNavigate();
    const navigate = navigateHelper(navigator)
    const userContext = useContext(UserContext);
    const [state, setState] = useState({
        loading: true,
        data: [],
        selectedUri: null,
        deleteDialogTitle: '',
        showDeleteDialog: false,
        editable: false
    });
    const [trigger, setTrigger] = useState(true);

    useEffect(() => {
        if (multi) {
            fetchDataTypes('impactReport', encodeURIComponent(uri)).then(res => {
                if(res.success)
                    setState(state => ({...state, loading: false, data: res.impactReports, editable: res.editable}));
            }).catch(e => {
                reportErrorToBackend(e)
                setState(state => ({...state, loading: false}))
                console.log(e)
                enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
            });
        } else if (single) {
            fetchDataType('impactReport', encodeURIComponent(uri)).then(res => {
                if(res.success)
                    console.log(res)
                    setState(state => ({...state, loading: false, data: [res.impactReport], editable: res.editable}));
            }).catch(e => {
                reportErrorToBackend(e)
                setState(state => ({...state, loading: false}))
                console.log(e)
                enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
            });
        }

    }, [trigger]);

    // const showDeleteDialog = (id) => {
    //   setState(state => ({
    //     ...state, selectedId: id, showDeleteDialog: true,
    //     deleteDialogTitle: 'Delete organization ' + id + ' ?'
    //   }));
    // };

    // const handleDelete = async (id, form) => {
    //
    //   deleteOrganization(id).then(({success, message})=>{
    //     if (success) {
    //       setState(state => ({
    //         ...state, showDeleteDialog: false,
    //       }));
    //       setTrigger(!trigger);
    //       enqueueSnackbar(message || "Success", {variant: 'success'})
    //     }
    //   }).catch((e)=>{
    //     setState(state => ({
    //       ...state, showDeleteDialog: false,
    //     }));
    //     setTrigger(!trigger);
    //     enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    //   });
    //
    // };

    const columns = [
        {
            label: 'Impact Scale',
            body: ({impactScale}) => {
                return impactScale
            },
        },

        {
            label: 'Impact Depth',
            body: ({impactDepth}) => {
                return impactDepth
            },
            sortBy: ({name}) => name
        },
        {
            label: 'Stakeholder Outcome(s)',
            body: ({forStakeholderOutcome}) => {
                return <Link colorWithHover to={`/stakeholderOutcome/${encodeURIComponent(forStakeholderOutcome?._uri)}/view`}>
                    {forStakeholderOutcome?.name}
                </Link>
            }
        },


        {
            label: ' ',
            body: ({_uri}) =>
                <DropdownMenu urlPrefix={'impactReport'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable} hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
        }
    ];

    if (state.loading)
        return <Loading message={`Loading Impact Reports...`}/>;

    return (
        <Container>
            {
                state.data.map(impactReport => {
                    const hasTime = impactReport?.hasTime;

                    return (
                        <Container>
                            <EnhancedTableToolbar numSelected={0} title={(
                                <>
                                    Impact Report: {impactReport?.name}
                                    <br/>
                                    Organization: {''}
                                    <Link
                                        colorWithHover
                                        to={`/organization/${encodeURIComponent(impactReport?.forOrganization)}/view`}
                                    >
                                        {impactReport?.forOrganization}
                                    </Link>
                                    <br/>
                                    Impact Report URI: {''}
                                    <Link
                                        colorWithHover
                                        to={`/impactReport/${encodeURIComponent(impactReport._uri)}/view`}
                                    >
                                        {impactReport?._uri}
                                    </Link>
                                    <br/>
                                    Time Interval of Report: {(hasTime?.hasBeginning?.date && hasTime?.hasEnd?.date) ?
                                    `${(new Date(hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(hasTime.hasEnd.date)).toLocaleString()}`
                                    : null
                                }
                                    <br/>
                                    Comment: {impactReport.comment}
                                </>
                            )}/>



                            <DataTable
                                noHeaderBar
                                noPaginationBar
                                title={""}
                                data={[impactReport]}
                                columns={columns}
                                uriField="uri"
                                customToolbar={
                                    <Chip
                                        disabled={!state.editable}
                                        onClick={() => navigate(`/impactReport/${encodeURIComponent(uri)}/new`)}
                                        color="primary"
                                        icon={<AddIcon/>}
                                        label="Add new ImpactReports"
                                        variant="outlined"/>
                                }

                            />
                        </Container>
                    )
                })
            }

            {/*<DeleteModal*/}
            {/*  objectId={state.selectedId}*/}
            {/*  title={state.deleteDialogTitle}*/}
            {/*  show={state.showDeleteDialog}*/}
            {/*  onHide={() => setState(state => ({...state, showDeleteDialog: false}))}*/}
            {/*  delete={handleDelete}*/}
            {/*/>*/}
        </Container>
    );
}
