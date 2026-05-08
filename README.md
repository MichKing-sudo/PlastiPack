# PlastiPack

Sistema de gestión de producción para **Plastipack S.A.**, una empresa fabricante de productos plásticos (bolsas, rollos y láminas). Controla el ciclo completo desde la creación de pedidos hasta la producción y entrega.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Chart.js, Axios |
| Backend | Node.js, Express 5, Mongoose 9 |
| Base de datos | MongoDB Atlas |
| Estilos | CSS personalizado (tema oscuro) |
| Linting | ESLint 10 |

---

## Estructura del proyecto

```
PlastiPack/
├── backend/           # API REST (Express + MongoDB)
│   ├── models/        # Schemas de Mongoose
│   ├── server.js      # Servidor Express + rutas API
│   └── seed.js        # Poblador de base de datos
└── frontend/          # SPA (React + Vite)
    ├── src/
    │   ├── context/   # AuthContext (roles y permisos)
    │   ├── components/# Componentes compartidos (Layout)
    │   └── pages/     # Páginas de la aplicación
    └── public/        # Archivos estáticos
```

---

## Roles

| Rol | Descripción |
|-----|------------|
| **Vendedor** | Crea y da seguimiento a pedidos |
| **Jefe de Producción** | Gestiona referencias, órdenes de producción y reportes |
| **Operario** | Registra reportes de turno en las órdenes asignadas |

---

## Instalación y ejecución

### 1. Backend

```bash
cd backend
npm install
node seed.js          # Poblar BD con datos de ejemplo
npm run dev           # Inicia servidor en :3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           # Inicia dev server en :5173
```

El frontend redirige `/api` a `localhost:3000` mediante proxy de Vite.

### 3. Acceso

Usuarios de prueba (contraseña: `1234`):

- **Jefe de Producción:** `jperez@plastipack.com` / `mrodriguez@plastipack.com`
- **Vendedor:** `atorres@plastipack.com` / `lgomez@plastipack.com` / `cmedina@plastipack.com`
- **Operario:** `rlopez@plastipack.com` / `fmartinez@plastipack.com` / `dgarcia@plastipack.com` / `hfernandez@plastipack.com` / `aramirez@plastipack.com`

---

## API REST

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios` | Listar usuarios (filtro `?rol=`) |
| POST | `/api/usuarios` | Crear usuario |
| PUT | `/api/usuarios/:id` | Actualizar usuario |
| DELETE | `/api/usuarios/:id` | Eliminar usuario |

### Referencias
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/referencias` | Listar referencias |
| POST | `/api/referencias` | Crear referencia |
| PUT | `/api/referencias/:id` | Actualizar referencia |
| DELETE | `/api/referencias/:id` | Desactivar referencia |

### Pedidos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pedidos` | Listar pedidos |
| POST | `/api/pedidos` | Crear pedido |
| PUT | `/api/pedidos/:id` | Actualizar pedido |
| PATCH | `/api/pedidos/:id/lineas/:lineaId` | Cambiar estado de línea |
| DELETE | `/api/pedidos/:id` | Eliminar pedido |

### Órdenes de Producción
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ordenes` | Listar órdenes |
| POST | `/api/ordenes` | Crear orden |
| PUT | `/api/ordenes/:id` | Actualizar orden |
| POST | `/api/ordenes/:id/reportes` | Agregar reporte de turno |
| DELETE | `/api/ordenes/:id` | Eliminar orden |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes/turno?fecha=` | Reporte de turno por selladora |

---

## Lógica de negocio

- **Secuencia de procesos:** Extrusión → Impresión/Refilado → Sellado. Un proceso no puede iniciar hasta que el anterior esté al 100%.
- **Numeración automática:** Los pedidos se numeran como `PED-XXXXX`.
- **Plazo mínimo:** La fecha de entrega debe ser al menos 15 días después de la creación.
- **Estado general:** Se calcula automáticamente según el estado de cada línea del pedido.
- **Eliminación suave:** Las referencias se desactivan en lugar de eliminarse.
