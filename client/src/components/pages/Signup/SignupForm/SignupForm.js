import React from 'react';
import InputField from "../../InputField/InputField";
import UserTypeSelector from '../UserTypeSelection/UserTypeSelection';

const SignupForm = ({ formData, handleChange, handleUserTypeChange, handleSubmit, navigate }) => {
  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="שם פרטי"
        type="text"
        id="firstName"
        value={formData.firstName}
        onChange={(e) => handleChange(e)}
        required
      />
      <InputField
        label="שם משפחה"
        type="text"
        id="lastName"
        value={formData.lastName}
        onChange={(e) => handleChange(e)}
        required
      />
      <InputField
        label="אימייל"
        type="email"
        id="email"
        value={formData.email}
        onChange={(e) => handleChange(e)}
        required
      />
      <InputField
        label="סיסמא"
        type="password"
        id="password"
        value={formData.password}
        onChange={(e) => handleChange(e)}
        required
      />
      <InputField
        label="אימות סיסמא"
        type="password"
        id="confirmPassword"
        value={formData.confirmPassword}
        onChange={(e) => handleChange(e)}
        required
      />

      <UserTypeSelector
        userType={formData.userType}
        handleUserTypeChange={handleUserTypeChange}
      />

      <button type="submit" className="btn btn-primary">הירשם</button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => navigate('/login')}
      >
        כבר רשום? התחבר כאן
      </button>
    </form>
  );
};

export default SignupForm;
