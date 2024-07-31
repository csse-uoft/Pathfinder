import { getJson } from "./index"; 

export async function fetchNodeGraphData() {
  return getJson('/api/nodeGraph/');
}
