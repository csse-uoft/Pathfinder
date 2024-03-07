import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container} from "@mui/material";
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
import DropdownFilter from "../shared/DropdownFilter";
import {
  areAllGroupOrgsSelected,
  handleChange,
  handleGroupClick,
  handleOrgClick,
  handleSelectAllClick
} from "../../helpers/helpersForDropdownFilter";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";

export default function OutcomeView({multi, single, organizationUser, groupUser, superUser, organizationUri}) {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false,
  });
  const [trigger, setTrigger] = useState(true);
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const minSelectedLength = 1;
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);
  const [indicatorInterfaces, setIndicatorInterfaces] = useState({})

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
            console.log(objectsDict);
            let outcomes = [];
            for (let organization in objectsDict) {
              outcomes = [...outcomes, ...objectsDict[organization]];
            }
            console.log(outcomes);
            setState(state => ({...state, loading: false, data: outcomes}));

        
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      });
    }  else if (single) {

    }

  }, [selectedOrganizations]);

  useEffect(() => {
    if (single) {
      fetchDataTypeInterfaces('indicator').then(({interfaces}) => {
        setIndicatorInterfaces(interfaces);
      })
    }
  }, [])

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
      body: ({_uri}) => {
        return _uri
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
        return  <DropdownMenu urlPrefix={'outcome'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable}
                              hideDeleteOption
                              handleDelete={() => showDeleteDialog(_uri)}/>
      }

    }
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;

  return (
    <Container>
      {
        state.data.map(outcome => {
          return (
            <Container>
              <EnhancedTableToolbar title={(
                <>
                  Outcome Name: {outcome.name}
                  <br />
                  Outcome URI:{' '}
                  <Link
                    colorWithHover
                    to={`/outcome/${encodeURIComponent(outcome._uri)}/view`}
                  >
                    {outcome._uri}
                  </Link>
                  <br />
                  Outcome Description: {outcome.description}
                </>
              )}
                                    numSelected={0}
                                    customToolbar={    <div style={{display: 'flex', gap: '10px'}}>

                                      {multi ?           
                                      <Chip
                                      disabled={!userContext.isSuperuser && !userContext.editorOfs.length}
                                      onClick={() => navigate('/outcome/new')}
                                      color="primary"
                                      icon={<AddIcon/>}
                                      label="Add a new Outcome"
                                      variant="outlined"/>: null}

                                      <DropdownFilter selectedOrganizations={selectedOrganizations}
                                    areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)} organizationInterfaces
                                    handleSelectAllClick={handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations)}
                                    handleChange={handleChange(minSelectedLength, setSelectedOrganizations)}
                                    handleGroupClick={handleGroupClick(areAllGroupOrgsSelected(selectedOrganizations), selectedOrganizations, setSelectedOrganizations)}
                                    handleOrgClick={handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups)}/>
                                    </div>               
                                    }              
                                    
              />
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

            </Container>


          );
        })
      }

    </Container>
  );
}