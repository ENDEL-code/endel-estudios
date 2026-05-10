@echo off
cd /d "%~dp0"
setlocal enabledelayedexpansion

set GITHUB_USER=ENDEL-code
set REPO_NAME=endel-estudios
set PROJECT_NAME=endel-estudios
set BRANCH=main

set "PATH=%PATH%;%APPDATA%\npm;C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"

title ENDEL-estudios Instalador

echo.
echo ============================================
echo    ENDEL-estudios - Instalador automatico
echo ============================================
echo Carpeta: %~dp0
echo.

if not exist "%~dp0index.html" (
    echo ERROR: No se encontro index.html aqui.
    pause
    exit /b 1
)
echo OK - Proyecto detectado

echo.
echo ============================================
echo PASO 1 - Git
echo ============================================
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Instalando Git...
    winget install --id Git.Git -e --source winget --silent --accept-package-agreements --accept-source-agreements
) else (
    echo OK - Git ya instalado
)
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Cierra y reabre VS Code y vuelve a ejecutar.
    pause
    exit /b 1
)
echo OK - Git listo
git config --global user.email "copiloto237@gmail.com" >nul 2>&1
git config --global user.name "ENDEL-estudios" >nul 2>&1
git config --global init.defaultBranch main >nul 2>&1

echo.
echo ============================================
echo PASO 2 - Node.js
echo ============================================
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Instalando Node.js...
    winget install --id OpenJS.NodeJS.LTS -e --source winget --silent --accept-package-agreements --accept-source-agreements
) else (
    echo OK - Node.js ya instalado
)
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Cierra y reabre VS Code y vuelve a ejecutar.
    pause
    exit /b 1
)
echo OK - Node.js listo

echo.
echo ============================================
echo PASO 3 - GitHub CLI
echo ============================================
gh --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Instalando GitHub CLI...
    winget install --id GitHub.cli -e --source winget --silent --accept-package-agreements --accept-source-agreements
) else (
    echo OK - GitHub CLI ya instalado
)
gh --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Cierra y reabre VS Code y vuelve a ejecutar.
    pause
    exit /b 1
)
echo OK - GitHub CLI listo

echo.
echo ============================================
echo PASO 4 - Wrangler (ya instalado)
echo ============================================
echo OK - Wrangler listo

echo.
echo ============================================
echo PASO 5 - Login GitHub
echo ============================================
call gh auth status >nul 2>&1
if %errorLevel% neq 0 (
    echo Se abrira el navegador para GitHub.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    call gh auth login --web --git-protocol https
    if %errorLevel% neq 0 (
        echo ERROR: Login GitHub fallido.
        pause
        exit /b 1
    )
) else (
    echo OK - GitHub ya conectado
)
echo OK - GitHub listo

echo.
echo ============================================
echo PASO 6 - Login Cloudflare
echo ============================================
call wrangler whoami >nul 2>&1
if %errorLevel% neq 0 (
    echo Se abrira el navegador para Cloudflare.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    call wrangler login
    if %errorLevel% neq 0 (
        echo ERROR: Login Cloudflare fallido.
        pause
        exit /b 1
    )
) else (
    echo OK - Cloudflare ya conectado
)
echo OK - Cloudflare listo

echo.
echo ============================================
echo PASO 7 - Git local
echo ============================================
if not exist "%~dp0.git" (
    git init -b %BRANCH%
    echo OK - Git inicializado
) else (
    echo OK - Git ya existe
)
(
echo .DS_Store
echo Thumbs.db
echo node_modules/
echo *.log
) > "%~dp0.gitignore"
git add -A >nul 2>&1
git log --oneline -1 >nul 2>&1
if %errorLevel% neq 0 (
    git commit -m "Primer deploy ENDEL-estudios"
) else (
    git diff --cached --quiet >nul 2>&1
    if %errorLevel% neq 0 git commit -m "Actualizacion inicial ENDEL-estudios"
)
echo OK - Commit listo

echo.
echo ============================================
echo PASO 8 - Repositorio GitHub
echo ============================================
call gh repo view %GITHUB_USER%/%REPO_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo Creando repositorio...
    call gh repo create %GITHUB_USER%/%REPO_NAME% --public --description "ENDEL-estudios" --source=. --remote=origin --push
    echo OK - Repositorio creado
) else (
    echo OK - Repositorio ya existe
    git remote get-url origin >nul 2>&1
    if %errorLevel% neq 0 git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
    git push -u origin %BRANCH%
    echo OK - Codigo subido
)

echo.
echo ============================================
echo PASO 9 - Cloudflare Pages
echo ============================================
call wrangler pages project list 2>nul | findstr /i "%PROJECT_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo Creando proyecto...
    call wrangler pages project create %PROJECT_NAME% --production-branch=%BRANCH%
) else (
    echo OK - Proyecto ya existe
)
echo Desplegando...
call wrangler pages deploy . --project-name=%PROJECT_NAME% --branch=%BRANCH% --commit-message="Primer deploy ENDEL-estudios"

echo.
echo ============================================
echo    LISTO
echo ============================================
echo.
echo https://endel-estudios.pages.dev
echo https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
pause
exit /b 0
