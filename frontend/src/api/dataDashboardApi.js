import {postJson} from "./index";

export async function fetchOrganizationsData(organizations) {
  return postJson('/api/dataDashboard/', {organizations});
}