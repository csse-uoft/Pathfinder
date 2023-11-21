import {getJson} from "./index";

export async function fetchHowMuchImpact(subType) {
  return getJson('/api/howMuchImpacts/' + subType);
}