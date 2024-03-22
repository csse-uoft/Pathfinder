import React, {useEffect, useState, useContext} from 'react';
import {
  Chip,
  Container,
  Typography,
} from "@mui/material";
import {Add as AddIcon} from "@mui/icons-material";
import {DropdownMenu, Link, Loading, DataTable} from "../shared";
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


  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
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
        console.log(objectsDict);
        let indicators = [];
        for (let organization in objectsDict) {
          indicators = [...indicators, ...objectsDict[organization]];
        }
        console.log(indicators);
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
        console.log(baseline);
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
        return <DropdownMenu urlPrefix={'indicator'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                             hideEditOption={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                             handleDelete={() => showDeleteDialog(_uri)}/>;
      }
    }
  ];

  if (state.loading)
    return <Loading message={`Loading indicators...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Indicator Class View </Typography>
      <DataTable
        title={multi ? "Indicators" : "Indicator"}
        data={state.data.filter(indicator => selectedOrganizations.includes(indicator.forOrganization))}
        columns={columns}
        uriField="uri"
        customToolbar={
          <div style={{display: 'flex', gap: '10px'}}>
            {multi ?
              <Chip
                disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                onClick={() => navigate(`/indicator/${encodeURIComponent(uri)}/new`)}
                color="primary"
                icon={<AddIcon/>}
                label="Add new Indicator"
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
    </Container>
  );
}