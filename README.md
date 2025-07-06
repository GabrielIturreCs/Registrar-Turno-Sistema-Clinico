# 🏥 Sistema de Gestión de Turnos - Clínica Dental

## 🎯 **GRUPO 10 - Frontend Angular**

[![Angular](https://img.shields.io/badge/Angular-19.2.0-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.7-purple.svg)](https://getbootstrap.com/)

> **Sistema integral de gestión de turnos para clínicas dentales** desarrollado con Angular 19, integrando autenticación con Google OAuth, pagos con MercadoPago, y un dashboard administrativo completo.

---

## 📋 **Tabla de Contenidos**

- [🚀 Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [📦 Instalación](#-instalación)
- [🔧 Configuración](#-configuración)
- [🎮 Uso](#-uso)
- [🏗️ Arquitectura](#️-arquitectura)
- [🔌 APIs Integradas](#-apis-integradas)
- [🔒 Seguridad](#-seguridad)
- [📱 Responsive Design](#-responsive-design)
- [🧪 Testing](#-testing)
- [📦 Build y Deploy](#-build-y-deploy)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)
- [👥 Equipo](#-equipo)

---

## 🚀 **Características**

### ✨ **Funcionalidades Principales**
- 🔐 **Autenticación Multi-rol**: Pacientes, Dentistas, Administradores
- 🌐 **Login con Google OAuth 2.0**: Autenticación social segura
- 📅 **Gestión de Turnos**: Reserva, reprogramación y cancelación
- 💳 **Pagos Electrónicos**: Integración completa con MercadoPago
- 📊 **Dashboard Administrativo**: Métricas en tiempo real
- 🤖 **Chatbot Inteligente**: Atención automática al cliente
- 📈 **Estadísticas Avanzadas**: Gráficos y reportes
- 📄 **Exportación PDF**: Reportes descargables
- 🔔 **Sistema de Notificaciones**: Alertas en tiempo real
- 📱 **Diseño Responsive**: Compatible con todos los dispositivos

### 🎨 **Interfaz de Usuario**
- **Bootstrap 5.3.7**: Framework CSS moderno y responsive
- **Bootstrap Icons**: Iconografía consistente
- **Chart.js**: Gráficos interactivos y dinámicos
- **Angular Material**: Componentes Material Design
- **Temas Personalizados**: Colores y estilos de la clínica

---

## 🛠️ **Tecnologías**

### **Frontend Core**
```json
{
  "framework": "Angular 19.2.0",
  "lenguaje": "TypeScript 5.7.2",
  "ui_framework": "Bootstrap 5.3.7",
  "iconos": "Bootstrap Icons 1.13.1",
  "graficos": "Chart.js 4.5.0 + ng2-charts 5.0.4",
  "pdf": "jsPDF 3.0.1 + html2canvas 1.4.1",
  "estado": "RxJS 7.8.0",
  "ssr": "Angular SSR 19.2.11"
}
```

### **Dependencias Principales**
- **@angular/core**: Framework principal
- **@angular/router**: Enrutamiento de la aplicación
- **@angular/forms**: Manejo de formularios reactivos
- **@angular/common**: Utilidades comunes
- **rxjs**: Programación reactiva
- **zone.js**: Zonas de ejecución

### **Herramientas de Desarrollo**
- **@angular/cli**: CLI de Angular
- **@angular-devkit/build-angular**: Herramientas de build
- **typescript**: Compilador TypeScript
- **karma + jasmine**: Framework de testing

---

## 📦 **Instalación**

### **Prerrequisitos**
```bash
# Node.js (versión 18 o superior)
node --version  # v18.x.x o superior

# npm (incluido con Node.js)
npm --version   # 9.x.x o superior

# Angular CLI (se instalará automáticamente)
ng version      # Angular CLI
```

### **Clonar el Repositorio**
```bash
# Clonar el repositorio
git clone https://github.com/grupo10/sistema-turnos-dental.git

# Navegar al directorio frontend
cd Registrar-Turno-Sistema-Clinico
```

### **Instalar Dependencias**
```bash
# Instalar todas las dependencias
npm install

# Verificar instalación
ng version
```

---

## 🔧 **Configuración**

### **Variables de Entorno**
Crear archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleClientId: 'tu-google-client-id',
  mercadopagoPublicKey: 'tu-mercadopago-public-key'
};
```

### **Configuración de Google OAuth**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto y habilitar Google+ API
3. Configurar OAuth 2.0 credentials
4. Agregar dominios autorizados

### **Configuración de MercadoPago**
1. Crear cuenta en [MercadoPago](https://www.mercadopago.com/)
2. Obtener Access Token y Public Key
3. Configurar webhooks para notificaciones

---

## 🎮 **Uso**

### **Servidor de Desarrollo**
```bash
# Iniciar servidor de desarrollo
npm start
# o
ng serve

# Servidor disponible en: http://localhost:4200
```

### **Build de Producción**
```bash
# Build optimizado para producción
npm run build

# Build con SSR (Server-Side Rendering)
npm run build:render
```

### **Testing**
```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests e2e
npm run e2e
```

---

## 🏗️ **Arquitectura**

### **Estructura del Proyecto**
```
src/
├── app/
│   ├── components/           # Componentes de la aplicación
│   │   ├── administrador/    # Panel de administración
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── login/           # Autenticación
│   │   ├── reservar/        # Reserva de turnos
│   │   ├── estadistica/     # Reportes y estadísticas
│   │   └── layouts/         # Componentes de layout
│   ├── services/            # Servicios de la aplicación
│   │   ├── auth.service.ts          # Autenticación
│   │   ├── mercadopago.service.ts   # Integración MercadoPago
│   │   ├── turno.service.ts         # Gestión de turnos
│   │   └── ChatBot.service.ts       # Chatbot inteligente
│   ├── guards/              # Guards de autenticación
│   ├── interceptors/        # Interceptores HTTP
│   ├── interfaces/          # Interfaces TypeScript
│   └── environments/        # Configuración de entornos
├── public/                  # Archivos públicos
└── styles.css              # Estilos globales
```

### **Patrones de Diseño**
- **Component-Based Architecture**: Componentes reutilizables
- **Service Layer Pattern**: Lógica de negocio en servicios
- **Observer Pattern**: RxJS para programación reactiva
- **Dependency Injection**: Inyección de dependencias de Angular
- **Guard Pattern**: Protección de rutas

---

## 🔌 **APIs Integradas**

### **Google OAuth 2.0**
```typescript
// Configuración del cliente OAuth
google.accounts.id.initialize({
  client_id: environment.googleClientId,
  callback: (response) => {
    // Procesar credencial de Google
  }
});
```

### **MercadoPago API**
```typescript
// Crear preferencia de pago
this.mercadoPagoService.createTurnoPayment(
  turnoId, 
  pacienteEmail, 
  monto, 
  descripcion
).subscribe(response => {
  // Redirigir al pago
});
```

### **APIs Internas**
- **Autenticación**: `/api/usuario/login`
- **Turnos**: `/api/turno/*`
- **Pacientes**: `/api/paciente/*`
- **Dentistas**: `/api/dentista/*`
- **Tratamientos**: `/api/tratamiento/*`

---

## 🔒 **Seguridad**

### **Autenticación JWT**
```typescript
// Interceptor de autenticación
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');
    if (token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(request);
  }
}
```

### **Guards de Protección**
```typescript
// Guard de autenticación
export function authGuard(role: string): CanActivateFn {
  return (route, state) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('rol');
    
    if (!token || userRole !== role) {
      return false;
    }
    return true;
  };
}
```

### **Validación de Datos**
- **Formularios Reactivos**: Validación en tiempo real
- **Sanitización**: Prevención de XSS
- **TypeScript**: Tipado estático
- **CORS**: Configuración segura

---

## 📱 **Responsive Design**


### **Componentes Responsive**
- **Navbar**: Colapsable en móviles
- **Dashboard**: Grid adaptativo
- **Formularios**: Layout flexible
- **Tablas**: Scroll horizontal en móviles
- **Gráficos**: Responsive con Chart.js

---

## 🧪 **Testing**

### **Tests Unitarios**
```bash
# Ejecutar todos los tests
npm test

# Tests con watch mode
npm run test:watch

# Tests con coverage
npm run test:coverage
```

### **Tests E2E**
```bash
# Ejecutar tests e2e
npm run e2e

# Tests e2e con watch mode
npm run e2e:watch
```

### **Cobertura de Código**
- **Objetivo**: >80% de cobertura
- **Frameworks**: Jasmine + Karma
- **E2E**: Protractor
- **Mocking**: Angular Testing Utilities

---

## 📦 **Build y Deploy**

### **Build de Desarrollo**
```bash
# Build de desarrollo
ng build

# Build con watch mode
ng build --watch
```

### **Build de Producción**
```bash
# Build optimizado
npm run build

# Build con SSR
npm run build:render

# Build para Render.com
npm run build:render
```

### **Deploy en Render.com**
```bash
# Configuración automática
# El repositorio se conecta automáticamente a Render.com
# Build Command: npm run build:render
# Publish Directory: dist/odontologiafrontend
```

### **Variables de Entorno en Producción**
```bash
# Render.com Environment Variables
NODE_ENV=production
API_URL=https://backend-url.onrender.com/api
GOOGLE_CLIENT_ID=google-client-id
MERCADOPAGO_PUBLIC_KEY=mercadopago-public-key
```

---

## 🤝 **Contribución**

### **Flujo de Trabajo**
1. **Fork** el repositorio
2. **Clone** fork localmente
3. **Crea** una rama para feature
4. **Desarrolla**  funcionalidad
5. **Tests** - Asegúrate de que pasen todos los tests
6. **Commit** con mensajes descriptivos
7. **Push** a tu fork
8. **Pull Request** al repositorio principal

### **Estándares de Código**
```bash
# Linting
npm run lint

# Formateo de código
npm run format

# Verificación de tipos
npm run type-check
```

### **Convenciones de Naming**
- **Componentes**: `kebab-case.component.ts`
- **Servicios**: `kebab-case.service.ts`
- **Interfaces**: `kebab-case.interface.ts`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Variables**: `camelCase`

---



## 👥 **Equipo**

### **Grupo 10 - Desarrollo Frontend**

**🎯 Proyecto**: Sistema de Gestión de Turnos para Clínica Dental  
**🏢 Institución**: Universidad nacional de jujuy
**📅 Año**: 2025  
**🛠️ Stack**: Angular 19 + TypeScript + Bootstrap  

### **Características del Equipo**
- **Metodología Ágil**: Scrum/Kanban
- **Control de Versiones**: Git + GitHub
- **CI/CD**: Render.com automático
- **Testing**: Cobertura completa
- **Documentación**: README detallado

---

## 🎉 **¡Gracias por usar nuestro sistema!**

Este proyecto representa el esfuerzo y dedicación del **Grupo 10** para crear una solución integral y moderna para la gestión de turnos en clínicas dentales. Esperamos que sea de gran utilidad para mejorar la experiencia tanto de los profesionales como de los pacientes.

🌟 ¡Desarrollado por el Grupo 10! 🌟

