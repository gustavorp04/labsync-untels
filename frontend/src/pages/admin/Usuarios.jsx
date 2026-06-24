import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import userService from "../../services/userService";

const Icon = {
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const EMPTY_USUARIO = { nombre:"",email:"",codigo_universitario:"",id_rol:2,carrera:"",departamento:"",ciclo:1 };

function AdminUsuarios() {
  const { setFeedbackMsg } = useOutletContext();

  const [usuarios, setUsuarios]             = useState([]);
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario]     = useState({ ...EMPTY_USUARIO });
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [filterRol, setFilterRol]           = useState("todos");
  const [userPage, setUserPage]             = useState(1);

  const fetchUsuarios = useCallback(async () => {
    try {
      const data = await userService.getUsuarios();
      setUsuarios(data);
    } catch {
      setFeedbackMsg({ tipo:'error', texto:'Error al cargar los usuarios.' });
    }
  }, [setFeedbackMsg]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  useEffect(() => { setUserPage(1); }, [userSearchTerm, filterRol]);

  const handleCreateUsuario = async (e) => {
    e.preventDefault();
    try {
      await userService.crearUsuario(nuevoUsuario);
      setMostrarFormUsuario(false);
      setNuevoUsuario({ ...EMPTY_USUARIO });
      setFeedbackMsg({ tipo:'ok', texto:'Usuario creado exitosamente.' });
      fetchUsuarios();
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const labels = { email:'Email',codigo_universitario:'Código universitario',ciclo:'Ciclo',nombre:'Nombre',id_rol:'Rol',non_field_errors:'' };
        const msgs = Object.entries(data).map(([field, errs]) => {
          const label = labels[field] ?? field;
          const msg = Array.isArray(errs) ? errs[0] : errs;
          return label ? `${label}: ${msg}` : String(msg);
        });
        setFeedbackMsg({ tipo:'error', texto: msgs.join(' — ') });
      } else {
        setFeedbackMsg({ tipo:'error', texto:"Error al crear usuario. Verifica los datos." });
      }
    }
  };

  const handleDeleteUsuario = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await userService.eliminarUsuario(id);
      setFeedbackMsg({ tipo:'ok', texto:'Usuario eliminado exitosamente.' });
      fetchUsuarios();
    } catch {
      setFeedbackMsg({ tipo:'error', texto:"Error al eliminar usuario." });
    }
  };

  const filteredUsers = usuarios.filter(u => {
    const matchesSearch = u.nombre.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.codigo_universitario.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRol = filterRol === "todos" || u.rol.toLowerCase() === filterRol;
    return matchesSearch && matchesRol;
  });

  const usersPerPage = 5;
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  return (
    <div className="table-section">
      <div className="top-actions">
        <div className="search-group">
          <Icon.Search />
          <input type="text" placeholder="Buscar por nombre o código..." className="search-input" value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
        </div>
        <select className="filter-select" value={filterRol} onChange={e => setFilterRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          <option value="docente">Docentes</option>
          <option value="estudiante">Estudiantes</option>
          <option value="admin_lab">Administradores</option>
        </select>
        <button className="btn-new-user" onClick={() => setMostrarFormUsuario(!mostrarFormUsuario)}>
          {mostrarFormUsuario ? "Cerrar" : "+ Nuevo Usuario"}
        </button>
      </div>

      {mostrarFormUsuario && (
        <form onSubmit={handleCreateUsuario} className="user-form-grid">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input type="text" placeholder="Ej: Juan Pérez" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email Institucional</label>
            <input type="email" placeholder="email@untels.edu.pe" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Código Universitario</label>
            <input type="text" placeholder="2024100XXX" value={nuevoUsuario.codigo_universitario} onChange={e => setNuevoUsuario({...nuevoUsuario, codigo_universitario: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Rol de Usuario</label>
            <select value={nuevoUsuario.id_rol} onChange={e => setNuevoUsuario({...nuevoUsuario, id_rol: parseInt(e.target.value)})}>
              <option value="1">Estudiante</option>
              <option value="2">Docente</option>
              <option value="3">Administrador</option>
            </select>
          </div>
          {nuevoUsuario.id_rol === 1 && (
            <>
              <div className="form-group">
                <label>Carrera</label>
                <select value={nuevoUsuario.carrera} onChange={e => setNuevoUsuario({...nuevoUsuario, carrera: e.target.value})} required>
                  <option value="">Seleccionar carrera...</option>
                  <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                  <option value="Ingeniería Electrónica">Ingeniería Electrónica</option>
                  <option value="Ingeniería Ambiental">Ingeniería Ambiental</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ciclo Actual</label>
                <input type="number" min="1" max="12" value={nuevoUsuario.ciclo} onChange={e => setNuevoUsuario({...nuevoUsuario, ciclo: e.target.value})} required />
              </div>
            </>
          )}
          {nuevoUsuario.id_rol === 2 && (
            <div className="form-group" style={{ gridColumn:'span 2' }}>
              <label>Departamento Académico</label>
              <input type="text" placeholder="Ej: Ingeniería y Gestión" value={nuevoUsuario.departamento} onChange={e => setNuevoUsuario({...nuevoUsuario, departamento: e.target.value})} required />
            </div>
          )}
          <div style={{ gridColumn:'span 2',marginTop:10 }}>
            <button type="submit" className="btn-save-user"><Icon.Plus /> Crear Usuario Ahora</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Opciones</th></tr>
        </thead>
        <tbody>
          {paginatedUsers.map(u => (
            <tr key={u.id_usuario}>
              <td><strong>{u.codigo_universitario}</strong></td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td><span className={`badge-rol ${u.rol.toLowerCase()}`}>{u.rol}</span></td>
              <td><div className="option-buttons"><button className="delete-btn" onClick={() => handleDeleteUsuario(u.id_usuario)}>Eliminar</button></div></td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign:'center',opacity:0.5 }}>No hay usuarios cargados.</td></tr>
          )}
        </tbody>
      </table>

      {filteredUsers.length > 0 && (
        <div className="pagination" style={{ marginTop:20,display:'flex',justifyContent:'center',gap:12,alignItems:'center' }}>
          <button disabled={userPage === 1} onClick={() => setUserPage(userPage - 1)} style={{ opacity: userPage === 1 ? 0.4 : 1,cursor: userPage === 1 ? 'not-allowed' : 'pointer',padding:'6px 12px',fontSize:13 }}>Anterior</button>
          <span style={{ fontSize:13,opacity:0.8,color:'var(--text-main)',fontWeight:600 }}>Página {userPage} de {totalUserPages}</span>
          <button disabled={userPage === totalUserPages} onClick={() => setUserPage(userPage + 1)} style={{ opacity: userPage === totalUserPages ? 0.4 : 1,cursor: userPage === totalUserPages ? 'not-allowed' : 'pointer',padding:'6px 12px',fontSize:13 }}>Siguiente</button>
        </div>
      )}
    </div>
  );
}

export default AdminUsuarios;
