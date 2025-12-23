from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configuración para que React pueda comunicarse con Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CLASES (Modelos de datos) ---

class Usuario(BaseModel):
    email: str
    password: str
    nombre: str
    rol: str # "cliente" o "repartidor" [cite: 25]
    vehiculo: Optional[str] = None # Para el repartidor [cite: 26]

class Pedido(BaseModel):
    id: int
    cliente_email: str
    origen: str
    destino: str
    descripcion: str
    distancia_km: float
    tarifa: float
    estado: str = "Disponible" # [cite: 33]
    repartidor_email: Optional[str] = None

# --- BASE DE DATOS VOLÁTIL (Memoria) ---
usuarios_db = []
pedidos_db = []

# --- RUTAS / ENDPOINTS ---

@app.post("/registro")
def registrar_usuario(usuario: Usuario):
    # Validación: evitar duplicados (Requisito fundamental)
    if any(u.email == usuario.email for u in usuarios_db):
        raise HTTPException(status_code=400, detail="El correo ya existe")
    
    usuarios_db.append(usuario)
    return {"message": "Usuario registrado exitosamente"}

@app.post("/login")
def login(email: str, psw: str):
    user = next((u for u in usuarios_db if u.email == email and u.password == psw), None)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return user

@app.post("/crear-pedido")
def crear_pedido(origen: str, destino: str, km: float, cliente_email: str):
    # Cálculo automático de tarifa base 
    tarifa = km * 5.0 
    
    nuevo_pedido = {
        "id": len(pedidos_db) + 1,
        "cliente": cliente_email,
        "origen": origen,
        "destino": destino,
        "distancia_km": km,
        "tarifa": tarifa,
        "estado": "Disponible" 
    }
    pedidos_db.append(nuevo_pedido)
    return nuevo_pedido

@app.get("/pedidos-disponibles")
def obtener_disponibles():
    return [p for p in pedidos_db if p["estado"] == "Disponible"]

@app.put("/aceptar-pedido/{pedido_id}")
def aceptar_pedido(pedido_id: int, repartidor_email: str):
    for p in pedidos_db:
        if p["id"] == pedido_id and p["estado"] == "Disponible":
            p["estado"] = "En camino" # El estado cambia obligatoriamente [cite: 33]
            p["repartidor"] = repartidor_email
            return p
    raise HTTPException(status_code=404, detail="Pedido no encontrado o ya tomado")

# Marcar como Entregado (Épica D)
@app.put("/finalizar-pedido/{pedido_id}")
def finalizar_pedido(pedido_id: int):
    for p in pedidos_db:
        if p["id"] == pedido_id:
            p["estado"] = "Entregado" # El estado cambia a la fase final
            return {"status": "success", "message": "Pedido finalizado"}
    raise HTTPException(status_code=404)

# Calificar el servicio (Épica D)
@app.post("/calificar-pedido/{pedido_id}")
def calificar_pedido(pedido_id: int, estrellas: int):
    if estrellas < 1 or estrellas > 5:
        raise HTTPException(status_code=400, detail="La calificación debe ser de 1 a 5")
    
    for p in pedidos_db:
        if p["id"] == pedido_id:
            p["calificacion"] = estrellas # Se guarda la calificación del cliente
            return {"status": "success"}
    raise HTTPException(status_code=404)

@app.get("/mis-pedidos/{email}")
def obtener_mis_pedidos(email: str):
    # Retorna solo los pedidos donde el cliente coincide con el email logueado
    mis_pedidos = [p for p in pedidos_db if p["cliente"] == email]
    return mis_pedidos

@app.get("/pedidos-repartidor/{email}")
def obtener_pedidos_repartidor(email: str):
    # Retorna solo los pedidos aceptados por este repartidor que están "En camino"
    return [p for p in pedidos_db if p.get("repartidor") == email and p["estado"] == "En camino"]

@app.get("/metricas-repartidor/{email}")
def obtener_metricas(email: str):
    # Filtramos todos los pedidos entregados por este repartidor que ya tienen calificación [cite: 35, 36]
    entregas_calificadas = [p for p in pedidos_db if p.get("repartidor") == email and "calificacion" in p]
    
    if not entregas_calificadas:
        return {"promedio": 0, "total_calificaciones": 0, "historial": []}
    
    total_estrellas = sum(p["calificacion"] for p in entregas_calificadas)
    promedio = total_estrellas / len(entregas_calificadas)
    
    return {
        "promedio": round(promedio, 2),
        "total_calificaciones": len(entregas_calificadas),
        "historial": entregas_calificadas
    }