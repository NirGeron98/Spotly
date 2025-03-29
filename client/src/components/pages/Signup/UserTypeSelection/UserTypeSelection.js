import React from 'react';

const UserTypeSelector = ({ userType, handleUserTypeChange }) => {
  return (
    <div className="form-group">
      <label className="form-label">סוג משתמש:</label>
      <div className="check-box-form-group">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={userType.includes("דייר בבניין מגורים")}
            onChange={() => handleUserTypeChange("דייר בבניין מגורים")}
            id="resident"
          />
          <label className="form-check-label" htmlFor="resident">
            דייר בבניין מגורים
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={userType.includes("בעל חניה פרטית")}
            onChange={() => handleUserTypeChange("בעל חניה פרטית")}
            id="privateParking"
          />
          <label className="form-check-label" htmlFor="privateParking">
            בעל חניה פרטית
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={userType.includes("משכיר חניה")}
            onChange={() => handleUserTypeChange("משכיר חניה")}
            id="renter"
          />
          <label className="form-check-label" htmlFor="renter">
            שוכר חניה
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelector;
