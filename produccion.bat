@echo off
setlocal enabledelayedexpansion
title AcuarelaCRM - Produccion (build + preview)

REM ===== Configuracion (cambia el nombre si quieres otra URL) =====
set "SITIO=acuarela.localhost"
set "PUERTO=4173"
REM ================================================================

set "URL=http://%SITIO%:%PUERTO%/"
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] No se encontro Node.js en el PATH.
    echo Instalalo desde https://nodejs.org y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo [INFO] No existe node_modules. Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias.
        echo.
        pause
        exit /b 1
    )
)

REM --- Permitir saltar la compilacion:  produccion.bat --skip-build ---
if /i "%~1"=="--skip-build" (
    echo.
    echo [INFO] Omitiendo compilacion por parametro --skip-build
    echo.
    if not exist "dist\index.html" (
        echo [ERROR] No existe dist\index.html. Ejecuta el bat sin --skip-build.
        echo.
        pause
        exit /b 1
    )
    goto servir
)

echo.
echo ===============================================
echo   Paso 1 de 2: compilando (tsc + vite build)
echo   Esto puede tardar un poco...
echo ===============================================
echo.

call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Fallo la compilacion. Revisa los errores de arriba.
    echo         La carpeta dist NO se actualizo.
    echo.
    pause
    exit /b 1
)

:servir
REM Captura el caracter ESC (0x1B) para poder emitir secuencias de escape.
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

echo.
echo ===============================================
echo   Paso 2 de 2: sirviendo la build de dist\
REM WT_SESSION solo existe en Windows Terminal, el unico que soporta
REM hipervinculos OSC 8. En consola legacy se imprime la URL en texto plano.
if defined WT_SESSION (
    echo   Abrir:  !ESC!]8;;!URL!!ESC!\!URL!!ESC!]8;;!ESC!\    ^(Ctrl + clic^)
) else (
    echo   URL:  !URL!
)
echo   Para detener el servidor: Ctrl + C
echo ===============================================
echo.

REM Espera a que el puerto escuche y recien ahi abre el navegador.
REM Windows no resuelve *.localhost por DNS; solo el navegador lo hace (RFC 6761).
start "" /b powershell -NoProfile -WindowStyle Hidden -Command ^
 "$n=0; while($n -lt 120){ try { $c=[Net.Sockets.TcpClient]::new('127.0.0.1',%PUERTO%); $c.Close(); break } catch { Start-Sleep -Milliseconds 500; $n++ } }; if($n -lt 120){ Start-Process '%URL%' }"

call npm run preview -- --strictPort --port %PUERTO%

echo.
echo [INFO] El servidor se detuvo.
pause
endlocal
