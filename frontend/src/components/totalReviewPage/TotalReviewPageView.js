import React, {useEffect, useState, useContext} from 'react';
import {Chip, Container, Typography} from "@mui/material";
import {Add as AddIcon, Check as YesIcon} from "@mui/icons-material";
import {DeleteModal, DropdownMenu, Link, Loading, DataTable} from "../shared";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {reportErrorToBackend} from "../../api/errorReportApi";
import {navigateHelper} from "../../helpers/navigatorHelper";
import {fetchDataType, fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
import {EnhancedTableToolbar} from "../shared/Table/EnhancedTableToolbar";

export default function totalReviewPageView({multi, single, organizationUser, groupUser, superUser}) {
  const {enqueueSnackbar} = useSnackbar();
  const {uri} = useParams();
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator);
  const [outcomeDict, setOutcomeDict] = useState({});
  const [state, setState] = useState({
    loading: true,
    data: [],
    selectedUri: null,
    deleteDialogTitle: '',
    showDeleteDialog: false,
    editable: false,
  });
  const [trigger, setTrigger] = useState(true);

  const [indicatorDict, setIndicatorDict] = useState({});

  const [indicatorReportDict, setIndicatorReportDict] = useState({});

  useEffect(() => {
    if (state.data) {
      const indicatorReportDict = {};
      Promise.all(state.data.map((organization) => {
        return fetchDataTypes('indicatorReport', encodeURIComponent(organization._uri)).then(res => {
          if (res.success) {
            res.indicatorReports.map(indicatorReport => {
              console.log(indicatorReport)
              indicatorReportDict[indicatorReport._uri] = indicatorReport;
            })
          }
        })
      })).then(() => {
        console.log(indicatorReportDict)
        setIndicatorReportDict(indicatorReportDict)
      })

    }
  }, [state]);

  useEffect(() => {
    if (multi) {
      fetchDataTypes('organization').then(res => {
        if (res.success)
          setState(state => ({...state, loading: false, data: res.organizations, editable: res.editable}));
        // console.log(res.organizations);
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      });
    } else if (single) {
      fetchDataType('organization', encodeURIComponent(uri)).then(({success, organization}) => {
        if (success)
          setState(state => ({...state, loading: false, data: [organization]}));
      }).catch(e => {
        reportErrorToBackend(e);
        setState(state => ({...state, loading: false}));
        navigate('/dashboard');
        enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
      });
    }

  }, [trigger]);

  useEffect(() => {
    fetchDataTypes('outcome', 'all').then(res => {
      if (res.success) {
        const outcomeDict = {};
        res.outcomes.map(outcome => {
          outcomeDict[outcome._uri] = outcome;
        });
        setOutcomeDict(outcomeDict);
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  useEffect(() => {
    fetchDataTypes('indicator', 'all').then(res => {
      if (res.success) {
        const indicatorDict = {};
        res.indicators.map(indicator => {
          indicatorDict[indicator._uri] = indicator;
        });
        setIndicatorDict(indicatorDict);
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occurs", {variant: 'error'});
    });
  }, []);

  const indicatorColumns = [
    {
      label: 'Indicator',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: "Indicator Description",
      body: ({description}) => {
        return description;
      }
    },
    {
      label: ["Indicator Report", 'Value'],
      colSpan: 2,
      body: ({indicatorReports}) => {
        return indicatorReports?.map(indicatorReportUri => {
          return [indicatorReportDict[indicatorReportUri]?.name || 'Not Given',
            indicatorReportDict[indicatorReportUri]?.value?.numericalValue || ''
          ];
        })
      }
    },

  ];

  const themeColumns = [
    {
      label: 'Theme',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: 'Description',
      body: ({description}) => {
        return description;
      }
    },
  ];

  const stakeholderOutcomeColumns = [
    {
      label: 'Stakeholder Outcome(s) URI',
      body: (uri) => {
        return uri;
      }
    },
  ];

  const outcomeColumns = [
    {
      label: 'Outcome',
      body: ({name}) => {
        return name;
      }
    },
    {
      label: 'Outcome Description',
      body: ({description}) => {
        return description;
      }
    },
  ];

  if (state.loading)
    return <Loading message={`Loading outcomes...`}/>;

  return (
    <Container>
      <Typography variant={'h2'}> Total Review Page </Typography>
      {
        state.data.map(organization => {
          return (
            <Container>
              <EnhancedTableToolbar title={(
                <>
                  Organization: {organization.legalName}
                  <br/>
                  Organization URI:{' '}
                  <Link
                    colorWithHover
                    to={`/organization/${encodeURIComponent(organization._uri)}/view`}
                  >
                    {organization._uri}
                  </Link>
                </>
              )}
                                    numSelected={0}
              />
              <DataTable
                noHeaderBar
                data={[]}
                columns={themeColumns}
                uriField="uri"
              />
              <DataTable
                noHeaderBar
                data={organization?.hasOutcomes?.map(uri => outcomeDict[uri] || {}) || []}
                columns={outcomeColumns}
                uriField="uri"
              />
              <DataTable
                noHeaderBar
                data={organization?.hasIndicators?.map(uri => indicatorDict[uri] || {}) || []}
                columns={indicatorColumns}
                uriField="uri"
              />

            </Container>


          );
        })
      }

    </Container>
  );
}