import {Container, Typography} from "@mui/material";
import Dropdown from "../shared/fields/MultiSelectField";
import React, { useRef, useEffect, useState } from 'react';
import {fetchOrganizations} from "../../api/organizationApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {Loading} from "../shared";


export default function DataDashboard() {
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
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
          Indicator Information
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
      </Container>
    </Container>
  );
}