import React, {useEffect, useState, useContext} from 'react';
import {fetchDataTypeInterfaces, fetchDataTypes} from "../../api/generalAPI";
import {reportErrorToBackend} from "../../api/errorReportApi";
import {UserContext} from "../../context";
import {Checkbox, FormControl, Input, MenuItem, MenuList, Select} from "@mui/material";

export default function DropdownFilter({areAllGroupOrgsSelected, selectedOrganizations, handleOrgClick, handleChange, handleGroupClick, handleSelectAllClick}) {

  const [organizationInterfaces, setOrganizationInterfaces] = useState({})
  const [organizationsWithGroups, setOrganizationsWithGroups] = useState([]);

  useEffect(() => {
    fetchDataTypeInterfaces('organization')
      .then(({interfaces}) => {
        setOrganizationInterfaces(interfaces)
      }).catch(e => {
      if (e.json)
        console.error(e.json);
      reportErrorToBackend(e);
      enqueueSnackbar(e.json?.message || "Error occurs when fetching organization Interfaces", {variant: 'error'});
    })
  }, [])

  useEffect(() => {
    fetchDataTypes('group').then(({groups, success}) => {
      if (success) {
        const organizationsWithGroups = groups?.map(groupObject => {
          return {
            groupName: groupObject.label,
            organizations: groupObject.organizations.map(organizationUri => ({_uri: organizationUri, legalName: organizationInterfaces?.[organizationUri]}))
          };
        });
        console.log(organizationsWithGroups)
        setOrganizationsWithGroups(organizationsWithGroups);
      }
    });
  }, [organizationInterfaces]);




  return <div>
    <FormControl>
      <Select
        style={{width: '250px'}}
        labelId="organization-label"
        id="organization-select"
        multiple
        value={selectedOrganizations}
        onChange={handleChange}
        input={<Input/>}
        renderValue={(selected) => {
          if (selected.filter(org => org !== '').length === 0) {
            return "Organization Filter";
          }
          return `Selected Organizations (${selected.filter(org => org !== '').length})`;
        }}
      >
        <MenuItem value={null} disabled>
          <em>Select Organizations</em>
        </MenuItem>
        <MenuItem key={'selectedAll'} onClick={handleSelectAllClick}>
          <Checkbox
            checked={selectedOrganizations.filter(organization => organization !== '').length === organizationsWithGroups.reduce((acc, group) => acc + group.organizations.length, 0)}/>
          Select All
        </MenuItem>
        {organizationsWithGroups.map((group) => (
          <div key={group.groupName}>
            <MenuItem onClick={() => handleGroupClick(group)}>
              <Checkbox checked={areAllGroupOrgsSelected(group)}/>
              {group.groupName}
            </MenuItem>
            <MenuList style={{paddingLeft: '20px'}}>
              {group.organizations.map((organization) => (
                <MenuItem key={organization._uri} onClick={() => handleOrgClick(organization)}>
                  <Checkbox checked={selectedOrganizations.includes(organization._uri)}/>
                  {organization.legalName}
                </MenuItem>
              ))}
            </MenuList>
          </div>
        ))}
      </Select>
    </FormControl>
  </div>
}

