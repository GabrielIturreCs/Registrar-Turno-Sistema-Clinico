# Sistema de Gestión Odontológica

Sistema completo de gestión para consultorios odontológicos con frontend Angular y backend Node.js.

**Estado**: Desplegado en Render ✅

## Estructura del Proyecto

```
├── Backend-Develop/           # Backend Node.js con Express y MongoDB
├── Registrar-Turno-Sistema-Clinico/  # Frontend Angular
└── package.json              # Scripts de gestión del monorepo
```

## Despliegue

### Frontend (Render Static Site)
- Root Directory: `/`
- Build Command: `npm run build:frontend`
- Publish Directory: `Registrar-Turno-Sistema-Clinico/dist/odontologiafrontend/browser`

### Backend (Render Web Service)
- Root Directory: `Backend-Develop`
- Build Command: `npm install`
- Start Command: `npm start`

## Configuración de Producción

### Solución de Problemas de Build

Si el build falla por budgets excedidos, ya están configurados budgets aumentados en `angular.json`:
- Initial: 10MB max
- Component styles: 200kB max
- Bundle: 10MB max

### Variables de Entorno

El frontend usa `environment.prod.ts` en producción con las URLs del backend desplegado.

## Desarrollo Local

### Frontend
```bash
cd Registrar-Turno-Sistema-Clinico
npm install
npm start
```

### Backend
```bash
cd Backend-Develop
npm install
npm start
```
