import {getJson} from "./index";

export async function fetchHowMuchImpacts(subType) {
  return getJson('/api/howMuchImpacts/' + subType);
}