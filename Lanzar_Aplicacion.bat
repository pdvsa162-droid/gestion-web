@echo off
title Lanzador de Aplicacion Recursos Humanos - PDVSA
echo Lanzando entorno seguro de desarrollo local...

:: Captura la ruta de la carpeta actual donde esta este archivo .bat
set "CURRENT_DIR=%~dp0"

:: Comando para abrir Edge sin restricciones apuntando directamente a tu index.html
start msedge --disable-web-security --user-data-dir="%TEMP%\edge_dev" "%CURRENT_DIR%index.html"

exit