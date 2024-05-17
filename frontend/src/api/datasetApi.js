import {getJson, postJson} from "./index";

export async function createDataset(params) {
  return postJson('/api/dataset', params);
}

export async function fetchDatasets() {
  return getJson('/api/datasets/');
}

export async function fetchDatasetInterfaces() {
  return getJson('/api/datasets/interface');
}