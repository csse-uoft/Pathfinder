import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataType, fetchDataTypes} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";

export default function OutcomeView({multi, single, organizationUser, groupUser, superUser, organizationUri}) {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false,
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    if (multi) {
      fetchDataTypes('outcome', encodeURIComponent(organizationUri)).then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.outcomes, editable: res.editable}));
        console.log(res.outcomes);
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      });
    } else if (single) {
      fetchDataType('outcome', encodeURIComponent(uri)).then(({success, outcome}) => {
        if (success)
          setState(state => ({...state, loading: false, data: [outcome]}));
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      });
    }

  }, [trigger]);

  const indicatorColumns = [
    {
      label: 'Indicator(s) URI',
      body: ({_uri}) => {
        return _uri
      }
    },
    {
      label: "Indicator(s) Name",
      body: ({name}) => {
        return name
      }
    }
  ];

  const themeColumns = [
    {
      label: 'Theme(s) URI',
      body: ({_uri}) => {
        return _uri
      }
    },
  ];

  const stakeholderOutcomeColumns = [
    {
      label: 'Stakeholder Outcome(s) URI',
      body: (uri) => {
        return uri
      }
    },
  ];

  const codeColumns = [
    {
      label: 'Outcome Code(s) URI',
      body: (uri) => {
        return uri
      }
    },
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;

  return (
    <Container>
      {
        state.data.map(outcome => {
          return (
            <Container>
              <EnhancedTableToolbar title={
                `Outcome Name ${outcome.name}\n
                Outcome URI: ${outcome._uri}\n
                Outcome Description: ${outcome.description}
                `}
                                    numSelected={0}
              />
              <DataTable
                title={'Indicator(s)'}
                data={outcome.indicators || []}
                columns={indicatorColumns}
                uriField="uri"
              />
              <DataTable
                title={'Theme(s)'}
                data={outcome.themes || []}
                columns={themeColumns}
                uriField="uri"
              />
              <DataTable
                title={'Stakeholder Outcome(s)'}
                data={outcome.stakeholderOutcomes || []}
                columns={stakeholderOutcomeColumns}
                uriField="uri"
              />
              <DataTable
                title={'Outcome Code(s)'}
                data={outcome.codes || []}
                columns={codeColumns}
                uriField="uri"
              />

            </Container>


          );
        })
      }

    </Container>
  );
}