import "../styles/RoleSelector.css";

const ROLE_CONFIG = {
  estudiante: {
    label: "Estudiante",
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="6" r="3" fill={active ? "white" : "#9ca3af"} />
        <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  docente: {
    label: "Docente",
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="4" y="2" width="8" height="8" rx="1" fill={active ? "white" : "#9ca3af"} />
        <rect x="2" y="12" width="12" height="3" rx="1" fill={active ? "white" : "#9ca3af"} />
        <path d="M8 10v2" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" />
      </svg>
    ),
  },
  admin_lab: {
    label: "Admin",
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5l2 4h4l-3.3 2.4 1.3 4L8 9.8l-4 2.1 1.3-4L2 5.5h4z" fill={active ? "white" : "#9ca3af"} />
      </svg>
    ),
  },
  jefatura: {
    label: "Jefatura",
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="7" width="12" height="8" rx="1" fill={active ? "white" : "#9ca3af"} />
        <path d="M5 7V6a3 3 0 016 0v1" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
};

function RoleSelector({ roles, selected, onChange }) {
  return (
    <div className="role-selector">
      {roles.map((role) => {
        const config = ROLE_CONFIG[role];
        const isActive = selected === role;
        return (
          <button
            key={role}
            className={`role-btn ${isActive ? "active" : ""}`}
            onClick={() => onChange(role)}
          >
            <div className="role-icon">{config.icon(isActive)}</div>
            <span className="role-label">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default RoleSelector;