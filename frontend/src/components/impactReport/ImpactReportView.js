import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon,} from "@mui/icons-material";
import {DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {
  fetchDataTypes,
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
          console.log(res);
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
        console.log(objectsDict);
        let impactReports = [];
        for (let organization in objectsDict) {
          impactReports = [...impactReports, ...objectsDict[organization]];
        }
        console.log(impactReports);
        setState(state => ({...state, loading: false, data: impactReports}));
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }  else if (single) {

    }

  }, [selectedOrganizations]);

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
        <DropdownMenu urlPrefix={'impactReport'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                      hideDeleteOption
                      handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading Impact Reports...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Impact Report Class View </Typography>
      <EnhancedTableToolbar title={'Impact Reports'}
                            numSelected={0}
                            customToolbar={
                              <div style={{display: 'flex', gap: '10px'}}>
                                {multi ?
                                  <Chip
                                    disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                                    onClick={() => navigate(`/impactReport/${encodeURIComponent(uri)}/new`)}
                                    color="primary"
                                    icon={<AddIcon/>}
                                    label="Add new Impact Report"
                                    variant="outlined"/> : null}
                                <DropdownFilter selectedOrganizations={selectedOrganizations}
                                                areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)} organizationInterfaces
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
              />
            </Container>
          );
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
