# Script para reiniciar ambos servidores
# Ejecuta este script en PowerShell

Write-Host "Deteniendo servidores..." -ForegroundColor Yellow

# Detener procesos de Node.js (frontend)
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*ecommerce*" } | Stop-Process -Force

# Detener procesos de Python (backend)
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*ecommerce*" } | Stop-Process -Force

Start-Sleep -Seconds 2

Write-Host "Iniciando Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\source\reposV2026\ecommerce\backend'; ..\.venv\Scripts\python.exe manage.py runserver"

Start-Sleep -Seconds 3

Write-Host "Iniciando Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\source\reposV2026\ecommerce\frontend'; npm run dev"

Write-Host "`nServidores reiniciados!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
