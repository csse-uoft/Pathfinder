import {getJson} from "./index";


export async function fetchImpactModels(organizationURI) {
  return getJson('/api/impactModels/' + organizationURI);
}

export async function fetchImpactModelInterfaces(organizationURI) {
  return getJson('/api/impactModels/interface/' + organizationURI);
}