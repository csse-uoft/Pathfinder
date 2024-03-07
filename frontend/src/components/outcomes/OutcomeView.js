import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
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

  const [indicatorInterfaces, setIndicatorInterfaces] = useState({})

  useEffect(() => {
    if (multi) {
      fetchDataTypes('outcome', encodeURIComponent(organizationUri)).then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.outcomes, editable: res.editable}));
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

  useEffect(() => {
    if (single) {
      fetchDataTypeInterfaces('indicator').then(({interfaces}) => {
        setIndicatorInterfaces(interfaces);
      })
    }
  }, [])

  const indicatorColumns = [
    {
      label: 'Indicator(s) URI',
      body: (obj) => {
        return <Link
          colorWithHover
          to={`/indicator/${encodeURIComponent(obj?._uri || obj)}/view`}
        > {obj?._uri || obj} </Link>
      }
    },
    {
      label: "Indicator(s) Name",
      body: (obj) => {
        return obj?.name || indicatorInterfaces[obj]
      }
    }
  ];

  const themeColumns = [
    {
      label: 'Theme(s) URI',
      body: (themeUri) => {
        return <Link
          colorWithHover
          to={`/theme/${encodeURIComponent(themeUri)}/view`}
        > {themeUri}</Link>
      }
    },
  ];

  const stakeholderOutcomeColumns = [
    {
      label: 'Stakeholder Outcome(s) URI',
      body: (uri) => {
        return <Link
          colorWithHover
          to={`/stakeholderOutcome/${encodeURIComponent(uri)}/view`}
        > {uri}</Link>
      }
    },
  ];

  const codeColumns = [
    {
      label: 'Outcome Code(s) URI',
      body: (uri) => {
        return <Link
          colorWithHover
          to={`/code/${encodeURIComponent(uri)}/view`}
        > {uri}</Link>
      }
    },
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Outcome Class View </Typography>
      {
        state.data.map(outcome => {
          return (
            <Container>
              <EnhancedTableToolbar title={(
                <>
                  Outcome Name: {outcome.name}
                  <br />
                  Outcome URI:{' '}
                  <Link
                    colorWithHover
                    to={`/outcome/${encodeURIComponent(outcome._uri)}/view`}
                  >
                    {outcome._uri}
                  </Link>
                  <br />
                  Outcome Description: {outcome.description}
                </>
              )}
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