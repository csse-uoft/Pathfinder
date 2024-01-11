import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {UserContext} from "../../context";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataTypes} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";

export default function IndicatorReports() {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);

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
    fetchDataTypes('indicator', encodeURIComponent(uri)).then(res => {
      if (res.success) {
        console.log(res.indicators);
        setState(state => ({...state, loading: false, data: res.indicators}));
      }
    }).catch(e => {
      setState(state => ({...state, loading: false}));
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, [trigger]);

  const columns = [
    {
      label: 'Indicator Report Name',
      body: ({name}) => {
        return name;
      },
      sortBy: ({name}) => name
    },
    {
      label: 'Time Interval of Report',
      body: ({hasTime}) => {
        return (hasTime?.hasBeginning?.date && hasTime?.hasEnd?.date)? `${(new Date(hasTime.hasBeginning.date)).toLocaleString()} to ${(new Date(hasTime.hasEnd.date)).toLocaleString()}` : null
      }
    },
    {
      label: 'Indicator Report Value',
      body: ({value}) => {
        return value?.numericalValue;
      }
    },

    {
      label: 'Comment',
      body: ({comment}) => {
        return comment;
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
                              <Chip
                                disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}
                                onClick={() => navigate(`/indicatorReport/${encodeURIComponent(uri)}/new`)}
                                color="primary"
                                icon={<AddIcon/>}
                                label="Add new Indicator Report"
                                variant="outlined"/>}/>
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

      {/*<DataTable*/}
      {/*  title={"Indicators"}*/}
      {/*  data={state.data}*/}
      {/*  columns={columns}*/}
      {/*  uriField="uri"*/}
      {/*  customToolbar={*/}
      {/*    <Chip*/}
      {/*      disabled={!userContext.isSuperuser && !userContext.editorOfs.includes(uri)}*/}
      {/*      onClick={() => navigate(`/indicator/${encodeURIComponent(uri)}/new`)}*/}
      {/*      color="primary"*/}
      {/*      icon={<AddIcon/>}*/}
      {/*      label="Add new Indicator"*/}
      {/*      variant="outlined"/>*/}
      {/*  }*/}

      {/*/>*/}
    </Container>
  );

}
