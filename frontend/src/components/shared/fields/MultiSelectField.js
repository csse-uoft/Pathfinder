import React, {useCallback, useEffect, useState} from "react";
import { Autocomplete, TextField } from "@mui/material";
import {Help as HelpIcon} from "@mui/icons-material";
import RadioField from "./RadioField";

export default function Dropdown(props) {
  // options is {labelValue1: label1, labelValue2: label2, ...}
  const {options, label, value, onChange, helperText, required, error, onBlur, disabled, questionMarkOnClick, minWidth, fullWidth, chooseAll, twoLayerLabels, sx} = props;

  const handleChange = useCallback((e, value) => {
    if (value.includes('Choose All') && chooseAll) {
      setState(Object.keys(options))
      onChange({target: {value: Object.keys(options)}});
    } else {
      setState(value)
      onChange({target: {value}});
    }
  }, [onChange]);


  const [layer, setLayer] = useState(twoLayerLabels? Object.keys(options)[0] : null)
  const [state, setState] = useState(value)

  useEffect(() => {
    setState(value)
  }, [value])

  return (
    <div>
      <Autocomplete
        sx={{mt: '16px', ...sx}}
        multiple
        options={twoLayerLabels? Object.keys(options[layer]) : (chooseAll? ['Choose All', ...Object.keys(options)]: Object.keys(options))}
        onChange={handleChange}
        getOptionLabel={twoLayerLabels? (labelValue=> options[layer][labelValue] || 'Choose All') : (labelValue=> options[labelValue] || 'Choose All')}
        defaultValue={state}
        value={state}
        onBlur={onBlur}
        fullWidth={fullWidth}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            required={required}
            label={label}
            sx={{minWidth: minWidth || 350, ...sx}}
            fullWidth={fullWidth}
            helperText={helperText}
            error={error}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} style={{
            whiteSpace: 'normal',           // Allow wrapping at natural spaces
            overflowWrap: 'break-word',     // Wrap long words when necessary
            wordBreak: 'break-word',        // Force break within long words if no white space is available
          }}>
            {twoLayerLabels ? options[layer][option] || 'Choose All' : options[option] || 'Choose All'}
          </li>
        )}
      />
      {questionMarkOnClick?<HelpIcon
        cursor={'pointer'}
        onClick={questionMarkOnClick}
        sx={{mt: '25px'}}
        color={"primary"}
      />:<div/>}

      <br/>
      {twoLayerLabels?
        <RadioField value={layer}
                    onChange={(e) => {setLayer(e.target.value)}}
                    options={((labels) => {
                      const ret = {}
                      labels.map(label => ret[label] = label)
                      return ret
                    })(Object.keys(options))}
                    row
        />
        : <div/>
      }


    </div>

  )
}
