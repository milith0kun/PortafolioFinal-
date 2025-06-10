# ==========================================
# 🚀 START.SH - Script de inicio rápido
# ==========================================

#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 ========================================"
echo "   SISTEMA PORTAFOLIO DOCENTE UNSAAC"
echo "========================================"
echo -e "${NC}"

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo "Por favor ejecuta primero: ./install.sh"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
    npm install
fi

# Verificar puerto
PORT=${PORT:-3000}
if check_port $PORT; then
    echo -e "${YELLOW}⚠️  Puerto $PORT está en uso${NC}"
    echo "¿Deseas continuar de todas formas? (s/n)"
    read -r CONTINUE
    if [[ ! $CONTINUE =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Menú de opciones
echo "Selecciona el modo de inicio:"
echo "1) 🔧 Desarrollo (con nodemon)"
echo "2) 🚀 Producción" 
echo "3) 🧪 Testing"
echo "4) 📊 Solo verificar configuración"
echo ""
read -p "Opción (1-4): " OPTION

case $OPTION in
    1)
        echo -e "${GREEN}🔧 Iniciando en modo desarrollo...${NC}"
        npm run dev
        ;;
    2)
        echo -e "${GREEN}🚀 Iniciando en modo producción...${NC}"
        NODE_ENV=production npm start
        ;;
    3)
        echo -e "${GREEN}🧪 Ejecutando tests...${NC}"
        npm test
        ;;
    4)
        echo -e "${GREEN}📊 Verificando configuración...${NC}"
        node -e "
        require('dotenv').config();
        console.log('✅ Variables de entorno cargadas');
        console.log('📊 Configuración:');
        console.log('   - NODE_ENV:', process.env.NODE_ENV || 'development');
        console.log('   - PORT:', process.env.PORT || 3000);
        console.log('   - DB_HOST:', process.env.DB_HOST || 'localhost');
        console.log('   - DB_NAME:', process.env.DB_NAME || 'portafolios_docentes');
        console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado');
        "
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

# ==========================================
# 📋 MAKEFILE - Comandos simplificados
# ==========================================

# Makefile para Sistema Portafolio Docente UNSAAC

.PHONY: help install start dev test clean backup migrate seed logs

# Variables
NODE_ENV ?= development
PORT ?= 3000

# Ayuda por defecto
help:
	@echo "🚀 Sistema Portafolio Docente UNSAAC"
	@echo "========================================"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make install    - Instalar dependencias y configurar"
	@echo "  make start      - Iniciar servidor en producción"
	@echo "  make dev        - Iniciar servidor en desarrollo"
	@echo "  make test       - Ejecutar tests"
	@echo "  make migrate    - Ejecutar migraciones de BD"
	@echo "  make seed       - Insertar datos de prueba"
	@echo "  make backup     - Hacer backup de base de datos"
	@echo "  make clean      - Limpiar archivos temporales y logs"
	@echo "  make logs       - Ver logs en tiempo real"
	@echo "  make check      - Verificar estado del sistema"
	@echo ""

# Instalación completa
install:
	@echo "📦 Instalando dependencias..."
	npm install
	@echo "📁 Creando directorios..."
	mkdir -p subidas/{documentos,excel,temp}
	mkdir -p logs/{aplicacion,errores,acceso,auditoria}
	mkdir -p plantillas/{email,pdf,excel}
	@echo "✅ Instalación completada"

# Iniciar en producción
start:
	@echo "🚀 Iniciando servidor en producción..."
	NODE_ENV=production npm start

# Iniciar en desarrollo
dev:
	@echo "🔧 Iniciando servidor en desarrollo..."
	npm run dev

# Ejecutar tests
test:
	@echo "🧪 Ejecutando tests..."
	npm test

# Ejecutar migraciones
migrate:
	@echo "🗄️ Ejecutando migraciones..."
	npm run migrate

# Insertar datos de prueba
seed:
	@echo "🌱 Insertando datos de prueba..."
	npm run seed

