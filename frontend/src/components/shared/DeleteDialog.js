import React from 'react';
import {Button} from "@mui/material";
import LoadingButton from "./LoadingButton";
import {AlertDialog} from "./Dialogs";


export default function DeleteDialog({state, setState, handleDelete, selectedUri, ...props}) { // cannot use keyword "delete"

  return (
    <AlertDialog dialogContentText={state.confirmDialog}
                 dialogTitle={state.continueButton?
                   ' The Object is referred by these subjects, are you sure you would like to delete it? ':
                   'The Object is referred by these subjects by mandatory predicate, you cannot delete it.'
                 }
                 buttons={[<Button onClick={() => setState(state => ({...state, confirmDialog: ''}))}
                                   key={'cancel'}>{'cancel'}</Button>,state.continueButton?
                   <LoadingButton noDefaultStyle variant="text" color="primary" loading={state.loadingButton}
                                  key={'confirm'}
                                  onClick={() => handleDelete(selectedUri)} children="confirm" autoFocus/>:null]}
                 open={!!state.confirmDialog}/>
  );
}