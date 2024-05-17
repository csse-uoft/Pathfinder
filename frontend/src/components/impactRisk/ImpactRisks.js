import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {deleteTheme} from "../../api/themeApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes} from "../../api/generalAPI";
import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/DeleteDialog";


export default function ImpactRisks() {
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
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchDataTypes('impactRisk').then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.impactRisks}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const [deleteDialog, setDeleteDialog] = useState({
    continueButton: false,
    loadingButton: false,
    confirmDialog: '',
    safe: false
  });

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete ImpactRisk ' + uri + ' ?'
    }));
  };

  const columns = [
    {
      label: 'Identifier',
      body: ({_uri, hasIdentifier}) => {
        return <Link colorWithHover to={`/impactRisk/${encodeURIComponent(_uri)}/view`}>
          {hasIdentifier || _uri}
        </Link>
      },
      sortBy: ({_uri}) => _uri
    },

    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'impactRisk'} objectUri={encodeURIComponent(_uri)}
                      hideDeleteOption={!userContext.isSuperuser}
                      hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading Impact Risks...`}/>;

  return (
    <Container>
      <DataTable
        title={"Impact Risks"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/impactRisk/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new ImpactRisk"
            variant="outlined"/>
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('impactRisk', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('impactRisk', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}
