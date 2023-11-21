import {getJson, postJson} from "./index";

export async function fetchHowMuchImpacts(subType) {
  return getJson('/api/howMuchImpacts/' + subType);
}

export async function createHowMuchImpact(params) {
  return postJson('/api/howMuchImpact/', params);
}