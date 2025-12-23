import React, { useState, useEffect } from "react";
import axios from "axios";
import Antigravity from "./Antigravity";
import Hyperspeed from "./Hyperspeed";
import "./Hyperspeed.css";
import RotatingText from "./RotatingText";

function App() {
  // --- ESTADOS ---
  const [isRegister, setIsRegister] = useState(false); // Alternar entre Login y Registro
  const [user, setUser] = useState(null); // Guardar el usuario que inició sesión
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [pedidosActivos, setPedidosActivos] = useState([]);
  const [metricas, setMetricas] = useState({ promedio: 0, historial: [] });
  const [datosEnvio, setDatosEnvio] = useState({
    origen: "",
    destino: "",
    km: 0,
  });
  const [misPedidos, setMisPedidos] = useState([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: "cliente", // por defecto
    vehiculo: "",
  });

  // --- LÓGICA DE AUTENTICACIÓN (LOGIN / REGISTRO) ---
  const handleAuth = async () => {
    // Validación básica
    if (!formData.email || !formData.password) {
      alert("Por favor, llena los campos básicos.");
      return;
    }

    try {
      if (isRegister) {
        // FLUJO DE REGISTRO (Épica A)
        await axios.post("http://localhost:8000/registro", {
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          rol: formData.rol,
          vehiculo: formData.vehiculo,
        });
        alert("Registro exitoso. Ahora inicia sesión.");
        setIsRegister(false); // Cambiamos a vista de Login automáticamente
      } else {
        // FLUJO DE LOGIN (Requisito de evitar acceso no registrado)
        const res = await axios.post(
          `http://localhost:8000/login?email=${formData.email}&psw=${formData.password}`
        );
        setUser(res.data); // Guardamos al usuario y su ROL
        alert(`Bienvenido, ${res.data.nombre}`);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Ocurrió un problema"));
    }
  };

  const enviarSolicitud = async () => {
    try {
      await axios.post(
        `http://localhost:8000/crear-pedido?origen=${datosEnvio.origen}&destino=${datosEnvio.destino}&km=${datosEnvio.km}&cliente_email=${user.email}`
      );
      alert("¡Pedido creado exitosamente!");
      setDatosEnvio({ origen: "", destino: "", km: 0 }); // Limpiar formulario
    } catch (err) {
      alert("Error al crear pedido");
    }
  };

  const cargarPedidos = async () => {
    try {
      const res = await axios.get("http://localhost:8000/pedidos-disponibles");
      setPedidosDisponibles(res.data);
    } catch (err) {
      alert("Error al cargar pedidos");
    }
  };

  const manejarAceptar = async (id) => {
    try {
      await axios.put(
        `http://localhost:8000/aceptar-pedido/${id}?repartidor_email=${user.email}`
      );
      alert("Pedido aceptado con éxito. ¡Buen viaje!");
      cargarPedidos(); // Refrescar la lista
    } catch (err) {
      alert("No se pudo aceptar el pedido");
    }
  };

  const finalizarEnvio = async (id) => {
    await axios.put(`http://localhost:8000/finalizar-pedido/${id}`);
    alert("Entrega confirmada. ¡Buen trabajo!");
    cargarPedidos(); // Actualiza la lista
  };

  const calificarPedido = async (id, estrellas) => {
    try {
      await axios.post(
        `http://localhost:8000/calificar-pedido/${id}?estrellas=${estrellas}`
      );
      alert(`Calificaste con ${estrellas} estrellas. ¡Gracias!`);
      // Opcional: Recargar los pedidos del cliente para actualizar la vista
      cargarMisPedidos();
    } catch (err) {
      alert("Error al calificar");
    }
  };

  const cargarMisPedidos = async () => {
    try {
      // Usamos el email del usuario logueado para filtrar
      const res = await axios.get(
        `http://localhost:8000/mis-pedidos/${user.email}`
      );
      setMisPedidos(res.data);
    } catch (err) {
      console.error("Error al cargar mis pedidos", err);
      alert("No se pudieron cargar tus pedidos.");
    }
  };

  const cargarTareasRepartidor = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/pedidos-repartidor/${user.email}`
      );
      setPedidosActivos(res.data);
    } catch (err) {
      console.error("Error al cargar tareas");
    }
  };

  const cargarMetricas = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/metricas-repartidor/${user.email}`
      );
      setMetricas(res.data);
    } catch (err) {
      console.error("Error al cargar métricas");
    }
  };

  const refrescarTodo = () => {
    cargarPedidos(); // Carga los "Disponibles"
    cargarTareasRepartidor(); // Carga los "En camino"
    cargarMetricas(); // Carga las métricas
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    outline: "none",
  };

  useEffect(() => {
    if (user && user.rol === "cliente") {
      cargarMisPedidos();
    }
  }, [user]);

  // --- COMPONENTE: FORMULARIO DE ACCESO ---
  if (!user) {
    return (
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#000", // Fondo oscuro para que resalte el color #FF9FFC
        }}
      >
        {/* CAPA DE FONDO: Antigravity */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        >
          <Antigravity
            count={300}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color={"#FF9FFC"}
            autoAnimate={true}
            particleVariance={1}
          />
        </div>

        {/* CAPA DE CONTENIDO: Formulario */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            fontFamily: "Arial",
          }}
        >
          {/* Contenedor con fondo semi-transparente para legibilidad */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "40px",
              borderRadius: "15px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: "350px",
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: "0 0 10px 0", color: "#333" }}>
              Flash Delivery
            </h1>
            <h2
              style={{
                fontSize: "1.2rem",
                color: "#666",
                marginBottom: "20px",
              }}
            >
              {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {isRegister && (
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  style={inputStyle}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              )}

              {isRegister && (
                <select
                  style={inputStyle}
                  onChange={(e) =>
                    setFormData({ ...formData, rol: e.target.value })
                  }
                >
                  <option value="Cliente">Soy Cliente</option>
                  <option value="Repartidor">Soy Repartidor</option>
                </select>
              )}

              {isRegister && formData.rol === "Repartidor" && (
                <input
                  type="text"
                  placeholder="Vehículo (Moto/Carro)"
                  style={inputStyle}
                  onChange={(e) =>
                    setFormData({ ...formData, vehiculo: e.target.value })
                  }
                />
              )}

              <input
                type="email"
                placeholder="Correo Electrónico"
                style={inputStyle}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Contraseña"
                style={inputStyle}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />

              <button
                onClick={handleAuth}
                style={{
                  padding: "12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginTop: "10px",
                }}
              >
                {isRegister ? "Registrarse" : "Ingresar"}
              </button>

              <p
                onClick={() => setIsRegister(!isRegister)}
                style={{
                  color: "#007bff",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.9rem",
                  marginTop: "10px",
                }}
              >
                {isRegister
                  ? "¿Ya tienes cuenta? Inicia sesión"
                  : "¿No tienes cuenta? Regístrate gratis"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DESPUÉS DEL LOGIN (SEGÚN ROL) ---
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        minHeight: "100vh",
        overflowX: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* CAPA DE FONDO: Hyperspeed para ambas vistas */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <Hyperspeed />
      </div>

      {/* CAPA DE CONTENIDO: Header y Main */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "20px",
          color: "#333",
        }}
      >
        {/* HEADER: Con fondo para resaltar sobre el fondo animado */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "15px 20px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, color: "#007bff", fontSize: "1.5rem" }}>
              Flash
            </h2>
            <RotatingText
              texts={["Delivery", "Rápido", "Seguro", "Ya!"]}
              mainClassName="px-2 bg-cyan-300 text-black overflow-hidden py-1 justify-center rounded-lg font-bold"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
          <p style={{ margin: 0 }}>
            Usuario: <b>{user.nombre}</b> | Rol: <b>{user.rol}</b>
          </p>
          <button
            onClick={() => setUser(null)}
            style={{
              padding: "8px 15px",
              cursor: "pointer",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            Cerrar Sesión
          </button>
        </header>

        <main style={{ maxWidth: "900px", margin: "0 auto" }}>
          {user.rol === "cliente" ? (
            /* --- VISTA CLIENTE --- */
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                padding: "25px",
                borderRadius: "15px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ color: "#007bff" }}>Solicitar Nuevo Envío</h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxWidth: "400px",
                }}
              >
                <input
                  placeholder="Punto de Origen"
                  value={datosEnvio.origen}
                  style={inputStyle}
                  onChange={(e) =>
                    setDatosEnvio({ ...datosEnvio, origen: e.target.value })
                  }
                />
                <input
                  placeholder="Punto de Destino"
                  value={datosEnvio.destino}
                  style={inputStyle}
                  onChange={(e) =>
                    setDatosEnvio({ ...datosEnvio, destino: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Distancia en KM"
                  value={datosEnvio.km}
                  style={inputStyle}
                  onChange={(e) =>
                    setDatosEnvio({ ...datosEnvio, km: e.target.value })
                  }
                />

                <div
                  style={{
                    margin: "10px 0",
                    fontWeight: "bold",
                    color: "#28a745",
                    fontSize: "1.2rem",
                  }}
                >
                  Tarifa calculada: Q{datosEnvio.km * 5}
                </div>

                <button
                  onClick={enviarSolicitud}
                  style={{
                    padding: "12px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  🚀 Solicitar Envío Flash
                </button>
              </div>

              <hr
                style={{
                  margin: "30px 0",
                  border: "0",
                  borderTop: "1px solid #eee",
                }}
              />

              <h3>Mis Pedidos Recientes</h3>
              <button
                onClick={cargarMisPedidos}
                style={{ marginBottom: "15px" }}
              >
                🔄 Actualizar
              </button>

              <div style={{ display: "grid", gap: "10px" }}>
                {misPedidos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: "1px solid #ddd",
                      padding: "15px",
                      borderRadius: "10px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <p style={{ margin: "0 0 10px 0" }}>
                      Destino: <b>{p.destino}</b> | Estado:{" "}
                      <span
                        style={{
                          color: p.estado === "Entregado" ? "green" : "orange",
                        }}
                      >
                        {p.estado}
                      </span>
                    </p>
                    {p.estado === "Entregado" && !p.calificacion ? (
                      <div
                        style={{
                          backgroundColor: "#f0f7ff",
                          padding: "10px",
                          borderRadius: "8px",
                        }}
                      >
                        <p style={{ margin: "0 0 5px 0", fontSize: "0.9rem" }}>
                          ¿Cómo fue tu servicio?
                        </p>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => calificarPedido(p.id, num)}
                            style={{
                              marginRight: "8px",
                              cursor: "pointer",
                              border: "1px solid #007bff",
                              borderRadius: "5px",
                              background: "white",
                            }}
                          >
                            {num} ⭐
                          </button>
                        ))}
                      </div>
                    ) : p.calificacion ? (
                      <p style={{ color: "#d4af37", margin: 0 }}>
                        Tu calificación: {p.calificacion} ⭐
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- VISTA REPARTIDOR --- */
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                padding: "25px",
                borderRadius: "15px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e9f7ef",
                  padding: "15px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "1px solid #c3e6cb",
                }}
              >
                <h3 style={{ marginTop: 0 }}>📦 Mis Entregas en Progreso</h3>
                {pedidosActivos.length === 0 ? (
                  <p>No tienes entregas activas.</p>
                ) : (
                  pedidosActivos.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: "#fff",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        border: "1px solid #28a745",
                      }}
                    >
                      <p style={{ margin: "0 0 10px 0" }}>
                        <b>Ruta:</b> {p.origen} ➔ {p.destino}
                      </p>
                      <button
                        onClick={() => finalizarEnvio(p.id)}
                        style={{
                          backgroundColor: "#dc3545",
                          color: "white",
                          padding: "8px 15px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Marcar como Entregado
                      </button>
                    </div>
                  ))
                )}
              </div>

              <h3>🛒 Pedidos Disponibles</h3>
              <button onClick={refrescarTodo} style={{ marginBottom: "15px" }}>
                🔄 Actualizar Todo
              </button>
              <div style={{ display: "grid", gap: "10px" }}>
                {pedidosDisponibles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: "1px solid #ccc",
                      padding: "15px",
                      borderRadius: "10px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <p style={{ margin: "0 0 10px 0" }}>
                      {p.origen} ➔ {p.destino} | <b>Q{p.tarifa}</b>
                    </p>
                    <button
                      onClick={() => manejarAceptar(p.id)}
                      style={{
                        backgroundColor: "#007bff",
                        color: "white",
                        padding: "8px 15px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Aceptar Pedido
                    </button>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "30px",
                  borderTop: "2px solid #eee",
                  paddingTop: "20px",
                }}
              >
                <h3>
                  ⭐ Mi Reputación:{" "}
                  <span style={{ color: "#d4af37" }}>
                    {metricas.promedio} / 5
                  </span>
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  Basado en {metricas.total_calificaciones} calificaciones
                </p>
                <h4>Historial Reciente:</h4>
                {metricas.historial.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      fontSize: "14px",
                      borderBottom: "1px solid #eee",
                      padding: "8px 0",
                    }}
                  >
                    <span>Destino: {p.destino}</span> |{" "}
                    <b>{p.calificacion} ⭐</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
