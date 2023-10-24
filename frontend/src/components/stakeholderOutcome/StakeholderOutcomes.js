import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchStakeholderOutcomesThroughOrganization} from "../../api/stakeholderOutcomeAPI";
export default function StakeholderOutcomes() {
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
    fetchStakeholderOutcomesThroughOrganization(encodeURIComponent(uri)).then(res => {
      if(res.success)
        setState(state => ({...state, loading: false, data: res.stakeholderOutcomes, editable: res.editable}));
    }).catch(e => {
      reportErrorToBackend(e)
      setState(state => ({...state, loading: false}))
      console.log(e)
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  // const showDeleteDialog = (id) => {
  //   setState(state => ({
  //     ...state, selectedId: id, showDeleteDialog: true,
  //     deleteDialogTitle: 'Delete organization ' + id + ' ?'
  //   }));
  // };

  // const handleDelete = async (id, form) => {
  //
  //   deleteOrganization(id).then(({success, message})=>{
  //     if (success) {
  //       setState(state => ({
  //         ...state, showDeleteDialog: false,
  //       }));
  //       setTrigger(!trigger);
  //       enqueueSnackbar(message || "Success", {variant: 'success'})
  //     }
  //   }).catch((e)=>{
  //     setState(state => ({
  //       ...state, showDeleteDialog: false,
  //     }));
  //     setTrigger(!trigger);
  //     enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
  //   });
  //
  // };

  const columns = [
    {
      label: 'Name',
      body: ({_uri, name}) => {
        return <Link colorWithHover to={`/stakeholderOutcome/${encodeURIComponent(_uri)}/view`}>
          {name}
        </Link>
      },
      sortBy: ({name}) => name
    },
    // {
    //   label: 'value',
    //   body: ({value}) => {
    //     return value.numericalValue;
    //   }
    // },
    // {
    //   label: 'For Stakeholder Outcome',
    //   body: ({forStakeholderOutcome}) => {
    //     return <Link colorWithHover to={`/stakeholderOutcome/${encodeURIComponent(forStakeholderOutcome._uri)}/view`}>
    //       {forStakeholderOutcome.name}
    //     </Link>
    //   }
    // },
    // {
    //   label: 'Start Time',
    //   body: ({hasTime}) => {
    //     return hasTime? (new Date(hasTime?.hasBeginning.date)).toString() : 'Not Given'
    //   },
    // },
    // {
    //   label: 'End Time',
    //   body: ({hasTime}) => {
    //     return hasTime? (new Date(hasTime.hasEnd.date)).toString() : 'Not Given'
    //   },
    // },

    {
      label: ' ',
      body: ({_uri}) =>
        <DropdownMenu urlPrefix={'stakeholderOutcome'} objectUri={encodeURIComponent(_uri)} hideEditOption={!state.editable} hideDeleteOption
                      handleDelete={() => showDeleteDialog(_uri)}/>
    }
  ];

  if (state.loading)
    return <Loading message={`Loading Stakeholder Outcomes...`}/>;

  return (
    <Container>
      <DataTable
        title={"Stakeholder Outcomes"}
        data={state.data}
        columns={columns}
        uriField="uri"
        customToolbar={
          <Chip
            disabled={!state.editable}
            onClick={() => navigate(`/stakeholderOutcome/${encodeURIComponent(uri)}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new StakeholderOutcome"
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