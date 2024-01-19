import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataType, fetchDataTypes} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";

export default function IndicatorReportView({single, multi, organizationUser, groupUser, superUser, organizationUri}) {
  const {enqueueSnackbar} = useSnackbar();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const {uri} = useParams();

  const userContext = useContext(UserContext);
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedId: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
  });
  const [indicatorReportDict, setIndicatorReportDict] = useState({})
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    if (state.data?.length) {
      fetchDataTypes('indicatorReport', encodeURIComponent(organizationUri)).then(({indicatorReports, success}) => {
        if (success) {
          const indicatorReportDict = {}
          indicatorReports.map(indicatorReport => {
            indicatorReportDict[indicatorReport._uri] = indicatorReport;
          })
          setIndicatorReportDict(indicatorReportDict)
        }
      })
    }
  }, [state])

  useEffect(() => {
    if (multi) {
      fetchDataTypes('indicator', encodeURIComponent(organizationUri)).then(res => {
        if (res.success) {
          setState(state => ({...state, loading: false, data: res.indicators}));
        }
      }).catch(e => {
        setState(state => ({...state, loading: false}));
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else if (single) {

    }

  }, [trigger]);

  const columns = [
    {
      label: 'Indicator Report Name',
      body: (indicatorReportUri) => {
        return indicatorReportDict[indicatorReportUri]?.name;
      }
    },
    {
      label: 'Time Interval of Report',
      body: (indicatorReportUri) => {
        const hasTime = indicatorReportDict[indicatorReportUri]?.hasTime
        return (hasTime?.hasBeginning?.date && hasTime?.hasEnd?.date)? `${(new Date(hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(hasTime.hasEnd.date)).toLocaleString()}` : null
      }
    },
    {
      label: 'Indicator Report Value',
      body: (indicatorReportUri) => {
        return indicatorReportDict[indicatorReportUri]?.value?.numericalValue;
      }
    },

    {
      label: 'Comment',
      body: (indicatorReportUri) => {
        return indicatorReportDict[indicatorReportUri]?.comment;
      }
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
      <EnhancedTableToolbar title={'Indicators'}
                            numSelected={0}
                            customToolbar={
        multi ?
                              <Chip
                                disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                                onClick={() => navigate(`/indicatorReport/${encodeURIComponent(uri)}/new`)}
                                color="primary"
                                icon={<AddIcon/>}
                                label="Add new Indicator Report"
                                variant="outlined"/> : null}/>
      {
        state.data.map(indicator =>
          <DataTable
            title={`Indicator: ${indicator.name}`}
            data={indicator.indicatorReports}
            columns={columns}
            uriField="uri"
          />
        )
      }

    </Container>
  );

}
