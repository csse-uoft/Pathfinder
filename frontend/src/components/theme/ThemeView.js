import React, { useEffect, useState, useContext } from 'react';
import {Chip, Container, Typography} from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {deleteTheme, fetchForThemesViewingPage, fetchThemes} from "../../api/themeApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
import {handleDelete} from "../../helpers/deletingObjectHelper";
import DeleteDialog from "../shared/DeleteDialog";

export default function ThemeView({single, multi, organizationUser, groupUser, superUser}) {
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

  // const [codeInterfaces, setCodeInterfaces] = useState({});

  // const [outcomeNames, setOutcomeNames] = useState({});

  useEffect(() => {
    if (multi) {
      fetchForThemesViewingPage().then(({data, success}) => {
        if (success) {
          setState(state => ({...state, loading: false, data: data}));
        }
      }).catch(e => {
        setState(state => ({...state, loading: false}))
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (single) {
      fetchForThemesViewingPage(encodeURIComponent(uri)).then(({data, success}) => {
        if (success) {
          setState(state => ({...state, loading: false, data: data}));
        }
      }).catch(e => {
        setState(state => ({...state, loading: false}))
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }

  }, [trigger]);

  // useEffect(() => {
  //   fetchDataTypeInterfaces('code').then(({interfaces}) => {
  //     setCodeInterfaces(interfaces)
  //   })
  // }, []);

  // useEffect(() => {
  //   if (state.data.length) {
  //     state.data.map((theme, index) => {
  //       fetchDataTypes('outcome', `theme/${encodeURIComponent(theme._uri)}`).then(({outcomes, success}) => {
  //         if (success) {
  //           setOutcomeNames(({...outcomeNames}) => ({...outcomeNames, [theme._uri]: outcomes.map(outcome => outcome.name)}))
  //         }
  //       })
  //     })
  //   }
  // }, [state])

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete theme ' + uri + ' ?'
    }));
  };

  const columns = [
    {
      label: 'Theme Name',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: 'Theme URI',
      body: ({_uri}) => {
        // return <Link colorWithHover to={`/theme/${encodeURIComponent(_uri)}/view`}>
        //   {_uri}
        // </Link>
        return _uri
      },
      sortBy: ({legalName}) => legalName
    },
    {
      label: 'Theme Description',
      body: ({description}) => {
        return description;
      }
    },
    {
      label: 'Theme Code(s)',
      body: ({codes}) => {
        return codes?.map(code => code.name);
      }
    },
    {
      label: 'Associated Outcome(s)',
      body: ({outcomes}) => {
        return outcomes.map(outcome => outcome.name);
      }
    },
    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'theme'} objectUri={encodeURIComponent(_uri)} hideDeleteOption={!userContext.isSuperuser}
                      hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading themes...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Themes </Typography>
      <DataTable
        title={multi ? "Themes": 'Theme'}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={
        multi?
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/theme/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Theme"
            variant="outlined"/>:null
        }

      />
      <DeleteModal
        objectUri={state.selectedUri}
        title={state.deleteDialogTitle}
        show={state.showDeleteDialog}
        onHide={() => setState(state => ({...state, showDeleteDialog: false}))}
        delete={handleDelete('theme', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
      />
      <DeleteDialog
        state={deleteDialog}
        setState={setDeleteDialog}
        handleDelete={handleDelete('theme', deleteDialog, setState, setDeleteDialog, trigger, setTrigger)}
        selectedUri={state.selectedUri}
      />
    </Container>
  );
}