
import {deleteJson, getJson, postJson, putJson} from "./index";
import {isValidURL} from "../helpers/validation_helpers";


export async function fetchDataTypes(dataType, extra) {
  return getJson(`/api/${dataType}s/` + (extra? extra:''));
}

export async function fetchDataTypesGivenListOfUris(dataType, extra, listOfUris, propertyNameInRes) {
  const objectsDict = {}
  if (!Array.isArray(listOfUris)) {
    console.error(`invalid input: ${listOfUris}`);
  } else {
    for (const uri of listOfUris) {
      let res;
      if (!isValidURL(uri)) {
        console.error(`invalid uri: ${uri}`);
        continue;
      }
      if (extra) {
        res = await fetchDataTypes(dataType, `${extra}/${uri}`);
      } else {
        res = await fetchDataTypes(dataType, encodeURIComponent(uri));
      }
      objectsDict[uri] = res[propertyNameInRes] || [];
    }
  }
  return objectsDict;
}

export async function fetchDataTypeInterfaces(dataType, extra) {
  return getJson(`/api/${dataType}s/interface/` + (extra? extra:''));
}

export async function createDataType(dataType, params, level) {
  return postJson(`/api/${dataType}`, params);
}

export async function updateDataType(dataType, uri, params) {
  return putJson(`/api/${dataType}/${uri}`, params);
}

export async function fetchDataType(dataType, uri) {
  return getJson(`/api/${dataType}/${uri}/`);
}

export async function deleteDataType(dataType, uri, params, extra) {
  return deleteJson(`/api/${dataType}/${encodeURIComponent(uri)}/${extra}`, params);
}

