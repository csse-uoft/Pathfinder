import React, {useEffect, useState, useContext} from 'react';
import {
  Chip,
  Container, Paper, Table, TableContainer,
  Typography,
} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {UserContext} from "../../context";
import {
  fetchDataType,
  fetchDataTypeInterfaces,
  fetchDataTypes,
  fetchDataTypesGivenListOfUris
} from "../../api/generalAPI";
import DropdownFilter from "../shared/DropdownFilter";
import {
  areAllGroupOrgsSelected, fetchOrganizationsWithGroups,
  handleChange,
  handleGroupClick,
  handleOrgClick,
  handleSelectAllClick
} from "../../helpers/helpersForDropdownFilter";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/DeleteDialog";


export default function OutcomeView({multi, single, organizationUser, groupUser, superUser, organizationUri}) {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    continueButton: false,
    loadingButton: false,
    confirmDialog: '',
    safe: false
  });
  const [indicatorInterfaces, setIndicatorInterfaces] = useState({});
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const minSelectedLength = 1; // Set your minimum length here
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchDataTypeInterfaces('organization')
      .then(({interfaces}) => {
        setOrganizationInterfaces(interfaces);
      }).catch(e => {
      if (e.json)
        console.error(e.json);
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organization Interfaces", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchOrganizationsWithGroups(setOrganizationsWithGroups, organizationInterfaces).catch(e => {
      if (e.json)
        console.error(e.json);
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organization Interfaces", {variant: 'error'});
    })
  }, [organizationInterfaces]);


  useEffect(() => {
    if (multi) {
          fetchDataTypesGivenListOfUris('outcome', '', selectedOrganizations, 'outcomes').then(objectsDict => {
            let outcomes = [];
            for (let organization in objectsDict) {
              outcomes = [...outcomes, ...objectsDict[organization]];
            }

            setState(state => ({...state, loading: false, data: outcomes}));

        
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      });
    }  else if (single) {
      fetchDataType('outcome', encodeURIComponent(uri)).then(({success, outcome}) => {
        if (success) {
          setState(state => ({...state, loading: false, data: [outcome]}));
        }
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    
    }

  }, [selectedOrganizations]);

  useEffect(() => {
      if (single){
        fetchDataTypeInterfaces('indicator').then(({interfaces}) => {
          setIndicatorInterfaces(interfaces);
        })
      }

    
  }, []);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete ' + uri + ' ?'
    }));
  };


  
  const indicatorColumns = [
    {
      label: 'Indicator(s) URI',
      body: (obj) => {
        return obj?._uri || obj
      }
    },
    {
      label: "Indicator(s) Name",
      body: (obj) => {
        return obj?.name || indicatorInterfaces[obj]
      }
    },

    {
      label: ' ',
      body: ({_uri}) => {
        return <DropdownMenu urlPrefix={'indicator'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                             hideEditOption={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                             handleDelete={() => showDeleteDialog(_uri)}/>;
      }
    }
  ];

  const themeColumns = [
    {
      label: 'Theme(s) URI',
      body: (uri) => {
        return uri
      }
    },

    {
      label: ' ',
      body: (uri) => {
        return  <DropdownMenu urlPrefix={'theme'} objectUri={encodeURIComponent(uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(uri)}/>
      }

    }
  ];

  const stakeholderOutcomeColumns = [
    {
      label: 'Stakeholder Outcome(s) URI',
      body: (uri) => {
        return uri
      }
    },

    {
      label: ' ',
      body: ({_uri}) => {
        return  <DropdownMenu urlPrefix={'stakeholderOutcome'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }
  ];

  const codeColumns = [
    {
      label: 'Outcome Code(s) URI',
      body: (uri) => {
        return uri
      }
    },

    {
      label: ' ',
      body: ({_uri}) => {
        return  <DropdownMenu urlPrefix={'code'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;
  console.log(state.data)

  const style = {backgroundColor: 'rgb(39, 44, 52)', color: 'white', width: '9rem'}

    return (
      <Container>
        <Typography variant={'h2'}> Outcomes </Typography>
        <EnhancedTableToolbar numSelected={0}
                              title={''}
                              customToolbar={
                                <div style={{display: 'flex', gap: '10px'}}>
                                {multi ?
                                  <Chip
                                    disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                                    onClick={() => navigate(`/outcome/${encodeURIComponent(uri)}/new`)}
                                    color="primary"
                                    icon={<AddIcon/>}
                                    label="Add new Outcome"
                                    variant="outlined"/> : null}
                                <DropdownFilter selectedOrganizations={selectedOrganizations}
                                                areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)}
                                                organizationInterfaces
                                                handleSelectAllClick={handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations)}
                                                handleChange={handleChange(minSelectedLength, setSelectedOrganizations)}
                                                handleGroupClick={handleGroupClick(areAllGroupOrgsSelected(selectedOrganizations), selectedOrganizations, setSelectedOrganizations)}
                                                handleOrgClick={handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups)}
                                />
                                </div>
                              }
        />

        {
          state.data.map(outcome => {
            return (
                <Container>
                  {/*<EnhancedTableToolbar title={(*/}
                  {/*  <>*/}
                  {/*    Outcome Name: {outcome.name}*/}
                  {/*    <br />*/}
                  {/*    Outcome URI:{' '}*/}
                  {/*    <Link*/}
                  {/*      colorWithHover*/}
                  {/*      to={`/outcome/${encodeURIComponent(outcome._uri)}/view`}*/}
                  {/*    >*/}
                  {/*      {outcome._uri}*/}
                  {/*    </Link>*/}
                  {/*    <br />*/}
                  {/*    Outcome Description: {outcome.description}*/}
                  {/*  </>*/}
                  {/*)}*/}

                  {/*numSelected={0}           */}
                  {/*                      */}

                  {/*/> */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableRow>
                        <TableCell sx={style} variant="head">Outcome
                          Name</TableCell>
                        <TableCell>{outcome.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={style} variant="head">Outcome
                          URI</TableCell>
                        <TableCell sx={{display: 'flex', justifyContent: 'space-between'}}>
                        <Link
                            colorWithHover
                            to={`/outcome/${encodeURIComponent(outcome._uri)}/view`}
                        >{outcome._uri}
                        
                        </Link>
                        <DropdownMenu urlPrefix={'outcome'} objectUri={encodeURIComponent(outcome._uri)} hideDeleteOption={!userContext.isSuperuser}
                        hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(outcome._uri)}/>

                        </TableCell>



                      </TableRow>
                      <TableRow>
                        <TableCell sx={style} variant="head">Outcome
                          Description</TableCell>
                        <TableCell>{outcome.description}</TableCell>
                      </TableRow>
                    </Table>
                  </TableContainer>


                  <DataTable
                      title={'Indicator(s)'}
                      data={outcome.indicators || []}
                      columns={indicatorColumns}
                      uriField="uri"
                  />
                  <DataTable
                      title={'Theme(s)'}
                      data={outcome.themes || []}
                      columns={themeColumns}
                      uriField="uri"
                  />
                  <DataTable
                      title={'Stakeholder Outcome(s)'}
                      data={outcome.stakeholderOutcomes || []}
                      columns={stakeholderOutcomeColumns}
                      uriField="uri"
                  />
                  <DataTable
                      title={'Outcome Code(s)'}
                      data={outcome.codes || []}
                      columns={codeColumns}
                      uriField="uri"
                  />

                  <br/>
                  <br/>

                </Container>


            );
          })
        }
        <DeleteModal
          objectUri={state.selectedUri}
          title={state.deleteDialogTitle}
          show={state.showDeleteDialog}
          onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
          delete={handleDelete('outcome', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        />
        <DeleteDialog
          state={deleteDialog}
          setState={setDeleteDialog}
          handleDelete={handleDelete('outcome', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
          selectedUri={state.selectedUri}
        />
  
      </Container>
    );
  }