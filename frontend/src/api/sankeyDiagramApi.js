import {postJson} from "./index";

export async function fetchSankeyDiagramData(form) {
  return postJson('/api/sankeyDiagram/', form);
}