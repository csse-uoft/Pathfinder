import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes, fetchDataType, deleteDataType} from "../../api/generalAPI";
import DeleteDialog from "../shared/DeleteDialog";
import {handleDelete} from "../../helpers/deletingObjectHelper";

export default function CodeView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);

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
      fetchDataTypes('code').then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.codes}));
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (single) {
      fetchDataType('code', encodeURIComponent(uri)).then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: [res.code]}));
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }

  }, [trigger]);

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete code ' + uri + ' ?'
    }));
  };

  // const handleDelete = async (uri, form) => {
  //   if (!deleteDialog.confirmDialog) {
  //     deleteDataType('code', uri).then(({success, mandatoryReferee, regularReferee}) => {
  //       if (success) {
  //         console.log(mandatoryReferee, regularReferee)
  //         if (Object.keys(mandatoryReferee)?.length) {
  //           setState(state => ({
  //             ...state, showDeleteDialog: false
  //           }));
  //           setDeleteDialog(state => ({
  //             ...state, confirmDialog: deletingObjectHelper(mandatoryReferee), continueButton: false
  //           }))
  //         } else {
  //           setState(state => ({
  //             ...state, showDeleteDialog: false,
  //           }));
  //           setDeleteDialog(state => ({
  //             ...state, confirmDialog: deletingObjectHelper(regularReferee), continueButton: true
  //           }))
  //         }
  //
  //         // setTrigger(!trigger);
  //         // enqueueSnackbar(message || "Success", {variant: 'success'})
  //       }
  //     }).catch((e) => {
  //       setState(state => ({
  //         ...state, showDeleteDialog: false,
  //       }));
  //       reportErrorToBackend(e);
  //       setTrigger(!trigger);
  //       enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
  //     });
  //   } else {
  //     setDeleteDialog(state => ({
  //       ...state, loadingButton: true
  //     }))
  //     deleteDataType('code', uri, {checked: true}).then(({success, message}) => {
  //       if (success) {
  //         setDeleteDialog(state => ({
  //           ...state, confirmDialog: '', loadingButton: false
  //         }));
  //         setTrigger(!trigger);
  //         enqueueSnackbar(message || "Success", {variant: 'success'})
  //       }
  //     }).catch((e) => {
  //       setState(state => ({
  //         ...state, showDeleteDialog: false,
  //       }));
  //       reportErrorToBackend(e);
  //       setTrigger(!trigger);
  //       enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
  //     });
  //   }
  //
  //
  // };

  const columns = [
    {
      // label: 'Code Name',
      // body: ({_uri, name}) => {
      //     return <Link colorWithHover to={`/code/${encodeURIComponent(_uri)}/view`}>
      //         {name}
      //     </Link>
      // },
      // sortBy: ({name}) => name
      label: 'Code Name',
      body: ({name}) => {
        return name;
      },
      sortBy: ({name}) => name
    },

    {
      label: 'Code URI',
      body: ({_uri}) => {
        if (multi)
          return <Link colorWithHover to={`/code/${encodeURIComponent(_uri)}/view`}>
            {_uri}
          </Link>;
        else if (single)
          return _uri;
      },
      sortBy: ({_uri}) => _uri
    },

    {
      label: 'Code ID',
      body: ({identifier}) => {
        return identifier;
      }
    },
    {
      label: 'Code Description',
      body: ({description}) => {
        return description;
      }
    },

    {
      label: 'Defined By',
      body: ({definedBy}) => {
        return <Link colorWithHover to={`/organization/${encodeURIComponent(definedBy)}/view`}>
          {definedBy}
        </Link>;
      }
    },

    { // todo: which value to include? iso72 or codeValue?
      label: 'Value',
      body: ({codeValue, iso72Value}) => {
        return codeValue || iso72Value?.numericalValue;
      }
    },

    {
      label: ' ',
      body: ({_uri}) => {
        if (multi) {
          return <DropdownMenu urlPrefix={'code'} objectUri={encodeURIComponent(_uri)}
                               hideDeleteOption={!userContext.isSuperuser}
                               hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>;
        } else if (single) {
          return null;
        }

      }

    }
  ];

  if (state.loading)
    return <Loading message={`Loading codes...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Codes </Typography>
      <DataTable
        title={multi ? "Codes" : "Code"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={multi ?
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/code/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Codes"
            variant="outlined"/> : null
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('code', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('code', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />


    </Container>
  );
// >>>>>>> main
}
