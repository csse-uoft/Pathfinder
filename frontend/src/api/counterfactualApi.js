import {getJson, postJson} from "./index";

export async function createCounterfactual(params) {
  return postJson('/api/counterfactual/', params);
}

export async function fetchCounterfactuals() {
  return getJson('/api/counterfactuals/');
}

export async function fetchCounterfactualInterfaces() {
  return getJson('/api/counterfactuals/interface/');
}
