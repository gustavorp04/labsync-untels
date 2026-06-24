import { useOutletContext } from "react-router-dom";

function AdminInicio() {
  const { laboratorios } = useOutletContext();

  return (
    <div className="welcome-center">
      <h1>Bienvenido Admin</h1>
      <p>Panel principal de gestión LabSync UNTELS</p>
      <div style={{ display:'flex',gap:20,justifyContent:'center',marginTop:30,flexWrap:'wrap' }}>
        {[
          { label: 'Laboratorios Habilitados', val: laboratorios.filter(l => l.habilitado).length, color: '#10b981' },
          { label: 'En Mantenimiento',          val: laboratorios.filter(l => !l.habilitado).length, color: '#f59e0b' },
          { label: 'Total Laboratorios',        val: laboratorios.length, color: 'var(--untels-blue)' },
        ].map(card => (
          <div key={card.label} style={{ background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:12,padding:'20px 30px',textAlign:'center',minWidth:160 }}>
            <div style={{ fontSize:36,fontWeight:700,color:card.color }}>{card.val}</div>
            <div style={{ fontSize:13,opacity:0.7,marginTop:4 }}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminInicio;
