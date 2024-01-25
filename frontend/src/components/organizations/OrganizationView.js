import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon} from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useSnackbar } from 'notistack';
import {deleteOrganization} from "../../api/organizationApi";
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {useNavigate} from "react-router-dom";
import {fetchDataTypes, fetchDataType} from "../../api/generalAPI";

export default function OrganizationView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);


  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    if (multi) {
      fetchDataTypes('organization').then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.organizations}));
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

  const showDeleteDialog = (id) => {
    setState(state => ({
      ...state, selectedId: id, showDeleteDialog: true,
      deleteDialogTitle: 'Delete organization ' + id + ' ?'
    }));
  };

  const handleDelete = async (id, form) => {

    deleteOrganization(id).then(({success, message}) => {
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
          return _uri
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
          return <DropdownMenu urlPrefix={'organization'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                               hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
        if (single)
          return null
      }


    }
  ];

  if (state.loading)
    return <Loading message={`Loading organizations...`}/>;

  return (
    <Container>
      <DataTable
        title={multi?"Organizations":"Organization"}
        data={state.data}
        columns={columns}
        customToolbar={multi?
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/organizations/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Organization"
            variant="outlined"/>:null
        }
      />
      <DeleteModal
        objectId={state.selectedId}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete}
      />
    </Container>
  );
}
