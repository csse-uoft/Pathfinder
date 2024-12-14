import {postJson} from "./index";

export async function uploadFile(objects, mode ,organizationUri, fileName) {
  return postJson('/api/fileUploading', {objects, organizationUri, fileName, mode});
}