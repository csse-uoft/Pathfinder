const {createGraphDBModel, Types, DeleteType} = require("graphdb-utils");

const GDBInstant = createGraphDBModel({
  date: {type: Date, internalKey: 'time:inXSDDate', onDelete: DeleteType.CASCADE}
}, {
  rdfTypes: ['time:Instant'], name: 'timeInstant'
})

const GDBDateTimeIntervalModel = createGraphDBModel({
  hasBeginning: {type: GDBInstant, internalKey: 'time:hasBeginning', onDelete: DeleteType.CASCADE},
  hasEnd: {type: GDBInstant, internalKey: 'time:hasEnd', onDelete: DeleteType.CASCADE}

}, {
  rdfTypes: ['time:DateTimeInterval'], name: 'dateTimeInterval'
});


module.exports = {
  GDBDateTimeIntervalModel, GDBInstant
}