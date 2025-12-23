import React, { useState, useEffect } from "react";
import axios from "axios";

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

  useEffect(() => {
    if (user && user.rol === "cliente") {
      cargarMisPedidos();
    }
  }, [user]);

  // --- COMPONENTE: FORMULARIO DE ACCESO ---
  if (!user) {
    return (
      <div
        style={{ padding: "50px", textAlign: "center", fontFamily: "Arial" }}
      >
        <h1>Flash Delivery</h1>
        <h2>{isRegister ? "Crear Cuenta" : "Iniciar Sesión"}</h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "300px",
            margin: "0 auto",
          }}
        >
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nombre Completo"
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />

              <select
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
              >
                <option value="Cliente">Soy Cliente</option>
                <option value="Repartidor">Soy Repartidor</option>
              </select>

              {formData.rol === "Repartidor" && (
                <input
                  type="text"
                  placeholder="Tipo de Vehículo (Moto/Carro)"
                  onChange={(e) =>
                    setFormData({ ...formData, vehiculo: e.target.value })
                  }
                />
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Correo Electrónico"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Contraseña"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <button
            onClick={handleAuth}
            style={{
              padding: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isRegister ? "Registrarse" : "Ingresar"}
          </button>

          <p
            onClick={() => setIsRegister(!isRegister)}
            style={{
              color: "blue",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isRegister
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate gratis"}
          </p>
        </div>
      </div>
    );
  }

  // --- VISTA DESPUÉS DEL LOGIN (SEGÚN ROL) ---
  return (
    <div style={{ padding: "20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #ccc",
        }}
      >
        <h2>Flash Delivery</h2>
        <p>
          Usuario: <b>{user.nombre}</b> | Rol: <b>{user.rol}</b>
        </p>
        <button onClick={() => setUser(null)}>Cerrar Sesión</button>
      </header>

      <main>
        {user.rol === "cliente" ? (
          <div
            style={{
              marginTop: "20px",
              border: "1px solid #ddd",
              padding: "15px",
            }}
          >
            <h3>Solicitar Nuevo Envío (Épica B)</h3>
            <input
              placeholder="Punto de Origen"
              value={datosEnvio.origen}
              onChange={(e) =>
                setDatosEnvio({ ...datosEnvio, origen: e.target.value })
              }
            />
            <br />
            <input
              placeholder="Punto de Destino"
              value={datosEnvio.destino}
              onChange={(e) =>
                setDatosEnvio({ ...datosEnvio, destino: e.target.value })
              }
            />
            <br />
            <input
              type="number"
              placeholder="Distancia en KM"
              value={datosEnvio.km}
              onChange={(e) =>
                setDatosEnvio({ ...datosEnvio, km: e.target.value })
              }
            />
            <br />

            <div
              style={{ margin: "10px 0", fontWeight: "bold", color: "green" }}
            >
              Tarifa calculada: Q{datosEnvio.km * 5}{" "}
              {/* Cálculo automático en tiempo real  */}
            </div>

            <button
              onClick={enviarSolicitud}
              style={{ backgroundColor: "#28a745", color: "white" }}
            >
              Solicitar Envío
            </button>

            <h3>Mis Pedidos Recientes</h3>
            <button onClick={cargarMisPedidos}>Actualizar Mis Pedidos</button>

            <div style={{ marginTop: "10px" }}>
              {misPedidos.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #eee",
                    padding: "10px",
                    marginBottom: "5px",
                  }}
                >
                  <p>
                    Destino: {p.destino} | <strong>Estado: {p.estado}</strong>
                  </p>

                  {/* LÓGICA DE CALIFICACIÓN: Solo si está ENTREGADO y no tiene calificación aún */}
                  {p.estado === "Entregado" && !p.calificacion ? (
                    <div
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: "10px",
                        borderRadius: "5px",
                      }}
                    >
                      <p style={{ margin: "0 0 5px 0" }}>
                        ¿Cómo fue tu servicio?
                      </p>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => calificarPedido(p.id, num)}
                          style={{ marginRight: "5px", cursor: "pointer" }}
                        >
                          {num} ⭐
                        </button>
                      ))}
                    </div>
                  ) : p.calificacion ? (
                    <p style={{ color: "gold", fontWeight: "bold" }}>
                      Tu calificación: {p.calificacion} ⭐
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {/* --- SECCIÓN 1: MIS ENTREGAS ACTIVAS (Épica D) --- */}
            <div
              style={{
                backgroundColor: "#e9f7ef",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h3>📦 Mis Entregas en Progreso</h3>
              {pedidosActivos.length === 0 ? (
                <p>No tienes entregas activas.</p>
              ) : (
                pedidosActivos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: "1px solid #28a745",
                      padding: "10px",
                      margin: "5px 0",
                      background: "white",
                    }}
                  >
                    <p>
                      <b>Ruta:</b> {p.origen} ➔ {p.destino}
                    </p>
                    <button
                      onClick={() => finalizarEnvio(p.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        padding: "8px",
                      }}
                    >
                      ✅ Marcar como Entregado
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* --- SECCIÓN 2: PEDIDOS DISPONIBLES (Épica C) --- */}
            <h3>🛒 Pedidos Disponibles en la Zona</h3>
            <button onClick={refrescarTodo}>🔄 Actualizar Todo</button>
            {pedidosDisponibles.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  margin: "10px 0",
                }}
              >
                <p>
                  {p.origen} ➔ {p.destino} | <b>Q{p.tarifa}</b>
                </p>
                <button
                  onClick={() => manejarAceptar(p.id)}
                  style={{ backgroundColor: "#007bff", color: "white" }}
                >
                  Aceptar Pedido
                </button>
              </div>
            ))}
            <h3>⭐ Mi Reputación como Repartidor</h3>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#d4af37",
                }}
              >
                {metricas.promedio} / 5
              </div>
              <p>Basado en {metricas.total_calificaciones} calificaciones</p>
            </div>

            <h4>Historial de Calificaciones Individuales:</h4>
            {metricas.historial.length === 0 ? (
              <p>Aún no tienes calificaciones registradas.</p>
            ) : (
              metricas.historial.map((p) => (
                <div
                  key={p.id}
                  style={{
                    fontSize: "14px",
                    borderBottom: "1px solid #eee",
                    padding: "5px 0",
                  }}
                >
                  <span>Destino: {p.destino}</span> |{" "}
                  <b>Calificación: {p.calificacion} ⭐</b>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
