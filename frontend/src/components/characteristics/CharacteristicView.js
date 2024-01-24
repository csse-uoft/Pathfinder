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
import {fetchDataTypes, fetchDataType, fetchDataTypeInterfaces} from "../../api/generalAPI";

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
  const [stakeholderInterfaces, setStakeholderInterfaces] = useState({})
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
        fetchDataType('characteristic', encodeURIComponent(uri)).then(res => {
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

  useEffect(() => {
    fetchDataTypeInterfaces('stakeholder').then(({interfaces}) => setStakeholderInterfaces(interfaces))
  }, [])


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
      label: 'Characteristic Name',
      body: ({name}) => {
        return name
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
          return _uri
      },
      sortBy: ({_uri}) => _uri
    },

    {
      label: 'Characteristic Code',
      body: ({codes}) => {
          return <Link colorWithHover to={`/code/${encodeURIComponent(codes)}/view`}>
              {codes}
          </Link>
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
        return stakeholders?.map(stakeholdersUri => stakeholderInterfaces[stakeholdersUri])
      },
      
    },

    {
      label: 'Stakeholder URI',
      body: ({stakeholders}) => {
          return <Link colorWithHover to={`/stakeholder/${encodeURIComponent(stakeholders)}/view`}>
              {stakeholders}
          </Link>
      }
    },

    // {
    //   label: 'Stakeholder URI',
    //   colSpan: 2,
    //   body: ({stakeholders}) => {
    //     return stakeholders?.map(stakeholdersUri => [<Link colorWithHover to={`/stakeholder/${encodeURIComponent(stakeholdersUri)}/view`}>
    //       {stakeholdersUri}
    //     </Link>, stakeholderInterfaces[stakeholdersUri]])
    //   },
    // },



    {
      label: ' ',
      body: ({_uri}) => {
        if (multi){
          return <DropdownMenu urlPrefix={'characteristic'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
            hideEditOption={!userContext.isSuperuser} handleDelete={() => showDeleteDialog(_uri)}/>
        }
            
        else if (single){
          return null
        }
            
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
