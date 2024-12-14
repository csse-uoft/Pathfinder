import React, { useEffect, useState, useContext } from 'react';
import {Chip, Container, Typography} from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/dialogs/DeleteDialog";

export default function ThemeNetworkView({single, multi, organizationUser, groupUser, superUser}) {
  const {uri} = useParams();
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    continueButton: false,
    loadingButton: false,
    confirmDialog: '',
    safe: false
  });
  const [trigger, setTrigger] = useState(true);


  useEffect(() => {
    if (multi) {
      fetchDataTypes('themeNetwork').then(res => {
        if(res.success)
          setState(state => ({...state, loading: false, data: res.themeNetworks}));
      }).catch(e => {
        setState(state => ({...state, loading: false}))
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if(single) {
      fetchDataType('themeNetwork', encodeURIComponent(uri)).then(({themeNetwork, success}) => {
        if (success) {
          setState(state => ({...state, loading: false, data: [themeNetwork]}));
        }
      }).catch(e => {
        setState(state => ({...state, loading: false}))
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }

  }, [trigger]);


  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete themeNetwork ' + uri + ' ?'
    }));
  };

  const columns = [
    {
      label: 'Theme Network Name',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: 'Theme Network URI',
      body: ({_uri}) => {
        // return <Link colorWithHover to={`/theme/${encodeURIComponent(_uri)}/view`}>
        //   {_uri}
        // </Link>
        return _uri
      },
      sortBy: ({legalName}) => legalName
    },
    {
      label: 'Theme Network Description',
      body: ({description}) => {
        return description;
      }
    },
    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'themeNetwork'} objectUri={encodeURIComponent(_uri)} hideDeleteOption={!userContext.isSuperuser}
                      hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading theme networks...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Theme Networks </Typography>
      <DataTable
        title={multi ? "Theme Networks": 'Theme Network'}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={
          multi?
            <Chip
              disabled={!userContext.isSuperuser}
              onClick={() => navigate('/themeNetwork/new')}
              color="primary"
              icon={<AddIcon/>}
              label="Add new Theme Network"
              variant="outlined"/>:null
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('themeNetwork', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('themeNetwork', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}