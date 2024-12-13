import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes} from "../../api/generalAPI";
import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/dialogs/DeleteDialog";
export default function HowMuchImpacts() {
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
    fetchDataTypes('howMuchImpact', 'HowMuchImpact').then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.howMuchImpacts}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete HowMuchImpact ' + uri + ' ?'
    }));
  };

  const columns = [
    {
      label: 'URI',
      body: ({_uri}) => {
        return <Link colorWithHover to={`/howMuchImpact/${encodeURIComponent(_uri)}/view`}>
          {_uri}
        </Link>
      },
      sortBy: ({name}) => name
    },
    {
      label: 'Indicator',
      body: ({indicator}) => {
        return indicator;
      }
    },

    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'howMuchImpact'} objectUri={encodeURIComponent(_uri)}
                      hideDeleteOption={!userContext.isSuperuser}
                      hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading HowMuchImpacts...`}/>;

  return (
    <Container>
      <DataTable
        title={"HowMuchImpacts"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/howMuchImpact/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new HowMuchImpact"
            variant="outlined"/>
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('howMuchImpact', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('howMuchImpact', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}
