import {getJson, postJson} from "./index";

export async function fetchDataTypes(dataType, extra) {
  return getJson(`/api/${dataType}s/` + (extra? extra:''));
}

export async function fetchDataTypeInterfaces(dataType, extra) {
  return getJson(`/api/${dataType}s/interface/` + (extra? extra:''));
}

export async function createDataType(dataType, params, level) {
  return postJson(`/api/${dataType}`, params);
}

export async function fetchDataType(dataType, uri) {
  return getJson(`/api/${dataType}/${uri}/`);
}

