import React from 'react';
import ThemeToggle from '../../../components/ThemeToggle';
import './AuthLayout.css';
import logo from '../../../assets/logo.png'; // Using the current logo for now, the user will update to the UNTELS logo

const AuthLayout = ({ children, bgImage, portalName }) => {
  return (
    <div className="auth-layout" style={{ backgroundImage: `linear-gradient(var(--glass-bg), var(--bg-main)), url(${bgImage})` }}>
      <div className="auth-header">
        <div className="auth-logo-container">
          <img src={logo} alt="UNTELS Logo" className="auth-logo" />
          <div className="auth-brand">
            <span className="auth-university">LabSync - UNTELS</span>
            <span className="auth-portal-name">{portalName}</span>
          </div>
        </div>
      </div>

      <div className="auth-content">
        {children}
      </div>

      <ThemeToggle />
    </div>
  );
};

export default AuthLayout;
