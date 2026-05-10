@echo off
cd /d "%~dp0"

set PROJECT_NAME=endel-estudios
set BRANCH=main
set "PATH=%PATH%;%APPDATA%\npm;C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"

title ENDEL-estudios Actualizador

echo.
echo ============================================
echo    ENDEL-estudios - Actualizador
echo ============================================
echo Carpeta: %~dp0
echo.

if not exist "%~dp0index.html" (
    echo ERROR: No se encontro index.html aqui.
    pause
    exit /b 1
)

git --version >nul 2>&1
if %errorLevel% neq 0 ( echo ERROR: Ejecuta instalar.bat primero. & pause & exit /b 1 )

call gh auth status >nul 2>&1
if %errorLevel% neq 0 ( call gh auth login --web --git-protocol https )
echo OK - GitHub conectado

call wrangler whoami >nul 2>&1
if %errorLevel% neq 0 ( call wrangler login )
echo OK - Cloudflare conectado

echo.
echo Detectando cambios...
git add -A >nul 2>&1

git diff --cached --quiet >nul 2>&1
if %errorLevel% neq 0 (
    echo Cambios detectados:
    git status --short
    git commit -m "Actualizacion ENDEL-estudios"
    echo OK - Commit listo
    git push origin %BRANCH%
    echo OK - Subido a GitHub
) else (
    echo No hay cambios para commit, procediendo al despliegue...
)

echo.
echo Desplegando en Cloudflare Pages...
call wrangler pages deploy . --project-name=%PROJECT_NAME% --branch=%BRANCH% --commit-message="Actualizacion ENDEL-estudios"

echo.
echo ============================================
echo    LISTO - https://endel-estudios.pages.dev
echo ============================================
echo.
pause
exit /b 0
