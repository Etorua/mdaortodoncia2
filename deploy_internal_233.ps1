# Script de despliegue para Servidor Interno (192.168.0.233)
# Basado en la logica de AWS pero adaptado a Rutas Personalizadas

$ServerIP = "192.168.0.233"
$User = "usuario"
# Nota: La contraseña se pedirá por consola o debe configurarse llave SSH previamente.

Write-Host "Iniciando despliegue a $ServerIP..." -ForegroundColor Cyan

# Comandos a ejecutar remotamente
$RemoteScript = @'
    set -e # Detener si hay error

    # 1. Definir Rutas
    REPO_DIR="/home/usuario/sistema-mantenimiento-deploy"
    BACKEND_DEST="/var/www/api.solicitudservicio"
    FRONTEND_DEST="/var/www/app.solicitudservicio"

    echo "--- [1/5] Actualizando Repositorio ---"
    # Crear directorio de trabajo si no existe
    if [ ! -d "$REPO_DIR" ]; then
        git clone https://github.com/toruacampaerickfrancisco-a11y/sistema-matenimiento.git "$REPO_DIR"
    fi
    
    cd "$REPO_DIR"
    git fetch --all
    git reset --hard origin/main

    echo "--- [2/5] Construyendo Frontend ---"
    cd frontend
    npm install
    # Configurar BASE_PATH para que coincida con la ruta /soporte/ de Nginx
    export VITE_BASE_PATH="/soporte/"
    export VITE_API_URL="/soporteback/api"
    npm run build
    cd ..

    echo "--- [3/5] Desplegando Frontend ---"
    # Limpiar destino frontend y copiar build
    echo "Copiando a $FRONTEND_DEST..."
    # Se requiere sudo para escribir en /var/www normalmente
    echo "Password1" | sudo -S mkdir -p "$FRONTEND_DEST"
    echo "Password1" | sudo -S rm -rf "$FRONTEND_DEST"/*
    echo "Password1" | sudo -S cp -r frontend/dist/* "$FRONTEND_DEST/"

    echo "--- [4/5] Desplegando Backend ---"
    echo "Copiando a $BACKEND_DEST..."
    
    # Preparamos carpeta destino
    echo "Password1" | sudo -S mkdir -p "$BACKEND_DEST"
    
    # Copiamos archivos del backend (excluyendo node_modules para velocidad, luego instalamos)
    # Usamos rsync si existe, sino cp
    echo "Password1" | sudo -S cp -r backend/* "$BACKEND_DEST/"
    # [FIX] Copiar explícitamente archivos ocultos necesarios (.sequelizerc)
    echo "Password1" | sudo -S cp backend/.sequelizerc "$BACKEND_DEST/"
    
    # [FIX] Eliminar archivo de configuración antiguo que causa conflictos con Sequelize CLI
    echo "Password1" | sudo -S rm -f "$BACKEND_DEST/config/config.js"
    # [FIX] Eliminar migración duplicada .js antigua
    echo "Password1" | sudo -S rm -f "$BACKEND_DEST/src/migrations/20251219194529-change-ticket-arrays-to-text.js"
    
    # Copiar archivo .env si es necesario o configurarlo
    # echo "Password1" | sudo -S cp backend/.env "$BACKEND_DEST/.env"

    cd "$BACKEND_DEST"
    echo "Instalando dependencias en Backend..."
    echo "Password1" | sudo -S npm install --omit=dev

    echo "--- [DB] Ejecutando Migraciones ---"
    echo "Password1" | sudo -S npx sequelize-cli db:migrate

    echo "--- [5/5] Reiniciando Servicios ---"
    # Asegurar puerto libre
    echo "Password1" | sudo -S kill -9 $(sudo lsof -t -i:3002) 2> /dev/null || true
    
    # Asumimos que PM2 corre globalmente o bajo el usuario root/usuario
    # Si PM2 corre como root:
    echo "Password1" | sudo -S pm2 delete sistema-erp 2> /dev/null || true
    echo "Password1" | sudo -S pm2 start src/app.js --name 'sistema-erp' --cwd "$BACKEND_DEST" --update-env
    echo "Password1" | sudo -S pm2 save
    
    echo "--- DESPLIEGUE COMPLETADO ---"
'@

# Limpiar CR (Carriage Returns) para evitar errores en Linux
$RemoteScript = $RemoteScript.Replace("`r", "")

# Ejecutamos ssh y pasamos el script
# Usamos la llave SSH detectada para conectar sin password
$KeyFile = "id_rsa_erp_auto"
ssh -i $KeyFile -o StrictHostKeyChecking=no $User@$ServerIP "$RemoteScript"
