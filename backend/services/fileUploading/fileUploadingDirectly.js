const {Server400Error} = require("../../utils");
const {expand} = require("jsonld");
const {getRepository} = require("graphdb-utils");
const { RDFMimeType } = require('graphdb').http;

async function fileUploadingDirectly(req, res, next) {

  const {objects, fileName} = req.body;

  const expandedJsonLD = await expand(objects);

  const jsonldData = JSON.stringify(expandedJsonLD);
  // await fs.writeFile(tempFilePath, jsonldData, 'utf8');

  // const readStream = new Readable();
  // readStream.push(jsonldData);
  // readStream.push(null); // Signal end of the stream


  const repo = await getRepository()

  // await repo.uploadData(jsonldData, RDFMimeType.JSON_LD);

  // const ret = await repo.addFile(tempFilePath, RDFMimeType.JSON_LD, null, null)
  await repo.upload(jsonldData, RDFMimeType.JSON_LD, null, null);

  // return repo.addFile(jsonldData, RDFMimeType.JSON_LD, null, null).then(() => {
  //   return rdfClient.getSize();
  // }).then((response) => {
  //   expect(response).toBe(1839);
  // });

  return res.status(200).json({success: true, traceOfUploading: 'Successfully uploaded the file '+ fileName});




}

module.exports = {fileUploadingDirectly}