@echo off
cd /d "%~dp0"
set "PATH=%PATH%;%APPDATA%\npm;C:\Program Files\nodejs"

title ENDEL-estudios Worker Setup

echo.
echo ============================================
echo    ENDEL-estudios - Setup Worker
echo ============================================
echo.

call wrangler whoami >nul 2>&1
if %errorLevel% neq 0 (
    echo Conectando Cloudflare...
    call wrangler login
)
echo OK - Cloudflare conectado

echo.
echo ============================================
echo PASO 1 - Creando base de datos D1
echo ============================================
call wrangler d1 create endel-estudios-db 2>nul
echo OK - Base de datos lista

echo.
echo IMPORTANTE: Copia el database_id que aparecio arriba
echo y pegalo en wrangler.toml donde dice REEMPLAZAR_CON_ID_DE_D1
echo.
echo Presiona cualquier tecla cuando lo hayas hecho...
pause >nul

echo.
echo ============================================
echo PASO 2 - Creando tablas en D1
echo ============================================
call wrangler d1 execute endel-estudios-db --file=schema.sql
echo OK - Tablas creadas

echo.
echo ============================================
echo PASO 3 - Creando bucket R2 para archivos
echo ============================================
call wrangler r2 bucket create endel-estudios-files 2>nul
echo OK - Bucket R2 listo

echo.
echo ============================================
echo PASO 4 - Desplegando Worker
echo ============================================
call wrangler deploy
echo OK - Worker desplegado

echo.
echo ============================================
echo    LISTO
echo ============================================
echo.
echo Copia la URL del Worker que aparecio arriba
echo y pegala en cliente.html y admin.html
echo donde dice: TU_SUBDOMINIO
echo.
echo Luego ejecuta actualizar.bat para subir los cambios.
echo.
pause
exit /b 0
