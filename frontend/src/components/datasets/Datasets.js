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
import DeleteDialog from "../shared/DeleteDialog";
export default function Datasets() {
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
    fetchDataTypes('dataset').then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.datasets}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete dataset ' + uri + ' ?'
    }));
  };



  const columns = [
    {
      label: 'Name',
      body: ({_uri, name}) => {
        return <Link colorWithHover to={`/dataset/${encodeURIComponent(_uri)}/view`}>
          {name}
        </Link>
      },
      sortBy: ({name}) => name
    },
    {
      label: 'Description',
      body: ({description}) => {
        return description;
      }
    },

    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'dataset'} objectUri={encodeURIComponent(_uri)} hideDeleteOption={!userContext.isSuperuser}
                      hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading datasets...`}/>;

  return (
    <Container>
      <DataTable
        title={"Datasets"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/dataset/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Dataset"
            variant="outlined"/>
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('dataset', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('dataset', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}
