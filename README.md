# 🏥 SISTEMA DE GESTIÓN DE TURNOS - CLÍNICA DENTAL
# 🎯 GRUPO 10 - UNIVERSIDAD NACIONAL DE JUJUY
# 📅 AÑO: 2025

================================================================================
📋 INFORMACIÓN DEL PROYECTO
================================================================================

🎯 PROYECTO: Sistema de Gestión de Turnos para Clínica Dental
🏢 INSTITUCIÓN: Universidad Nacional de Jujuy
📅 AÑO: 2025
👥 GRUPO: 10
🛠️ STACK: Angular 19 + Node.js + MongoDB

================================================================================
🌐 URL DE LA APLICACIÓN DEPLOYADA
================================================================================

   https://registrar-turno-sistema-clinico.onrender.com

================================================================================
📚 REPOSITORIOS ACTUALIZADOS
================================================================================

🔗 REPOSITORIO FRONTEND (Angular):
   https://github.com/GabrielIturreCs/Registrar-Turno-Sistema-Clinico

🔗 REPOSITORIO BACKEND (Node.js):
   https://github.com/GabrielIturreCs/Registro-de-turno-Sistema-Odontologico-Backend

================================================================================
📦 GUÍA DE INSTALACIÓN COMPLETA
================================================================================

🎯 OBJETIVO: Instalación reproducible en cualquier escenario
⏱️ TIEMPO ESTIMADO: 15-20 minutos
🖥️ SISTEMAS COMPATIBLES: Windows, macOS, Linux

-------------------------------------------------------------------------------
📋 PRERREQUISITOS DEL SISTEMA
-------------------------------------------------------------------------------

✅ Node.js: Versión 18.0.0 o superior
   - Descargar desde: https://nodejs.org/
   - Verificar: node --version

✅ npm: Versión 9.0.0 o superior (incluido con Node.js)
   - Verificar: npm --version

✅ Git: Para clonar repositorios
   - Descargar desde: https://git-scm.com/
   - Verificar: git --version

✅ MongoDB: Base de datos (local o Atlas)
   - Local: https://www.mongodb.com/try/download/community
   - Atlas (Recomendado): https://www.mongodb.com/atlas

✅ Editor de Código: VS Code recomendado
   - Descargar desde: https://code.visualstudio.com/

-------------------------------------------------------------------------------
🚀 INSTALACIÓN PASO A PASO
-------------------------------------------------------------------------------

📁 PASO 1: CLONAR REPOSITORIOS
# Crear directorio del proyecto
mkdir sistema-turnos-dental
cd sistema-turnos-dental

# Clonar repositorios por separado
git clone https://github.com/GabrielIturreCs/Registrar-Turno-Sistema-Clinico
git clone https://github.com/GabrielIturreCs/Registro-de-turno-Sistema-Odontologico-Backend


📁 PASO 2: CONFIGURAR BACKEND
# Navegar al directorio backend
cd Registro-de-turno-Sistema-Odontologico-Backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Verificar instalación
npm start


📁 PASO 3: CONFIGURAR FRONTEND
# Navegar al directorio frontend
cd ../Registrar-Turno-Sistema-Clinico

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp src/environments/environment.example.ts src/environments/environment.ts
# Editar environment.ts con tus credenciales

# Verificar instalación
npm start


-------------------------------------------------------------------------------
🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO
-------------------------------------------------------------------------------

📄 BACKEND (.env)
# Configuración del servidor
NODE_ENV=development
PORT=3000
SERVER_URL=http://localhost:3000

# Base de datos MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/dental-clinic

# JWT Secret
JWT_SECRET=tu-jwt-secret-super-seguro

# Google OAuth
GOOGLE_CLIENT_ID=google-client-id
GOOGLE_CLIENT_SECRET=google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-auth/callback

# MercadoPago
ACCESS_TOKEN=mercadopago-access-token

# Frontend URL
FRONTEND_URL=http://localhost:4200

# Cookie Secret
COOKIE_SECRET=tu-cookie-secret

📄 FRONTEND (environment.ts)
typescript:
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleClientId: 'tu-google-client-id',
  mercadopagoPublicKey: 'tu-mercadopago-public-key'
};

-------------------------------------------------------------------------------
🗄️ CONFIGURACIÓN DE BASE DE DATOS
-------------------------------------------------------------------------------

📊 OPCIÓN 1: MONGODB ATLAS (RECOMENDADO)
1. Crear cuenta en https://www.mongodb.com/atlas
2. Crear nuevo cluster (gratuito)
3. Configurar IP whitelist (0.0.0.0/0 para desarrollo)
4. Crear usuario de base de datos
5. Obtener connection string
6. Reemplazar en MONGODB_URI

📊 OPCIÓN 2: MONGODB LOCAL
1. Instalar MongoDB Community Edition
2. Iniciar servicio MongoDB
3. Usar URI: mongodb://localhost:27017/dental-clinic

-------------------------------------------------------------------------------
🔐 CONFIGURACIÓN DE AUTENTICACIÓN
-------------------------------------------------------------------------------

🌐 GOOGLE OAUTH 2.0
1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto
3. Habilitar Google+ API
4. Configurar OAuth 2.0 credentials
5. Agregar URIs autorizados:
   - http://localhost:4200
   - http://localhost:3000/api/google-auth/callback
6. Copiar Client ID y Client Secret

💳 MERCADOPAGO
1. Crear cuenta en https://www.mercadopago.com/
2. Ir a Panel de Desarrolladores
3. Obtener Access Token
4. Obtener Public Key
5. Configurar webhooks

-------------------------------------------------------------------------------
🎮 COMANDOS DE EJECUCIÓN
-------------------------------------------------------------------------------

