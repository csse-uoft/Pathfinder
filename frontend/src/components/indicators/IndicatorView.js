import React, {useEffect, useState, useContext} from 'react';
import {
  Chip,
  Container,
  Menu,
  MenuItem,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Input,
  Checkbox
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

export default function IndicatorView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [outcomeInterfaces, setOutcomeInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const [dropDown, setDropDown] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const minSelectedLength = 1; // Set your minimum length here

  const [organizations, setOrganizations] = useState([]);

  const handleMenuClose = () => {
    setAnchorEl(null);
    setDropDown(false);
  };

  const handleMenuItemClick = (organization) => {
    if (selectedOrganizations.includes(organization)) {
      setSelectedOrganizations(selectedOrganizations.filter((org) => org !== organization));
    } else {
      setSelectedOrganizations([...selectedOrganizations, organization]);
    }
  };
  const handleChange = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue.length >= minSelectedLength) {
      setSelectedOrganizations(selectedValue);
    }
  };

  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });

  useEffect(() => {
    fetchDataTypes('organization').then(res => {
      if (res.success) {
        setOrganizations(res.organizations);
      }
    }).catch(e => {
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const [trigger, setTrigger] = useState(true);

  const [indicatorReportDict, setIndicatorReportDict] = useState({});

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
        console.log(indicators)
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

            <div>
              <FormControl>
                <Select
                  style={{width: '250px'}}
                  labelId="organization-label"
                  id="organization-select"
                  multiple
                  value={selectedOrganizations}
                  onChange={handleChange}
                  input={<Input/>}
                  renderValue={(selected) => {
                    if (selected.length === 1) {
                      return "Organization Filter";
                    }

                    return `Selected Organizations (${selected.length - 1})`;
                  }}
                >
                  <MenuItem value={null} disabled>
                    <em>Select Organizations</em>
                  </MenuItem>
                  {organizations.map((organization) => (
                    <MenuItem key={organization._uri} onClick={() => handleMenuItemClick(organization._uri)}>
                      <Checkbox checked={selectedOrganizations.includes(organization._uri)}/>
                      {organization.legalName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Dropdown menu for selected organizations */}
              <Menu
                open={dropDown}
                anchorEl={anchorEl}
                onClose={handleMenuClose}
              >
                {selectedOrganizations.map((organization) => (
                  <MenuItem key={organization} onClick={() => handleMenuItemClick(organization)}>
                    <Checkbox checked/>
                    {organization}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </div>
        }

      />
    </Container>
  );
}