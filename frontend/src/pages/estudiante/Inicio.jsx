function EstudianteInicio() {
  const nombre = localStorage.getItem("nombre") || localStorage.getItem("username") || "Estudiante";

  return (
    <div className="est-welcome">
      <h1>¡Hola, {nombre}! 👋</h1>
      <p>Bienvenido al sistema de reserva de laboratorios.</p>
    </div>
  );
}

export default EstudianteInicio;
