import { getJson } from "./index"; 

export async function fetchNodeGraphData() {
  return getJson('/api/nodeGraph/');
}

export async function fetchNodeGraphDataByOrganization(organizations) {
  return postJson('/api/nodeGraph/byOrganization', { organizations });
}