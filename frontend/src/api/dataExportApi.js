import {postJson} from "./index";

export async function dataExport(organizationUris, level, properties, dataTypes) {
  return postJson('/api/dataExport', {organizationUris, level, properties, dataTypes});
}