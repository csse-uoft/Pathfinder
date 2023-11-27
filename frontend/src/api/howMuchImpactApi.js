import {getJson, postJson} from "./index";

export async function fetchHowMuchImpacts(subType) {
  return getJson('/api/howMuchImpacts/' + subType);
}

export async function fetchHowMuchImpact(uri) {
  return getJson('/api/howMuchImpact/' + uri);
}

export async function fetchHowMuchImpactInterfaces() {
  return getJson('/api/howMuchImpacts/interface');
}

export async function createHowMuchImpact(params) {
  return postJson('/api/howMuchImpact/', params);
}