import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {deleteTheme, fetchThemes} from "../../api/themeApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
export default function Themes() {
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

  const [codeInterfaces, setCodeInterfaces] = useState({});

  const [outcomeNames, setOutcomeNames] = useState({})

  useEffect(() => {
    fetchDataTypes('theme').then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.themes}));
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  useEffect(() => {
    fetchDataTypeInterfaces('code').then(({interfaces}) => {
      setCodeInterfaces(interfaces)
    })
  }, []);

  useEffect(() => {
    if (state.data.length) {
      state.data.map((theme, index) => {
        fetchDataTypes('outcome', `theme/${encodeURIComponent(theme._uri)}`).then(({outcomes, success}) => {
          if (success) {
            setOutcomeNames(({...outcomeNames}) => ({...outcomeNames, [theme._uri]: outcomes.map(outcome => outcome.name)}))
          }
        })
      })
    }
  }, [state])

  const showDeleteDialog = (uri) => {
    setState(state => ({
      ...state, selectedUri: uri, showDeleteDialog: true,
      deleteDialogTitle: 'Delete theme ' + uri + ' ?'
    }));
  };

  const handleDelete = async (uri, form) => {

    deleteTheme(uri).then(({success, message})=>{
      if (success) {
        setState(state => ({
          ...state, showDeleteDialog: false,
        }));
        setTrigger(!trigger);
        enqueueSnackbar(message || "Success", {variant: 'success'})
      }
    }).catch((e)=>{
      setState(state => ({
        ...state, showDeleteDialog: false,
      }));
      reportErrorToBackend(e)
      setTrigger(!trigger);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });

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
        return <Link colorWithHover to={`/themes/${encodeURIComponent(_uri)}/view`}>
          {_uri}
        </Link>
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
        return codes?.map(code => codeInterfaces[code]);
      }
    },
    {
      label: 'Associated Outcome(s)',
      body: ({_uri}) => {
        return outcomeNames[_uri];
      }
    },
    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'themes'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                      hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading themes...`}/>;

  return (
    <Container>
      <DataTable
        title={"Themes"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/themes/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Theme"
            variant="outlined"/>
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
