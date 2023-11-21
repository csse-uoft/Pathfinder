import {postJson} from "./index";

export async function createCharacteristic(params) {
  return postJson('/api/dataset', params);
}
