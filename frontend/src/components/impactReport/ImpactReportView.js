import React, {useEffect, useState, useContext} from 'react';
import {Container, Chip,Paper, Table, TableContainer, Typography} from "@mui/material";
import {Add as AddIcon,} from "@mui/icons-material";
import {DropdownMenu, Link, Loading, DataTable, DeleteModal} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import {
  fetchDataType,
  fetchDataTypeInterfaces,
  fetchDataTypesGivenListOfUris
} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";
import DropdownFilter from "../shared/DropdownFilter";
import {
  areAllGroupOrgsSelected, fetchOrganizationsWithGroups,
  handleChange,
  handleGroupClick, handleOrgClick,
  handleSelectAllClick
} from "../../helpers/helpersForDropdownFilter";
import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/dialogs/DeleteDialog";

export default function ImpactReportView({multi, single, organizationUser, superUser, groupUser}) {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const userContext = useContext(UserContext);
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const minSelectedLength = 1; // Set your minimum length here
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false
  });
  const [deleteDialog, setDeleteDialog] = useState({
    continueButton: false,
    loadingButton: false,
    confirmDialog: '',
    safe: false
  });
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
      // fetchDataTypes('impactReport', 'all').then(res => {
      //   if (res.success)
      //     setState(state => ({...state, loading: false, data: res.impactReports, editable: res.editable}));
      // }).catch(e => {
      //   reportErrorToBackend(e);
      //   setState(state => ({...state, loading: false}));
      //   console.log(e);
      //   enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      // });
    } else if (single) {
      fetchDataType('impactReport', encodeURIComponent(uri)).then(res => {
        if (res.success)
        setState(state => ({...state, loading: false, data: [res.impactReport], editable: res.editable}));
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        console.log(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }

  }, [trigger]);


  useEffect(() => {
    if (multi) {
      fetchDataTypesGivenListOfUris('impactReport', '', selectedOrganizations, 'impactReports').then(objectsDict => {
        let impactReports = [];
        for (let organization in objectsDict) {
          impactReports = [...impactReports, ...objectsDict[organization]];
        }
        setState(state => ({...state, loading: false, data: impactReports}));
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }  else if (single) {

    }

  }, [selectedOrganizations]);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete code ' + uri + ' ?'
    }));
  };

  const columns = [
    {
      label: 'Impact Scale',
      body: ({impactScale}) => {
        return impactScale;

      },
    },

    {
      label: 'Impact Depth',
      body: ({impactDepth}) => {
        return impactDepth;

      },
      sortBy: ({name}) => name
    },
    {
      label: 'Stakeholder Outcome(s)',
      body: ({forStakeholderOutcome}) => {
        return <Link colorWithHover to={`/stakeholderOutcome/${encodeURIComponent(forStakeholderOutcome?._uri)}/view`}>
          {forStakeholderOutcome?.name}
        </Link>;
      }
    },


    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'impactScale'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                      hideDeleteOption
                      handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading Impact Reports...`}/>;

  const style = {backgroundColor: 'rgb(39, 44, 52)', color: 'white', width: '12rem'}

  return (
    <Container>
      <Typography variant={'h2'}> Impact Reports </Typography>
      <EnhancedTableToolbar title={''}
                            numSelected={0}
                            customToolbar={
                              <div style={{display: 'flex', gap: '10px'}}>
                                {multi ?
                                  <Chip
                                    disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                                    onClick={() => navigate(`/impactReport/new`)}
                                    color="primary"
                                    icon={<AddIcon/>}
                                    label="Add new Impact Report"
                                    variant="outlined"/> : null}
                                <DropdownFilter selectedOrganizations={selectedOrganizations}
                                                areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)} organizationInterfaces={organizationInterfaces}
                                                setSelectedOrganizations={setSelectedOrganizations}
                                                handleSelectAllClick={handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations)}
                                                handleChange={handleChange(minSelectedLength, setSelectedOrganizations)}
                                                handleGroupClick={handleGroupClick(areAllGroupOrgsSelected(selectedOrganizations), selectedOrganizations, setSelectedOrganizations)}
                                                handleOrgClick={handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups)}/>
                              </div>
                            }

      />
      {
        state.data.map(impactReport => {
        const hasTime = impactReport?.hasTime;
        return (

        <Container>
        <TableContainer component={Paper}>
          <Table>

            <TableRow>
              <TableCell sx={style} variant="head">Impact Report</TableCell>
              <TableCell>{impactReport?.name}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell sx={style} variant="head">Organization</TableCell>
              <TableCell>
                <Link
                  colorWithHover
                  to={`/organization/${encodeURIComponent(impactReport?.forOrganization)}/view`}
                >
                  {impactReport?.forOrganization}
                </Link>
              </TableCell>
            </TableRow>

          <TableRow>
            <TableCell sx={style} variant="head">Impact Report URI</TableCell>
            <TableCell sx={{display: 'flex', justifyContent: 'space-between'}}>
              <Link
                colorWithHover
                to={`/impactReport/${encodeURIComponent(impactReport._uri)}/view`}
              >
                {impactReport?._uri}
              </Link>
              <DropdownMenu urlPrefix={'impactReport'}
                                        objectUri={encodeURIComponent(impactReport._uri)} hideDeleteOption={!userContext.isSuperuser}
                                        hideEditOption={!userContext.isSuperuser}
                                        handleDelete={() => showDeleteDialog(impactReport._uri)}/>
            </TableCell>
          </TableRow>

        <TableRow>
          <TableCell sx={style} variant="head">Time Interval of Report</TableCell>
          <TableCell>
            {(hasTime?.hasBeginning?.date && hasTime?.hasEnd?.date) ?
              `${(new Date(hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(hasTime.hasEnd.date)).toLocaleString()}`
              : null}
          </TableCell>
        </TableRow>

          <TableRow>
            <TableCell sx={style} variant="head">Comment</TableCell>
            <TableCell>{impactReport.comment}</TableCell>
          </TableRow>

        </Table>
      </TableContainer>

          <DataTable
            noHeaderBar
            noPaginationBar
            title={""}
            data={[impactReport]}
            columns={columns}
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
        delete={handleDelete('impactReport', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('impactReport', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
</Container>
  );
}