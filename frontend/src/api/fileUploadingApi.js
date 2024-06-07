import {postJson} from "./index";

export async function uploadFile(objects, multipleOrganizations ,organizationUri, fileName) {
  return postJson('/api/fileUploading', {objects, organizationUri, fileName, multipleOrganizations});
}