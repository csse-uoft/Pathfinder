import GeneralField from "./GeneralField";
import React, {useState} from "react";

export default function URIField({
                                       add, edit, key, label, value, sx, onChange, error, helperText, onBlur,
                                     }) {

  function Collapsible({children }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleContent = () => {
      setIsOpen(!isOpen);
    };

    return (
      <div>
        <button href="#" onClick={toggleContent}>
          {isOpen? 'Hide URI' : 'Show URI'}
        </button>
        {isOpen && <div>{children}</div>}
      </div>
    );
  }

  if (add) {
    return <GeneralField
      key={key}
      label={label}
      value={value}
      sx={sx}
      onChange={onChange}
      error={!!error}
      helperText={helperText}
      onBlur={onBlur}
    />
  } else if (edit) {
    return <Collapsible children={value}/>
  }
}