import {getJson} from "./index";


export async function fetchFeatureInterfaces() {
  return getJson('/api/features/interface/');
}