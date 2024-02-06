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
  Checkbox,
  MenuList
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
  const [organizationInterfaces, setOrganizationInterfaces] = useState({})
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const [dropDown, setDropDown] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const minSelectedLength = 1; // Set your minimum length here
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);

  const handleMenuClose = () => {
    setAnchorEl(null);
    setDropDown(false);
  };

  useEffect(() => {
    fetchDataTypeInterfaces('organization')
      .then(({interfaces}) => {
        setOrganizationInterfaces(interfaces)
      }).catch(e => {
      if (e.json)
        setErrors(e.json);
      reportErrorToBackend(e);
      setLoading(false);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organization Interfaces", {variant: 'error'});
    })
  }, [])

  useEffect(() => {
    fetchDataTypes('group').then(({groups, success}) => {
      if (success) {
        const organizationsWithGroups = groups?.map(groupObject => {
          return {
            groupName: groupObject.label,
            organizations: groupObject.organizations.map(organizationUri => ({_uri: organizationUri, legalName: organizationInterfaces?.[organizationUri]}))
          };
        });
        console.log(organizationsWithGroups)
        setOrganizationsWithGroups(organizationsWithGroups);
      }
    });
  }, [organizationInterfaces]);

  const handleSelectAllClick = () => {
    const allOrganizationUris = organizationsWithGroups.reduce((acc, group) => {
      return [...acc, ...group.organizations.map(org => org._uri)];
    }, []);

    // If all organizations are already selected, deselect all
    // Otherwise, select all organizations
    const updatedSelectedOrganizations = selectedOrganizations.length === allOrganizationUris.length
      ? []
      : allOrganizationUris;

    // Update the state with the new selection
    setSelectedOrganizations(updatedSelectedOrganizations);
  };

  const handleGroupClick = (group) => {
    const groupOrgs = group.organizations.map((org) => org._uri);

    // If the group is already selected, deselect it and all its organizations;
    // otherwise, select the group and all its organizations
    const updatedSelectedOrganizations = areAllGroupOrgsSelected(group)
      ? selectedOrganizations.filter((org) => !groupOrgs.includes(org))
      : [...selectedOrganizations, ...groupOrgs];

    // Update the state with the new selection
    setSelectedOrganizations(updatedSelectedOrganizations);
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

  const [indicatorReportDict, setIndicatorReportDict] = useState({});

  const handleOrgClick = (organization) => {
    // Check if the clicked organization is currently selected
    const isSelected = selectedOrganizations.includes(organization._uri);

    // Toggle the selection status of the clicked organization
    let updatedSelectedOrganizations;
    if (isSelected) {
      // If the organization is selected, remove it from the selection
      updatedSelectedOrganizations = selectedOrganizations.filter((org) => org !== organization._uri);
    } else {
      // If the organization is not selected, add it to the selection
      updatedSelectedOrganizations = [...selectedOrganizations, organization._uri];
    }

    // Update the state with the new selection
    setSelectedOrganizations(updatedSelectedOrganizations);

    // Find the group to which the organization belongs
    const group = organizationsWithGroups.find((grp) => grp.organizations.some((org) => org._uri === organization._uri));

    // If found and the organization was the only one selected in its group, deselect the group automatically
    if (group && group.organizations.length === 1 && isSelected) {
      handleGroupClick(group);
    }
  };

  // const data = [
  //   {
  //     groupName: "Group A",
  //     organizations: [
  //       {_uri: "org1", legalName: "Organization 1"},
  //       {_uri: "org2", legalName: "Organization 2"},
  //     ],
  //   },
  //   {
  //     groupName: "Group B",
  //     organizations: [
  //       {_uri: "org3", legalName: "Organization 3"},
  //       {_uri: "org4", legalName: "Organization 4"},
  //       // ... other organizations in Group B
  //     ],
  //   },
  //   // ... other groups
  // ];

  const handleMenuItemClick = (item) => {
    // If the clicked item is a group, delegate to handleGroupClick
    if (item.organizations) {
      handleGroupClick(item);
    } else {
      // If the clicked item is an organization, toggle its selection
      const updatedSelectedOrganizations = selectedOrganizations.includes(item._uri)
        ? selectedOrganizations.filter((org) => org !== item._uri)
        : [...selectedOrganizations, item._uri];

      // Update the state with the new selection
      setSelectedOrganizations(updatedSelectedOrganizations);

      // If the clicked organization is being unselected, check if it belongs to a group
      if (!updatedSelectedOrganizations.includes(item._uri)) {
        // Find the group to which the organization belongs
        const group = organizationsWithGroups.find((grp) => grp.organizations.some((org) => org._uri === item._uri));

        // If found, deselect the group automatically
        if (group) {
          handleGroupClick(group);
        }
      }
    }
  };

  const areAllGroupOrgsSelected = (group) => {
    // Check if all organizations in the group are selected
    return group.organizations.every((org) => selectedOrganizations.includes(org._uri));
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
                    if (selected.filter(org => org !== '').length === 0) {
                      return "Organization Filter";
                    }
                    return `Selected Organizations (${selected.filter(org => org !== '').length})`;
                  }}
                >
                  <MenuItem value={null} disabled>
                    <em>Select Organizations</em>
                  </MenuItem>
                  <MenuItem key={'selectedAll'} onClick={handleSelectAllClick}>
                    <Checkbox
                      checked={selectedOrganizations.filter(organization => organization !== '').length === organizationsWithGroups.reduce((acc, group) => acc + group.organizations.length, 0)}/>
                    Select All
                  </MenuItem>
                  {organizationsWithGroups.map((group) => (
                    <div key={group.groupName}>
                      <MenuItem onClick={() => handleGroupClick(group)}>
                        <Checkbox checked={areAllGroupOrgsSelected(group)}/>
                        {group.groupName}
                      </MenuItem>
                      <MenuList style={{paddingLeft: '20px'}}>
                        {group.organizations.map((organization) => (
                          <MenuItem key={organization._uri} onClick={() => handleOrgClick(organization)}>
                            <Checkbox checked={selectedOrganizations.includes(organization._uri)}/>
                            {organization.legalName}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </div>
                  ))}
                </Select>
              </FormControl>

              {/*Dropdown menu for selected organizations*/}
              {/*<Menu open={dropDown} anchorEl={anchorEl} onClose={handleMenuClose}>*/}
              {/*  {selectedOrganizations.map((organization) => (*/}
              {/*    <MenuItem key={organization} onClick={() => handleMenuItemClick(organization)}>*/}
              {/*      <Checkbox checked />*/}
              {/*      {organization}*/}
              {/*    </MenuItem>*/}
              {/*  ))}*/}
              {/*</Menu>*/}
            </div>
          </div>
        }

      />
    </Container>
  );
}