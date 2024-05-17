import {getJson, postJson} from "./index";


export async function createImpactRisk(params) {
  return postJson(`/api/impactRisk/`, params);
}

export async function fetchImpactRisks() {
  return getJson('/api/impactRisks/');
}

export async function fetchImpactRisk(uri) {
  return getJson('/api/impactRisk/' + uri);
}