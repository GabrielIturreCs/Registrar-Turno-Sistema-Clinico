## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** (incluido con Node.js)
- **Angular CLI** (se instalará automáticamente con las dependencias)

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd Registrar-Turno-Sistema-Clinico
```

### 2. Instalar dependencias
```bash
npm install
```

## 📦 Dependencias Principales

### 🎨 **Bootstrap y UI**
- **bootstrap**: `^5.3.7` - Framework CSS para el diseño responsive
- **bootstrap-icons**: `^1.13.1` - Iconos de Bootstrap

### 📊 **Gráficos y Visualización**
- **chart.js**: `^4.5.0` - Biblioteca para crear gráficos interactivos
- **ng2-charts**: `^5.0.4` - Integración de Chart.js con Angular

### 📄 **Generación de PDF**
- **jspdf**: `^3.0.1` - Biblioteca para generar archivos PDF
- **html2canvas**: `^1.4.1` - Convierte elementos HTML a canvas para incluir en PDF

### ⚡ **Angular Core**
- **@angular/core**: `^19.2.0` - Framework principal de Angular
- **@angular/common**: `^19.2.0` - Utilidades comunes de Angular
- **@angular/forms**: `^19.2.0` - Manejo de formularios
- **@angular/router**: `^19.2.0` - Enrutamiento de la aplicación
- **@angular/platform-browser**: `^19.2.0` - Plataforma del navegador
- **@angular/platform-server**: `^19.2.0` - Renderizado del lado del servidor
- **@angular/ssr**: `^19.2.11` - Server-Side Rendering

### 🛠️ **Utilidades**
- **rxjs**: `~7.8.0` - Programación reactiva
- **zone.js**: `~0.15.0` - Zonas de ejecución de Angular
- **express**: `^4.18.2` - Servidor web para SSR
- **tslib**: `^2.3.0` - Utilidades de TypeScript

## 🔧 Dependencias de Desarrollo

### 🏗️ **Herramientas de Build**
- **@angular-devkit/build-angular**: `^19.2.11` - Herramientas de construcción
- **@angular/cli**: `^19.2.11` - CLI de Angular
- **@angular/compiler-cli**: `^19.2.0` - Compilador de Angular

### 🧪 **Testing**
- **jasmine-core**: `~5.6.0` - Framework de testing
- **karma**: `~6.4.0` - Test runner
- **karma-chrome-launcher**: `~3.2.0` - Launcher de Chrome para Karma
- **karma-coverage**: `~2.2.0` - Cobertura de código
- **karma-jasmine**: `~5.1.0` - Integración Jasmine-Karma
- **karma-jasmine-html-reporter**: `~2.1.0` - Reporter HTML

### 📝 **Tipos TypeScript**
- **@types/express**: `^4.17.17` - Tipos para Express
- **@types/html2canvas**: `^0.5.35` - Tipos para html2canvas
- **@types/jasmine**: `~5.1.0` - Tipos para Jasmine
- **@types/jspdf**: `^1.3.3` - Tipos para jsPDF
- **@types/node**: `^18.18.0` - Tipos para Node.js
- **typescript**: `~5.7.2` - Compilador de TypeScript

# Comandos Rápidos para Instalar y Solucionar Errores de Dependencias

## 1. Instalar dependencias generales
```bash
npm install
```

## 2. Instalar dependencias específicas si ves errores como "Cannot find module 'ng2-charts'", 'jspdf' o 'html2canvas'
```bash
npm install ng2-charts chart.js
npm install jspdf
npm install html2canvas
```

## 3. Instalar los tipos para TypeScript si aparecen errores de type declarations
```bash
npm install --save-dev @types/jspdf @types/html2canvas
```
> **Nota:** ng2-charts y chart.js no requieren tipos adicionales, pero si ves errores, intenta:
```bash
npm install --save-dev @types/chart.js
```

## 4. Iniciar el servidor de desarrollo
```bash
npm start
# o
ng serve
```

## 5. Si tienes errores de dependencias o módulos no encontrados:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