🚀 DESARROLLO
# Backend (Terminal 1)
cd Registro-de-turno-Sistema-Odontologico-Backend
npm start
# Servidor en: http://localhost:3000

# Frontend (Terminal 2)
cd Registrar-Turno-Sistema-Clinico
npm start
# Aplicación en: http://localhost:4200

🏗️ PRODUCCIÓN
# Backend
cd Registro-de-turno-Sistema-Odontologico-Backend
npm run build
npm start

# Frontend
cd Registrar-Turno-Sistema-Clinico
npm run build
npm run serve:prod

-------------------------------------------------------------------------------
📱 FUNCIONALIDADES PRINCIPALES
-------------------------------------------------------------------------------

✅ AUTENTICACIÓN
- Login con Google OAuth 2.0
- Registro de usuarios
- JWT tokens seguros
- Roles: Paciente, Dentista, Administrador

✅ GESTIÓN DE TURNOS
- Reserva de turnos
- Reprogramación
- Cancelación
- Historial de turnos

✅ PAGOS ELECTRÓNICOS
- Integración MercadoPago
- Procesamiento seguro
- Notificaciones automáticas
- Estados de pago

✅ DASHBOARD ADMIN
- Estadísticas en tiempo real
- Gestión de usuarios
- Reportes PDF
- Métricas de negocio

✅ CHATBOT INTELIGENTE
- Atención automática
- Respuestas contextuales
- Integración con sistema

-------------------------------------------------------------------------------
🔧 ALMACENAMIENTOS UTILIZADOS
-------------------------------------------------------------------------------

🗄️ BASE DE DATOS PRINCIPAL
- Tecnología: MongoDB 6.17.0
- ODM: Mongoose 8.16.0
- Hosting: MongoDB Atlas (Cloud)
- Backup: Automático diario

📁 ALMACENAMIENTO DE ARCHIVOS
- PDFs: Generación en memoria
- Imágenes: URLs externas (Google OAuth)
- Logs: Sistema de archivos local

🍪 ALMACENAMIENTO DE SESIÓN
- JWT Tokens: LocalStorage
- Cookies: HttpOnly para seguridad
- Estado: RxJS BehaviorSubject

📱 ALMACENAMIENTO LOCAL
- Configuración: environment.ts
- Cache: Angular HttpClient
- Preferencias: LocalStorage

-------------------------------------------------------------------------------
🚀 DEPLOY EN RENDER.COM
-------------------------------------------------------------------------------

📦 FRONTEND DEPLOY
1. Conectar repositorio GitHub a Render
2. Configurar:
   - Build Command: npm install && npm run build
   - Start Command: npm run serve:prod
   - Environment: Node.js 18
3. Variables de entorno:
   - NODE_ENV=production
   - API_URL=https://backend-url.onrender.com

📦 BACKEND DEPLOY
1. Conectar repositorio GitHub a Render
2. Configurar:
   - Build Command: npm install
   - Start Command: npm start
   - Environment: Node.js 18
3. Variables de entorno:
   - Todas las variables del .env

-------------------------------------------------------------------------------
📁 DOCUMENTACIÓN DE SWAGGER
-------------------------------------------------------------------------------
🌐 Acceso a la documentación interactiva
Local: http://localhost:3000/api-docs

📄 Exportar la documentación (OpenAPI/Swagger)

Ingresa a la URL de Swagger UI (ver arriba).

En la parte superior derecha, haz clic en el botón o enlace que dice "Raw", "OpenAPI" o "swagger.json".

Se abrirá el archivo JSON con toda la especificación de la API.

📝 ¿Qué incluye la documentación?

Listado de todos los endpoints (GET, POST, PUT, DELETE)

Parámetros requeridos y opcionales

Ejemplos de request y response

Descripción de cada recurso y operación

Pruebas interactivas desde el navegador

-------------------------------------------------------------------------------
🆘 SOLUCIÓN DE PROBLEMAS COMUNES
-------------------------------------------------------------------------------

❌ ERROR: Puerto 3000 ocupado
# Cambiar puerto en .env
PORT=3001
# O matar proceso
lsof -ti:3000 | xargs kill -9

❌ ERROR: MongoDB no conecta
# Verificar URI en .env
# Verificar IP whitelist en Atlas
# Verificar credenciales

❌ ERROR: Google OAuth no funciona
# Verificar URIs autorizados
# Verificar Client ID/Secret
# Verificar dominios autorizados

❌ ERROR: MercadoPago no procesa
# Verificar Access Token
# Verificar Public Key
# Verificar webhooks

-------------------------------------------------------------------------------
📞 SOPORTE Y CONTACTO
-------------------------------------------------------------------------------

👥 GRUPO 10 - UNIVERSIDAD NACIONAL DE JUJUY
- Proyecto: Sistema de Gestión de Turnos Dental
- Año: 2025
- Materia: Programación y Servicios Web
- Profesor: Alfredo Espinoza

📧 CONTACTO
- Email: 42856744@fi.unju.edu.ar
- GitHub: https://github.com/ezequielmamani7/
- Documentación: README.md en cada repositorio

-------------------------------------------------------------------------------
📄 LICENCIA
-------------------------------------------------------------------------------

📜 LICENCIA MIT
- Uso libre para fines educativos
- Atribución requerida
- Sin garantías

================================================================================
🎉 ¡INSTALACIÓN COMPLETADA!
================================================================================

✅ La aplicación está lista para usar
🌐 Frontend: http://localhost:4200
🔧 Backend: http://localhost:3000
📊 API Docs: http://localhost:3000/api

🌟 ¡Desarrollado con ❤️ por el Grupo 10! 🌟 

