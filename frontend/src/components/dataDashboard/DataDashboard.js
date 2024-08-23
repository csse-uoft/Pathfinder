import {Button, Container, Typography} from "@mui/material";
import Dropdown from "../shared/fields/MultiSelectField";
import React, { useRef, useEffect, useState } from 'react';
import {fetchOrganizations} from "../../api/organizationApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {Loading} from "../shared";
import {fetchOrganizationsData} from "../../api/dataDashboardApi";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';


export default function DataDashboard() {
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [objectsCount, setObjectsCount] = useState([]);
  const [theme2OutcomesCount, setTheme2OutcomesCount] = useState([])
  const [state, setState] = useState({
    loading: true
  });
  const [errors, setErrors] = useState(
    {}
  );

  useEffect(() => {
    fetchOrganizations().then(res => {
      if (res.success){
        res.organizations.map(organization => {
          organizationInterfaces[organization._uri] = organization.legalName;
        });
        setState(state => ({...state, loading: false}));
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setState(state => ({...state, loading: false}));
      navigate('/dashboard');
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
    });
  }, []);



  if (state.loading)
    return <Loading message={`Loading organizations...`}/>;
  return (
    <Container maxWidth="md">
      <Container
        sx={{
          width: "100%",
          // display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Typography
          variant="h5"
          style={{
            fontFamily: "Trade Gothic Next LT Pro Cn, sans-serif",
            fontSize: 35,
            fontWeight: "bold",
            color: "#0b2f4e",
          }}
        >
          Data Dashboard
        </Typography>
        <Dropdown
          chooseAll
          key={'organizations'}
          label={'Organizations'}
          value={selectedOrganizations}
          options={organizationInterfaces}
          error={!!errors.organizations}
          helperText={
            errors.organizations
          }
          onChange={e => {
            setSelectedOrganizations(e.target.value);
          }}
        />
        <Button
          size="lg"
          endDecorator={<>{">"}</>}
          onClick={async () => {
            if (selectedOrganizations && selectedOrganizations.length) {
              const {objectsCount, theme2OutcomesCount} = await fetchOrganizationsData(selectedOrganizations);
              objectsCount.map(organization => organization.organization = organizationInterfaces[organization.organization])
              setObjectsCount(objectsCount)
              setTheme2OutcomesCount(theme2OutcomesCount)
            }
          }
          }
          loadingPosition="start"
        >
          Generate Visualization
        </Button>
      </Container>
      <Container
        sx={{
        width: "100%",
        justifyContent: "center",
        marginTop: "20px",
      }}>
        {
        objectsCount && objectsCount.length?
          <div>
            <h3>Objects Count</h3>
            <BarChart width={750} height={250} data={objectsCount}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="organization"/>
            <YAxis />
            <Tooltip />
            <Bar dataKey="objectsCount" fill="#82ca9d" />
          </BarChart></div> : null
      }

        {theme2OutcomesCount && theme2OutcomesCount.length?
          <div>
            <h3>Outcome Counts for Themes</h3>
            <BarChart width={750} height={250} data={theme2OutcomesCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="theme" tick={false} />
              <YAxis />
              <Tooltip/>
              <Bar dataKey="Outcomes" fill="#82ca9d" />
            </BarChart>
          </div>
           : null
        }

      </Container>
    </Container>
  );
}