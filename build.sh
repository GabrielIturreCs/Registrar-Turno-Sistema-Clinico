#!/bin/bash
# Build script para Render
echo "Building frontend..."
cd Registrar-Turno-Sistema-Clinico
npm install
npm run build:render
echo "Build completed!"
