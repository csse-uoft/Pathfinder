import {getJson, postJson} from "./index";

export async function fetchNodeGraphData(classType) {
  return getJson('/api/nodeGraph/' + classType);
}

export async function fetchNodeGraphDataByOrganization(organizations) {
  return postJson('/api/nodeGraph/', {organizations});
}