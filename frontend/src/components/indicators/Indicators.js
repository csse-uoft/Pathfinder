import React, { useEffect, useState, useContext } from 'react';
import { Chip, Container } from "@mui/material";
import { Add as AddIcon, Check as YesIcon } from "@mui/icons-material";
import { DeleteModal, DropdownMenu, Link, Loading, DataTable } from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import { useSnackbar } from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
export default function Indicators() {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const [outcomeInterfaces, setOutcomeInterfaces] = useState({})

  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    fetchDataTypeInterfaces('outcome').then(({interfaces}) => setOutcomeInterfaces(interfaces))
  }, [])

  useEffect(() => {
    fetchDataTypes('indicator', encodeURIComponent(uri)).then(res => {
      if(res.success) {
        console.log(res.indicators)
        setState(state => ({...state, loading: false, data: res.indicators}));
      }
    }).catch(e => {
      setState(state => ({...state, loading: false}))
      reportErrorToBackend(e)
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const columns = [
    {
      label: 'Indicator Name',
      body: ({name}) => {
        return name

      },
      sortBy: ({name}) => name
    },
    {
      label: 'Indicator URI',
      body: ({_uri}) => {
        return _uri

      },
    },
    {
      label: 'Indicator Description',
      body: ({description}) => {
        return description
      },
    },
    {
      label: 'Outcome(s) URI',
      colSpan: 2,
      body: ({forOutcomes}) => {
        return forOutcomes?.map(outcomeUri => [outcomeUri, outcomeInterfaces[outcomeUri]])
      },
    },
    {
      label: 'Outcome(s) Name',
    },
    {
      label: 'Indicator Baseline',
      body: (baseline) => {
        return baseline?.numericalValue
      }
    },
    {
      label: 'indicatorReport URI',
      colSpan: 3,
      body: ({indicatorReports}) => {
        return indicatorReports?.map(indicatorReport => [indicatorReport._uri,
          indicatorReport.value?.numericalValue,
          (indicatorReport.hasTime?.hasBeginning?.date && indicatorReport.hasTime?.hasEnd?.date)? `${(new Date(indicatorReport.hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(indicatorReport.hasTime.hasEnd.date)).toLocaleString()}` : null
        ]);
      }
    },
    {
      label: 'IndicatorReport Value'
    },
    {
      label: 'IndicatorReport Time Interval'
    },

    {
      label: ' ',
      body: ({_uri}) => {
        return <DropdownMenu urlPrefix={'indicator'} objectUri={encodeURIComponent(_uri)} hideDeleteOption
                             hideEditOption={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                             handleDelete={() => showDeleteDialog(_uri)}/>;
      }
    }
  ];

  if (state.loading)
    return <Loading message={`Loading indicators...`}/>;

  return (
    <Container>
      <DataTable
        title={"Indicators"}
        data={state.data}
        columns={columns}
        uriField="uri"
        customToolbar={
          <Chip
            disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
            onClick={() => navigate(`/indicator/${encodeURIComponent(uri)}/new`)}
            color="primary"
            icon={<AddIcon/>}
            label="Add new Indicator"
            variant="outlined"/>
        }

      />
    </Container>
  );
}