# Backup de base de datos
backup:
	@echo "💾 Creando backup de base de datos..."
	@mkdir -p backups
	@mysqldump -u root -p portafolios_docentes > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup creado en backups/"

# Limpiar archivos temporales
clean:
	@echo "🧹 Limpiando archivos temporales..."
	rm -rf logs/*
	rm -rf subidas/temp/*
	rm -rf node_modules/.cache
	@echo "✅ Limpieza completada"

# Ver logs en tiempo real
logs:
	@echo "📊 Mostrando logs en tiempo real..."
	tail -f logs/aplicacion/*.log

# Verificar estado del sistema
check:
	@echo "🔍 Verificando estado del sistema..."
	@echo "📊 Node.js version: $(shell node --version)"
	@echo "📦 NPM version: $(shell npm --version)"
	@echo "🗄️ MySQL status: $(shell systemctl is-active mysql 2>/dev/null || echo 'No disponible')"
	@echo "📁 Espacio en disco:"
	@df -h . | tail -1
	@echo "💾 Memoria disponible:"
	@free -h | grep Mem
	@echo "🌐 Puerto $(PORT): $(shell lsof -Pi :$(PORT) -sTCP:LISTEN -t >/dev/null && echo 'En uso' || echo 'Disponible')"

# Reiniciar servicios
restart:
	@echo "🔄 Reiniciando servicios..."
	@pkill -f "node servidor.js" || true
	@sleep 2
	make start

# Instalar y configurar todo desde cero
setup: install migrate seed
	@echo "✅ Configuración inicial completada"
	@echo "🚀 Para iniciar el sistema ejecuta: make dev"

# Comando de desarrollo completo con verificaciones
full-dev:
	@echo "🔧 Iniciando desarrollo con verificaciones completas..."
	make check
	@echo "🔍 Verificando configuración..."
	@test -f .env || (echo "❌ Archivo .env no encontrado" && exit 1)
	@echo "🚀 Iniciando servidor..."
	make dev

# ==========================================
# 📜 DOCKER COMPOSE (docker-compose.yml)
# ==========================================

version: '3.8'

services:
  # Aplicación Node.js
  app:
    build: .
    container_name: portafolio_docente_app
    restart: unless-stopped
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=portafolios_docentes
      - DB_USER=root
      - DB_PASSWORD=rootpassword
    depends_on:
      - mysql
    volumes:
      - ./subidas:/app/subidas
      - ./logs:/app/logs
      - ./plantillas:/app/plantillas
    networks:
      - portafolio_network

  # Base de datos MySQL
  mysql:
    image: mysql:8.0
    container_name: portafolio_docente_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: portafolios_docentes
      MYSQL_CHARACTER_SET_SERVER: utf8mb4
      MYSQL_COLLATION_SERVER: utf8mb4_unicode_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./base_datos/migraciones:/docker-entrypoint-initdb.d
    networks:
      - portafolio_network

  # PHPMyAdmin (opcional, para desarrollo)
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: portafolio_docente_phpmyadmin
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: rootpassword
    depends_on:
      - mysql
    networks:
      - portafolio_network

volumes:
  mysql_data:

networks:
  portafolio_network:
    driver: bridge

# ==========================================
# 📦 DOCKERFILE
# ==========================================

FROM node:18-alpine

# Información del contenedor
LABEL maintainer="Universidad Nacional de San Antonio Abad del Cusco"
LABEL version="1.0.0"
LABEL description="Sistema de Portafolio Docente UNSAAC"

# Crear directorio de trabajo
WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p subidas/{documentos,excel,temp} \
    logs/{aplicacion,errores,acceso,auditoria} \
    plantillas/{email,pdf,excel}

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["npm", "start"]

# ==========================================
# 📋 .dockerignore
# ==========================================

node_modules
npm-debug.log
logs
subidas
*.log
.git
.env
coverage
docs
.nyc_output
README.md
Dockerfile
docker-compose.yml
.dockerignore