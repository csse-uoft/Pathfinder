export function messageGeneratorDeletingChecker(dict) {
  let message = ''
  for (let dataType in dict) {
    for (let uri of dict[dataType])
      message += `DataType: ${dataType}, URI: ${uri} \n`
  }
  return message
}