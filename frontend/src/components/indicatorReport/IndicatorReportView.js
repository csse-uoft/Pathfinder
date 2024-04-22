import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {
  fetchDataTypeInterfaces,
  fetchDataTypes,
  fetchDataTypesGivenListOfUris
} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";
import {
  areAllGroupOrgsSelected,
  fetchOrganizationsWithGroups, handleChange, handleGroupClick, handleOrgClick,
  handleSelectAllClick
} from "../../helpers/helpersForDropdownFilter";
import DropdownFilter from "../shared/DropdownFilter";

export default function IndicatorReportView({single, multi, organizationUser, groupUser, superUser, organizationUri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const {uri} = useParams();
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const minSelectedLength = 1; // Set your minimum length here
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);

  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [indicatorReportDict, setIndicatorReportDict] = useState({})
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
    if (state.data?.length) {
      fetchDataTypes('indicatorReport').then(({indicatorReports, success}) => {
        if (success) {
          const indicatorReportDict = {}
          indicatorReports.map(indicatorReport => {
            indicatorReportDict[indicatorReport._uri] = indicatorReport;
          })
          setIndicatorReportDict(indicatorReportDict)
        }
      })
    }
  }, [state])

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
    }  else if (single) {

    }

  }, [selectedOrganizations]);

  const columns = [
    {
      label: 'Indicator Report Name',
      body: (indicatorReportUri) => {
        return indicatorReportDict[indicatorReportUri]?.name;
      }
    },
    {
      label: 'Time Interval of Report',
      body: (indicatorReportUri) => {
        const hasTime = indicatorReportDict[indicatorReportUri]?.hasTime
        return (hasTime?.hasBeginning?.date && hasTime?.hasEnd?.date)? `${(new Date(hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(hasTime.hasEnd.date)).toLocaleString()}` : null
      }
    },
    {
      label: 'Indicator Report Value',
      body: (indicatorReportUri) => {
        return indicatorReportDict[indicatorReportUri]?.value?.numericalValue;
      }
    },

    {
      label: 'Comment',
      body: (indicatorReportUri) => {
        return indicatorReportDict[indicatorReportUri]?.comment;
      }
    },



    {
      label: ' ',
      body: (indicatorReportUri) => {
        return <DropdownMenu urlPrefix={'indicatorReport'} objectUri={encodeURIComponent(indicatorReportUri)} hideDeleteOption
                             hideEditOption={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                             handleDelete={() => showDeleteDialog(indicatorReportUri)}/>;
      }
    }
  ];

  if (state.loading)
    return <Loading message={`Loading indicators...`}/>;

  console.log(state.data)

  return (
    <Container>
      <Typography variant={'h2'}> Indicator Reports </Typography>
      <EnhancedTableToolbar title={'Indicators'}
                            numSelected={0}
                            customToolbar={
                              <div style={{display: 'flex', gap: '10px'}}>
                                {multi ?
                                  <Chip
                                    disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                                    onClick={() => navigate(`/indicatorReport/${encodeURIComponent(uri)}/new`)}
                                    color="primary"
                                    icon={<AddIcon/>}
                                    label="Add new Indicator Report"
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
        state.data.map(indicator =>
          <DataTable
            title={(
              <>
                Indicator:{' '}
                <Link
                  colorWithHover
                  to={`/indicator/${encodeURIComponent(indicator._uri)}/view`}
                >
                  {indicator.name}
                </Link>

              </>
            )}
            data={indicator.indicatorReports || []}
            columns={columns}
            uriField="uri"
          />
        )
      }

    </Container>
  );

}
