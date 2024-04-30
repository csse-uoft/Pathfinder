import {deleteDataType} from "../api/generalAPI";
import {reportErrorToBackend} from "../api/errorReportApi";

export function messageGenerator(dict) {
  let message = ''
  for (let dataType in dict) {
    for (let uri of dict[dataType])
      message += `DataType: ${dataType}, URI: ${uri} \n`
  }
  return message
}

export function handleDelete (objectType, deleteDialog, setState, setDeleteDialog, trigger, setTrigger) {

  return (uri, form) => {
    if (!deleteDialog.confirmDialog) {
      deleteDataType(objectType, uri).then(({success, mandatoryReferee, regularReferee}) => {
        if (success) {
          console.log(mandatoryReferee, regularReferee);
          if (Object.keys(mandatoryReferee)?.length) {
            setState(state => ({
              ...state, showDeleteDialog: false
            }));
            setDeleteDialog(state => ({
              ...state, confirmDialog: messageGenerator(mandatoryReferee), continueButton: false
            }));
          } else if (Object.keys(regularReferee)?.length && messageGenerator(regularReferee)) {
            setState(state => ({
              ...state, showDeleteDialog: false,
            }));
            setDeleteDialog(state => ({
              ...state, confirmDialog: messageGenerator(regularReferee), continueButton: true
            }));

          } else {
            // the object is not referred by anyone, can be removed safely
            setState(state => ({
              ...state, showDeleteDialog: false,
            }));
            setDeleteDialog(state => ({
              ...state, confirmDialog: 'The object is not referred by anyone, can be removed safely', continueButton: true, safe: true
            }));
          }

          // setTrigger(!trigger);
          // enqueueSnackbar(message || "Success", {variant: 'success'})
        }
      }).catch((e) => {
        setState(state => ({
          ...state, showDeleteDialog: false,
        }));
        reportErrorToBackend(e);
        setTrigger(!trigger);
        // enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else {
      setDeleteDialog(state => ({
        ...state, loadingButton: true
      }));
      deleteDataType(objectType, uri, {checked: true}).then(({success, message}) => {
        if (success) {
          setDeleteDialog(state => ({
            ...state, confirmDialog: '', loadingButton: false
          }));
          setTrigger(!trigger);
          // enqueueSnackbar(message || "Success", {variant: 'success'});
        }
      }).catch((e) => {
        setState(state => ({
          ...state, showDeleteDialog: false,
        }));
        reportErrorToBackend(e);
        setTrigger(!trigger);
        // enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    }
  }

};