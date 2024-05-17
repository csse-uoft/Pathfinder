import {getJson, postJson} from "./index";


export async function fetchImpactModels(organizationURI) {
  return getJson('/api/impactModels/' + organizationURI);
}

export async function fetchImpactModelInterfaces(organizationURI) {
  return getJson('/api/impactModels/interface/' + organizationURI);
}

export async function fetchImpactModel(uri) {
  return getJson('/api/impactModel/' + uri);
}

export async function createImpactModel(params) {
  return postJson(`/api/impactModel/`, params);
}