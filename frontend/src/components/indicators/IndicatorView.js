
import React, { useEffect, useState, useContext } from 'react';
import {Chip, Container, Typography} from "@mui/material";
import { Add as AddIcon} from "@mui/icons-material";
import {DropdownMenu, Link, Loading, DataTable, DeleteModal} from "../shared";

import {useNavigate,} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
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


import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/dialogs/DeleteDialog";

export default function IndicatorView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [outcomeInterfaces, setOutcomeInterfaces] = useState({});
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const minSelectedLength = 1; // Set your minimum length here
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);
  const [indicatorReportDict, setIndicatorReportDict] = useState({});
  const [trigger, setTrigger] = useState(true);


  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });

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
  
  const [deleteDialog, setDeleteDialog] = useState({
    continueButton: false,
    loadingButton: false,
    confirmDialog: '',
    safe: false
  });

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete Indicator ' + uri + ' ?'
    }));
  };

  useEffect(() => {
    fetchDataTypes('indicatorReport', single ? `indicator/${encodeURIComponent(uri)}` : '').then(({
                                                                                                    success,
                                                                                                    indicatorReports
                                                                                                  }) => {
      if (success) {
        const indicatorReportDict = {};
        indicatorReports.map(indicatorReport => {
          indicatorReportDict[indicatorReport._uri] = indicatorReport;
        });
        setIndicatorReportDict(indicatorReportDict);
      }
    });
  }, [state]);

  useEffect(() => {
    fetchDataTypeInterfaces('outcome').then(({interfaces}) => setOutcomeInterfaces(interfaces));
  }, []);

  useEffect(() => {
    if (multi) {
      fetchDataTypesGivenListOfUris('indicator', '', selectedOrganizations, 'indicators').then(objectsDict => {
        let indicators = [];
        for (let organization in objectsDict) {
          indicators = [...indicators, ...objectsDict[organization]];
        }
        setState(state => ({...state, loading: false, data: indicators}));
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (single) {
      fetchDataType('indicator', encodeURIComponent(uri)).then(({success, indicator}) => {
        if (success) {
          setState(state => ({...state, loading: false, data: [indicator]}));
        }
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }

  }, [selectedOrganizations]);

  const columns = [
    {
      label: 'Indicator Name',
      body: ({name}) => {
        return name;

      },
      sortBy: ({name}) => name
    },
    {
      label: 'Indicator URI',
      body: ({_uri}) => {
        return <Link colorWithHover to={`/indicator/${encodeURIComponent(_uri)}/view`}>
          {_uri}
        </Link>;

      },
    },
    {
      label: 'Indicator Description',
      body: ({description}) => {
        return description;
      },
    },
    {
      label: 'Outcome(s) URI',
      colSpan: 2,
      body: ({forOutcomes}) => {
        return forOutcomes?.map(outcomeUri => [<Link colorWithHover
                                                     to={`/outcome/${encodeURIComponent(outcomeUri)}/view`}>
          {outcomeUri}
        </Link>, outcomeInterfaces[outcomeUri]]);
      },
    },
    {
      label: 'Outcome(s) Name',
    },
    {
      label: 'Indicator Baseline',
      body: ({baseline}) => {
        return baseline?.numericalValue;
      }
    },
    {
      label: 'IndicatorReport URI',
      colSpan: 3,
      body: ({indicatorReports}) => {
        return indicatorReports?.map(indicatorReportUri => [<Link colorWithHover
                                                                  to={`/indicatorReport/${encodeURIComponent(indicatorReportUri)}/view`}>
          {indicatorReportUri}
        </Link>,
          indicatorReportDict[indicatorReportUri]?.value?.numericalValue,
          (indicatorReportDict[indicatorReportUri]?.hasTime?.hasBeginning?.date && indicatorReportDict[indicatorReportUri]?.hasTime?.hasEnd?.date) ? `${(new Date(indicatorReportDict[indicatorReportUri]?.hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReportDict[indicatorReportUri]?.hasTime.hasEnd.date)).toLocaleString()}` : null
        ]);
      }
    },
    {
      label: 'IndicatorReport Value'
    },
    {
      label: 'IndicatorReport Time Interval'
    },

    {
      label: ' ',
      body: ({_uri}) => {
        return <DropdownMenu urlPrefix={'indicator'} objectUri={encodeURIComponent(_uri)} hideDeleteOption={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                             hideEditOption={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                             handleDelete={() => showDeleteDialog(_uri)}/>;
      }
    }
  ];

  if (state.loading)
    return <Loading message={`Loading indicators...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Indicators </Typography>
      <DataTable
        title={multi ? "Indicators" : "Indicator"}
        data={single? state.data : state.data.filter(indicator => selectedOrganizations.includes(indicator.forOrganization))}
        columns={columns}
        uriField="uri"
        customToolbar={
          <div style={{display: 'flex', gap: '10px'}}>
            {multi ?
              <Chip
                disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                onClick={() => navigate(`/indicator/new`)}
                color="primary"
                icon={<AddIcon/>}
                label="Add new Indicator"
                variant="outlined"/> : null}
            {multi? <DropdownFilter selectedOrganizations={selectedOrganizations}
                             areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)}
                             setSelectedOrganizations={setSelectedOrganizations} organizationInterfaces={organizationInterfaces}
                             handleSelectAllClick={handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations)}
                             handleChange={handleChange(minSelectedLength, setSelectedOrganizations)}
                             handleGroupClick={handleGroupClick(areAllGroupOrgsSelected(selectedOrganizations), selectedOrganizations, setSelectedOrganizations)}
                             handleOrgClick={handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups)}/>: null}
          </div>
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('indicator', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('indicator', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}