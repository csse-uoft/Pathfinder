import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {useNavigate} from "react-router-dom";
import {fetchDataTypes, fetchDataType, fetchDataTypeInterfaces, deleteDataType} from "../../api/generalAPI";
import {
  areAllGroupOrgsSelected, fetchOrganizationsWithGroups,
  handleChange,
  handleGroupClick, handleOrgClick,
  handleSelectAllClick
} from "../../helpers/helpersForDropdownFilter";
import DropdownFilter from "../shared/DropdownFilter";

export default function OrganizationView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [selectedOrganizations, setSelectedOrganizations] = useState(['']);
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const minSelectedLength = 1; // Set your minimum length here
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);


  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
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
    } else if (single) {
      fetchDataType('organization', encodeURIComponent(uri)).then(res => {
        if (res.success) {
          setState(state => ({...state, loading: false, data: [res.organization]}));
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }

  }, [trigger]);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete organization ' + uri + ' ?'
    }));
  };

  const handleDelete = async (uri, form) => {
    console.log(uri)

    deleteDataType('organization', uri, true).then(({success, message}) => {
      if (success) {
        setState(state => ({
          ...state, showDeleteDialog: false,
        }));
        setTrigger(!trigger);
        enqueueSnackbar(message || "Success", {variant: 'success'});
      }
    }).catch((e) => {
      setState(state => ({
        ...state, showDeleteDialog: false,
      }));
      setTrigger(!trigger);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });

  };

  const columns = [
    {
      label: 'Organization Name',
      body: ({legalName}) => {
        return legalName;
      },
      sortBy: ({legalName}) => legalName
    },
    {
      label: 'Organization URI',
      body: ({_uri}) => {
        if (multi)
          return <Link colorWithHover to={`/organization/${encodeURIComponent(_uri)}/view`}>
            {_uri}
          </Link>;
        if (single)
          return _uri;
      },
    },
    { // todo
      label: 'Organization ID',
      body: ({hasIds}) => {
        return hasIds?.map(hasId => hasId?.hasIdentifier);
      }
    },
    {
      label: 'Legal Status',
      body: ({legalStatus}) => {
        return legalStatus;
      }
    },
    {
      label: ' ',
      body: ({_uri}) => {
        if (multi)
          return <DropdownMenu urlPrefix={'organization'} objectUri={encodeURIComponent(_uri)} hideDeleteOption={!userContext.isSuperuser}
                               hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>;
        if (single)
          return null;
      }


    }
  ];

  if (state.loading)
    return <Loading message={`Loading organizations...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Organizations </Typography>
      <DataTable
        title={multi ? "Organizations" : "Organization"}
        data={state.data.filter(org => selectedOrganizations?.includes(org._uri))}
        columns={columns}
        customToolbar={
          <div style={{display: 'flex', gap: '10px'}}>
            {multi ?
              <Chip
                disabled={!userContext.isSuperuser}
                onClick={() => navigate('/organizations/new')}
                color="primary"
                icon={<AddIcon/>}
                label="Add new Organization"
                variant="outlined"/> : null}
            <DropdownFilter selectedOrganizations={selectedOrganizations}
                            areAllGroupOrgsSelected={areAllGroupOrgsSelected(selectedOrganizations)}
                            organizationInterfaces
                            handleSelectAllClick={handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations)}
                            handleChange={handleChange(minSelectedLength, setSelectedOrganizations)}
                            handleGroupClick={handleGroupClick(areAllGroupOrgsSelected(selectedOrganizations), selectedOrganizations, setSelectedOrganizations)}
                            handleOrgClick={handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups)}/>
          </div>
        }
      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete}
      />
    </Container>
  );
}
