
INSTRUCCIONES PARA EJECUTAR:

1. Instalar dependencias en backend:

   instalacion de node 
   verificar  node --version
   cd backend
   npm install express mysql2 cors dotenv

2. Crear base de datos 'portafolio_docente' en MySQL si no existe:
   CREATE DATABASE portafolio_docente;

3. Ejecutar backend:
   node index.js

4. Abrir frontend/index.html con Live Server

¡Listo para funcionar!



/portafolio-docente
├── /backend
│   ├── /controllers                  # Controladores de lógica de negocio
│   │   ├── usuarios.controller.js             # R1–R6
│   │   ├── asignaturas.controller.js          # R7, R28
│   │   ├── documentos.controller.js           # R7–R12
│   │   ├── observaciones.controller.js        # R13–R14, R16
│   │   ├── notificaciones.controller.js       # R20
│   │   ├── cargaAcademica.controller.js       # R27–R30
│   │   └── portafolio.controller.js           # R21–R26, R31–R35
│
│   ├── /routes                       # Definición de rutas REST
│   │   ├── usuarios.js
│   │   ├── asignaturas.js
│   │   ├── documentos.js
│   │   ├── observaciones.js
│   │   ├── notificaciones.js
│   │   ├── cargaAcademica.js
│   │   └── portafolio.js
│
│   ├── /db
│   │   ├── conexion.js                         # Conexión MySQL
│   │   └── seed.sql                            # Script de inicialización (estructura_portafolio_base, roles, etc.)
│
│   ├── /modelos
│   │   ├── usuario.model.js                    # R1–R6
│   │   ├── asignatura.model.js                 # R7, R28
│   │   ├── documento.model.js                  # R7–R12
│   │   ├── observacion.model.js                # R13–R14, R16
│   │   ├── notificacion.model.js               # R20
│   │   ├── cargaAcademica.model.js             # R27–R30
│   │   └── portafolio.model.js                 # R21–R26, R31–R35
│
│   ├── /servicios
│   │   ├── authService.js                      # R2, R3
│   │   ├── reportService.js                    # R17–R19
│   │   └── excelService.js                     # R27–R30
│
│   ├── /middleware
│   │   └── authMiddleware.js                   # Middleware de autenticación y autorización
│
│   ├── /uploads                                # Archivos subidos por docentes
│   │   └── /2025-1
│           └── /Carlos_Ramon
│               └── IF611AIN/
│                   ├── Carátula/
│                   └── Silabo UNSAAC/
│
│   ├── app.js
│   ├── index.js                                # Punto de entrada del backend
│   └── package.json


│   ├── /js
│   │   ├── auth.js                             # R2–R3: Login / token
│   │   ├── usuarios.js                         # R1, R4–R6
│   │   ├── carga_excel.js                      # R27–R30
│   │   ├── dashboard.js                        # R17–R19
│   │   ├── explorador.js                       # R31–R35
│   │   ├── notificaciones.js                   # R20
│   │   ├── observaciones.js                    # R13–R16
│   │   ├── upload.js                           # R7–R12
│   │   ├── arbol_portafolio.js                 # R23–R24: árbol visual
│   │   ├── report.js                           # R18–R19
│   │   ├── review.js                           # Cambiar estados
│   │   ├── script.js                           # Extras generales
│   │   └── utils.js                            # Utilidades globales

│   ├── /views
│   │   ├── index.html
│   │   ├── login.html                          # R2
│   │   ├── dashboard.html                      # Panel general
│   │   ├── usuarios.html                       # Gestión usuarios
│   │   ├── docentes.html                       # Vista del docente
│   │   ├── observaciones.html                  # R13–R14
│   │   ├── reportes.html                       # R18–R19
│   │   ├── notificaciones.html                 # R20
│   │   ├── carga_excel.html                    # R27–R30
│   │   ├── explorador.html                     # Árbol portafolio – R31–R35
│   │   ├── review.html                         # Verificación de archivos
│   │   ├── upload.html                         # Subida de archivos
│   │   ├── recuperar.html                      # Recuperar contraseña (extra)
│   │   └── error.html
