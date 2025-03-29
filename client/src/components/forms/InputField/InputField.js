import React from "react";

const InputField = ({ label, type, value, onChange, id }) => {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        type={type}
        className="form-control"
        id={id}
        placeholder={`הכנס ${label}`}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
};

export default InputField;
