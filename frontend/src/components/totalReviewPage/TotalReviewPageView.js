import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {
  fetchDataType,
  fetchDataTypeInterfaces,
  fetchDataTypes,
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

export default function totalReviewPageView({multi, single, organizationUser, groupUser, superUser}) {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [outcomeDict, setOutcomeDict] = useState({});
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false,
  });

  const [indicatorDict, setIndicatorDict] = useState({});

  const [themeDict, setThemeDict] = useState({});

  const [themesUnderOrganization, setThemesUnderOrganization] = useState({})

  const [indicatorReportDict, setIndicatorReportDict] = useState({});

  const [organization2StakeholderUri, setOrganization2StakeholderUri] = useState({});

  const [stakeholderDict, setStakeholderDict] = useState({});

  const [characteristicDict, setCharacteristicDict] = useState({});

  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);

  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);

  const [organizationInterfaces, setOrganizationInterfaces] = useState({});

  const minSelectedLength = 1; // Set your minimum length here

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
    if (state.data.length) {
      const indicatorReportDict = {};
      Promise.all(state.data.map((organization) => {
        return fetchDataTypes('indicatorReport').then(res => {
          if (res.success) {
            res.indicatorReports.map(indicatorReport => {
              indicatorReportDict[indicatorReport._uri] = indicatorReport;
            });
          }
        });
      })).then(() => {
        setIndicatorReportDict(indicatorReportDict);
      });
    }
  }, [state]);



  useEffect(() => {
    if (state.data.length) {
      const organization2StakeholderUri = {}
      Promise.all(state.data.map((organization) => {
        return fetchDataTypes('stakeholder', `organization/${encodeURIComponent(organization._uri)}`).then(res => {
          if (res.success) {
            organization2StakeholderUri[organization._uri] = [...(organization2StakeholderUri[organization._uri] || []), ...(res.stakeholders || [])]
          }
        });
      })).then(() => {
        setOrganization2StakeholderUri(organization2StakeholderUri);
      });
    }
  }, [state]);



  // useEffect(() => {
  //   if (multi) {
  //     // fetchDataTypes('organization').then(res => {
  //     //   if (res.success)
  //     //     setState(state => ({...state, loading: false, data: res.organizations, editable: res.editable}));
  //     //   console.log("HELOL")
  //     //   console.log(res.organizations);
  //     // }).catch(e => {
  //     //   console.log(e)
  //     //   reportErrorToBackend(e);
  //     //   setState(state => ({...state, loading: false}));
  //     //   navigate('/dashboard');
  //     //   enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
  //     // });
  //   } else if (single) {
  //     fetchDataType('organization', encodeURIComponent(uri)).then(({success, organization}) => {
  //       if (success)
  //         setState(state => ({...state, loading: false, data: [organization]}));
  //     }).catch(e => {
  //       console.log(e)
  //       reportErrorToBackend(e);
  //       setState(state => ({...state, loading: false}));
  //       navigate('/dashboard');
  //       enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
  //     });
  //   }
  //
  // }, [trigger]);

  useEffect(() => {
    if (multi) {
      fetchDataTypes('organization').then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.organizations}));
        console.log(res.organizations)
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
      // fetchDataTypesGivenListOfUris('organization', '', selectedOrganizations, 'organizations').then(objectsDict => {
      //   console.log(objectsDict)
      //     // var filteredOrganization = res.organizations.filter(o => {
      //     //   return selectedOrganizations.includes(o._uri);
      //     // })
      //   let organizations = [];
      //   for (let organization in objectsDict) {
      //     organizations = [...organizations, ...objectsDict[organization]];
      //   }
      //   setState(state => ({...state, loading: false, data: organizations}));
      //   // setState(state => ({...state, loading: false, data: objectsDict, editable: res.editable}));
      //
      //
      //
      //     // setState(state => ({...state, loading: false, data: filteredOrganization, editable: res.editable}));
      //   console.log("HELOL")
      //   // console.log(res.organizations);
      // }).catch(e => {
      //   console.log(e)
      //   reportErrorToBackend(e);
      //   setState(state => ({...state, loading: false}));
      //   navigate('/dashboard');
      //   enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      // });
    } else if (single) {

    }
  }, [selectedOrganizations]);

  useEffect(() => {
    fetchDataTypes('outcome', 'all').then(res => {
      if (res.success) {
        const outcomeDict = {};
        res.outcomes.map(outcome => {
          outcomeDict[outcome._uri] = outcome;
        });
        setOutcomeDict(outcomeDict);
      }
    }).catch(e => {
      console.log(e)
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchDataTypes('stakeholder').then(res => {
      if (res.success) {
        const stakeholderDict = {};
        res.stakeholders.map(stakeholder => {
          stakeholderDict[stakeholder._uri] = stakeholder;
        });
        setStakeholderDict(stakeholderDict);
      }
    }).catch(e => {
      console.log(e)
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchDataTypes('characteristic').then(res => {
      if (res.success) {
        const characteristicDict = {};
        res.characteristics.map(characteristic => {
          characteristicDict[characteristic._uri] = characteristic;
        });
        setCharacteristicDict(characteristicDict);
      }
    }).catch(e => {
      console.log(e)
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchDataTypes('indicator', 'all').then(res => {
      if (res.success) {
        const indicatorDict = {};
        res.indicators.map(indicator => {
          indicatorDict[indicator._uri] = indicator;
        });
        setIndicatorDict(indicatorDict);
      }
    }).catch(e => {
      console.log(e)
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchDataTypes('theme').then(res => {
      if (res.success) {
        const themeDict = {};
        res.themes.map(theme => {
          themeDict[theme._uri] = theme;
        });
        setThemeDict(themeDict);
      }
    }).catch(e => {
      console.log(e)
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    if (state.data.length && Object.keys(themeDict).length && outcomeDict) {
      const themes = {}; // key is organizations
      state.data.map(organization => {
        const outcomes = organization.hasOutcomes?.map(outcomeUri => outcomeDict[outcomeUri]);
        outcomes?.map(outcomeObject => {
          if (outcomeObject) {
            const themesUnderOutcome = outcomeObject.themes?.map(themeUri => themeDict[themeUri]);
            themes[organization._uri] = [...(themes[organization._uri] || []), ...(themesUnderOutcome || [])];
          }
        });
      });
      setThemesUnderOrganization(themes)
    }
  }, [themeDict, state.data, outcomeDict]);


  const indicatorColumns = [
    {
      label: 'Indicator',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: "Indicator Description",
      body: ({description}) => {
        return description;
      }
    },
    {
      label: ["Indicator Report", 'Value'],
      colSpan: 2,
      body: ({indicatorReports}) => {
        return indicatorReports?.map(indicatorReportUri => {
          return [indicatorReportDict[indicatorReportUri]?.name || 'Not Given',
            indicatorReportDict[indicatorReportUri]?.value?.numericalValue || ''
          ];
        });
      }
    },
    {
      label: ' ',
      body: ({_uri}) => {
        return  <DropdownMenu urlPrefix={'indicatorReport'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                                                                             hideDeleteOption
                                                                             handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }

  ];

  const themeColumns = [
    {
      label: 'Theme',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: 'Description',
      body: ({description}) => {
        return description;
      }
    },
    {
      label: ' ',
      body: ({_uri}) => {
        return  <DropdownMenu urlPrefix={'theme'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }
  ];

  const stakeholderOutcomeColumns = [
    {
      label: 'Stakeholder Outcome(s) URI',
      body: (uri) => {
        return uri;
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

  const outcomeColumns = [
    {
      label: 'Outcome',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: 'Outcome Description',
      body: ({description}) => {
        return description;
      }
    },
    {
      label: ' ',
      body: ({_uri}) => {
        return  <DropdownMenu urlPrefix={'outcome'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }
  ];

  const stakeholderColumns = [
    {
      label: 'Stakeholder',
      body: ({legalName}) => {
        return legalName;
      }
    },
    {
      label: 'Stakeholder Characteristics',
      body: ({characteristics}) => {
        return characteristics?.map(characteristicUri => characteristicDict[characteristicUri]?.name);
      }
    },
    {
      label: 'Stakeholder Outcomes',
      body: ({stakeholderOutcomes}) => {
        return stakeholderOutcomes;
      }
    },
    {
      label: ' ',
      body: ({_uri}) => {
        return  <DropdownMenu urlPrefix={'stakeholder'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Total Review Page </Typography>
      <EnhancedTableToolbar numSelected={0}
                            title={'Total Review'}
                            customToolbar={
                              <DropdownFilter selectedOrganizations={selectedOrganizations}
                                              areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)}
                                              organizationInterfaces
                                              handleSelectAllClick={handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations)}
                                              handleChange={handleChange(minSelectedLength, setSelectedOrganizations)}
                                              handleGroupClick={handleGroupClick(areAllGroupOrgsSelected(selectedOrganizations), selectedOrganizations, setSelectedOrganizations)}
                                              handleOrgClick={handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups)}
                              />
                            }
      />


      {
        state.data.filter(org => selectedOrganizations?.includes(org._uri)).map(organization => {
          return (
            <Container>
              <EnhancedTableToolbar title={(
                <>
                  Organization: {organization.legalName}
                  <br/>
                  Organization URI:{' '}
                  <Link
                    colorWithHover
                    to={`/organization/${encodeURIComponent(organization._uri)}/view`}
                  >
                    {organization._uri}
                  </Link>
                </>
              )}
                                    numSelected={0}


              />
              <DataTable
                noHeaderBar
                data={themesUnderOrganization[organization._uri] || []}
                columns={themeColumns}
                uriField="uri"
              />
              <DataTable
                noHeaderBar
                data={organization?.hasOutcomes?.map(uri => outcomeDict[uri] || {}) || []}
                columns={outcomeColumns}
                uriField="uri"
              />
              <DataTable
                noHeaderBar
                data={organization?.hasIndicators?.map(uri => indicatorDict[uri] || {}) || []}
                columns={indicatorColumns}
                uriField="uri"
              />

              <DataTable
                noHeaderBar
                data={(() => {
                  const stakeholderUris = organization2StakeholderUri[organization._uri];
                  return stakeholderUris?.map(stakeholderUri => stakeholderDict[stakeholderUri]) || [];
                })()}
                columns={stakeholderColumns}
                uriField="uri"
              />

            </Container>


          );
        })
      }

    </Container>
  );
}