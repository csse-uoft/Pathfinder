import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes} from "../../api/generalAPI";
export default function ImpactModels() {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchDataTypes('impactModel', encodeURIComponent(uri)).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.impactModels, editable: res.editable}));
    }).catch(e => {
      reportErrorToBackend(e)
      setState(state => ({...state, loading: false}))
      console.log(e)
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);


  const columns = [
    {
      label: 'Name',
      body: ({_uri, name}) => {
        return <Link colorWithHover to={`/impactModel/${encodeURIComponent(_uri)}/view`}>
          {name || _uri}
        </Link>
      },
      sortBy: ({name}) => name
    },
    {
      label: 'Date Created',
      body: ({dateCreated}) => {
        return dateCreated? `${(new Date(dateCreated)).toLocaleDateString()}` : 'Not Given'

      }
    },

    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'impactModel'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable} hideDeleteOption
                      handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading Impact Models...`}/>;

  return (
    <Container>
      <DataTable
        title={"Impact Models"}
        data={state.data}
        columns={columns}
        uriField="uri"
        customToolbar={
          <Chip
            disabled={!state.editable}
            onClick={() => navigate(`/impactModel/${encodeURIComponent(uri)}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Impact Models"
            variant="outlined"/>
        }

      />
      {/*<DeleteModal*/}
      {/*  objectId={state.selectedId}*/}
      {/*  title={state.deleteDialogTitle}*/}
      {/*  show={state.showDeleteDialog}*/}
      {/*  onHide={() => setState(state => ({...state, showDeleteDialog: false}))}*/}
      {/*  delete={handleDelete}*/}
      {/*/>*/}
    </Container>
  );
}
