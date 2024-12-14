import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes, fetchDataType, fetchDataTypeInterfaces, deleteDataType} from "../../api/generalAPI";
import {deletingObjectHelper, handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/dialogs/DeleteDialog";

export default function CharacteristicView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const {enqueueSnackbar} = useSnackbar();

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
  });
  const [trigger, setTrigger] = useState(true);
  const [stakeholderInterfaces, setStakeholderInterfaces] = useState({});
  useEffect(() => {
    if (multi) {
      fetchDataTypes('characteristic').then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.characteristics}));
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (single) {
      fetchDataType('characteristic', encodeURIComponent(uri)).then(res => {
        if (res.success) {
          setState(state => ({...state, loading: false, data: [res.characteristic]}));
        }
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }
  }, [trigger]);

  useEffect(() => {
    fetchDataTypeInterfaces('stakeholder').then(({interfaces}) => setStakeholderInterfaces(interfaces));
  }, []);


  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete theme ' + uri + ' ?'
    }));
  };

  // const handleDelete = async (uri, form) => {
  //
  //   if (!deleteDialog.confirmDialog) {
  //     deleteDataType('characteristic', uri).then(({success, mandatoryReferee, regularReferee}) => {
  //       if (success) {
  //         console.log(mandatoryReferee, regularReferee);
  //         if (Object.keys(mandatoryReferee)?.length) {
  //           setState(state => ({
  //             ...state, showDeleteDialog: false
  //           }));
  //           setDeleteDialog(state => ({
  //             ...state, confirmDialog: deletingObjectHelper(mandatoryReferee), continueButton: false
  //           }));
  //         } else if (Object.keys(regularReferee)?.length && deletingObjectHelper(regularReferee)) {
  //           setState(state => ({
  //             ...state, showDeleteDialog: false,
  //           }));
  //           setDeleteDialog(state => ({
  //             ...state, confirmDialog: deletingObjectHelper(regularReferee), continueButton: true
  //           }));
  //
  //         } else {
  //           // the object is not referred by anyone, can be removed safely
  //           setDeleteDialog(state => ({
  //             ...state, confirmDialog: 'The object is not referred by anyone, can be removed safely', continueButton: true
  //           }));
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
  //     }));
  //     deleteDataType('code', uri, {checked: true}).then(({success, message}) => {
  //       if (success) {
  //         setDeleteDialog(state => ({
  //           ...state, confirmDialog: '', loadingButton: false
  //         }));
  //         setTrigger(!trigger);
  //         enqueueSnackbar(message || "Success", {variant: 'success'});
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
  // };

  const columns = [
    {
      label: 'Characteristic Name',
      body: ({name}) => {
        return name;
      },
      sortBy: ({name}) => name
    },

    {
      label: 'Characteristic URI',
      body: ({_uri}) => {
        if (multi)
          return <Link colorWithHover to={`/characteristic/${encodeURIComponent(_uri)}/view`}>
            {_uri}
          </Link>;
        if (single)
          return _uri;
      },
      sortBy: ({_uri}) => _uri
    },

    {
      label: 'Characteristic Code',
      body: ({codes}) => {
        return <Link colorWithHover to={`/code/${encodeURIComponent(codes)}/view`}>
          {codes}
        </Link>;
      }
    },

    {
      label: 'Value',
      body: ({value}) => {
        return value;
      }
    },

    {
      label: 'Stakeholder Name',
      colSpan: 2,
      body: ({stakeholders}) => {
        return stakeholders?.map(stakeholderUri => [
          stakeholderInterfaces[stakeholderUri],
          <Link colorWithHover to={`/stakeholder/${encodeURIComponent(stakeholderUri)}/view`}>
            {stakeholderUri}
          </Link>
        ]);
      },
    },

    {
      label: 'Stakeholder URI',
    },


    {
      label: ' ',
      body: ({_uri}) => {
        if (multi) {
          return <DropdownMenu urlPrefix={'characteristic'} objectUri={encodeURIComponent(_uri)}
                               hideDeleteOption={!userContext.isSuperuser}
                               hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>;
        } else if (single) {
          return null;
        }

      }

    }
  ];

  if (state.loading)
    return <Loading message={`Loading characteristics...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Characteristics </Typography>
      <DataTable
        title={multi ? "Characteristics" : "Characteristic"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={multi ?
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/characteristic/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Characteristic"
            variant="outlined"/> : null
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('characteristic', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('characteristic', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}
