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
import {fetchDataTypes} from "../../api/generalAPI";

export default function CharacteristicView({organizationUser, groupUser, superUser, multi, single, uri}) {
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const {enqueueSnackbar} = useSnackbar();

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
    if (multi){
        fetchDataTypes('characteristic').then(res => {
            if(res.success)
              setState(state => ({...state, loading: false, data: res.characteristics}));
          }).catch(e => {
            reportErrorToBackend(e);
            setState(state => ({...state, loading: false}))
            navigate('/dashboard');
            enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
          });
    } else if (single){
        fetchDataTypes('characteristic', encodeURIComponent(uri)).then(res => {
            if(res.success){
                setState(state => ({...state, loading: false, data: [res.characteristic]}));
            }
          }).catch(e => {
            reportErrorToBackend(e);
            setState(state => ({...state, loading: false}))
            navigate('/dashboard');
            enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
          });
    }
  }, [trigger]);

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
      label: 'Name',
      body: ({_uri, name}) => {
        return <Link colorWithHover to={`/characteristic/${encodeURIComponent(_uri)}/view`}>
          {name || _uri}
        </Link>
      },
      sortBy: ({legalName}) => legalName
    },

    {
      label: ' ',
      body: ({_uri}) => {
        if (multi)
            return <DropdownMenu urlPrefix={'characteristic'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
            hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
        if (single)
            return null
      }
        
    }
  ];

  if (state.loading)
    return <Loading message={`Loading characteristics...`}/>;

  return (
    <Container>
      <DataTable
        title={multi?"Characteristics":"Characteristic"}
        data={state.data}
        columns={columns}
        uriField="uriField"
        customToolbar={multi?
          <Chip
            disabled={!userContext.isSuperuser}
            onClick={() => navigate('/characteristic/new')}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Characteristic"
            variant="outlined"/>:null
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
