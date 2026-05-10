@echo off
cd /d "%~dp0"
setlocal enabledelayedexpansion

set PROJECT_NAME=endel-estudios
set BRANCH=main

title ENDEL-estudios Actualizador

echo.
echo ============================================
echo    ENDEL-estudios - Actualizador
echo ============================================
echo Carpeta detectada: %~dp0
echo.

if not exist "%~dp0index.html" (
    echo ERROR: No se encontro index.html aqui.
    echo Asegurate de abrir la carpeta correcta en VS Code.
    pause
    exit /b 1
)

git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Git no instalado. Ejecuta instalar.bat primero.
    pause
    exit /b 1
)
gh --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: GitHub CLI no instalado. Ejecuta instalar.bat primero.
    pause
    exit /b 1
)
wrangler --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Wrangler no instalado. Ejecuta instalar.bat primero.
    pause
    exit /b 1
)
echo OK - Dependencias listas

echo.
echo Verificando sesion GitHub...
gh auth status >nul 2>&1
if %errorLevel% neq 0 (
    echo Reconectando GitHub...
    gh auth login --web --git-protocol https
)
echo OK - GitHub conectado

echo.
echo Verificando sesion Cloudflare...
wrangler whoami >nul 2>&1
if %errorLevel% neq 0 (
    echo Reconectando Cloudflare...
    wrangler login
)
echo OK - Cloudflare conectado

echo.
echo ============================================
echo    Detectando cambios
echo ============================================
git add -A >nul 2>&1

git diff --cached --quiet >nul 2>&1
if %errorLevel% equ 0 (
    echo No hay cambios nuevos en el proyecto.
    echo.
    set /p FORCE=Forzar redeploy de todas formas? (s/N): 
    if /i "!FORCE!" neq "s" (
        echo Cancelado.
        pause
        exit /b 0
    )
    set MSG=Redeploy forzado
    goto :deploy
)

echo Archivos modificados:
git diff --cached --name-only

echo.
echo ============================================
echo    Guardando y subiendo
echo ============================================

set MSG=%~1
if "%MSG%"=="" (
    for /f %%a in ('powershell -command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set FECHA=%%a
    set MSG=Actualizacion !FECHA!
)

git commit -m "!MSG!"
echo OK - Commit: !MSG!

git push origin %BRANCH%
echo OK - Subido a GitHub

:deploy
echo.
echo ============================================
echo    Desplegando en Cloudflare Pages
echo ============================================
wrangler pages deploy "%~dp0" --project-name=%PROJECT_NAME% --branch=%BRANCH% --commit-message="!MSG!"

echo.
echo ============================================
echo    LISTO
echo ============================================
echo.
echo Sitio actualizado en:
echo https://endel-estudios.pages.dev
echo.
pause
exit /b 0
