import {fetchDataTypeInterfaces, fetchDataTypes} from "../api/generalAPI";

export function handleSelectAllClick(organizationsWithGroups, setSelectedOrganizations, selectedOrganizations) {

  return () => {
    const allOrganizationUris = organizationsWithGroups.reduce((acc, group) => {
      return [...acc, ...group.organizations.map(org => org._uri)];
    }, []);

    // If all organizations are already selected, deselect all
    // Otherwise, select all organizations
    const updatedSelectedOrganizations = selectedOrganizations.length === allOrganizationUris.length
      ? []
      : allOrganizationUris;

    // Update the state with the new selection
    setSelectedOrganizations(updatedSelectedOrganizations);
  }
};

export function handleChange(minSelectedLength, setSelectedOrganizations) {
  return (e) => {
    const selectedValue = e.target.value;
    if (selectedValue.length >= minSelectedLength) {
      setSelectedOrganizations(selectedValue);
    }
  }
};

export function handleGroupClick(areAllGroupOrgsSelected, selectedOrganizations, setSelectedOrganizations) {
  return (group) => {
    const groupOrgs = group.organizations.map((org) => org._uri);

    // If the group is already selected, deselect it and all its organizations;
    // otherwise, select the group and all its organizations
    const updatedSelectedOrganizations = areAllGroupOrgsSelected(group)
      ? selectedOrganizations.filter((org) => !groupOrgs.includes(org))
      : [...selectedOrganizations, ...groupOrgs];

    // Update the state with the new selection
    setSelectedOrganizations(updatedSelectedOrganizations);
  };
}

export function handleOrgClick(selectedOrganizations, setSelectedOrganizations, organizationsWithGroups) {
  return (organization) => {
    // Check if the clicked organization is currently selected
    const isSelected = selectedOrganizations.includes(organization._uri);

    // Toggle the selection status of the clicked organization
    let updatedSelectedOrganizations;
    if (isSelected) {
      // If the organization is selected, remove it from the selection
      updatedSelectedOrganizations = selectedOrganizations.filter((org) => org !== organization._uri);
    } else {
      // If the organization is not selected, add it to the selection
      updatedSelectedOrganizations = [...selectedOrganizations, organization._uri];
    }

    // Update the state with the new selection
    setSelectedOrganizations(updatedSelectedOrganizations);

    // Find the group to which the organization belongs
    const group = organizationsWithGroups.find((grp) => grp.organizations.some((org) => org._uri === organization._uri));

    // If found and the organization was the only one selected in its group, deselect the group automatically
    if (group && group.organizations.length === 1 && isSelected) {
      handleGroupClick(group);
    }
  };
}

export function areAllGroupOrgsSelected(selectedOrganizations) {
  return (group) => {
    // Check if all organizations in the group are selected
    return group.organizations.every((org) => selectedOrganizations.includes(org._uri));
  }
};

export async function fetchOrganizationsWithGroups(setOrganizationsWithGroups, organizationInterfaces) {
  const {groups, success} = await fetchDataTypes('group');
  if (success) {
    const organizationsWithGroups = groups?.map(groupObject => {
      return {
        groupName: groupObject.label,
        organizations: groupObject.organizations.map(organizationUri => ({
          _uri: organizationUri,
          legalName: organizationInterfaces?.[organizationUri]
        }))
      };
    });
    console.log(organizationsWithGroups);
    setOrganizationsWithGroups(organizationsWithGroups);
  }
}




