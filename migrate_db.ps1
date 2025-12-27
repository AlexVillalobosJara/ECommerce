$ErrorActionPreference = "Stop"

Write-Host "=== Migrando Datos de Local a Supabase ===" -ForegroundColor Cyan

# 1. Solicitar URL de Supabase
$SupabaseUrl = Read-Host "Ingresa tu DATABASE_URL de Supabase (ej: postgres://postgres:password@db.supabase.co:5432/postgres)"

if (-not $SupabaseUrl) {
    Write-Error "La URL de Supabase es requerida."
    exit 1
}

# 2. Dump de Datos Locales
Write-Host "`n1. Exportando datos locales a 'local_dump.json'..." -ForegroundColor Yellow
# Excluímos contenttypes y auth.permission porque se regeneran automáticamente y suelen causar conflictos
python backend/manage.py dumpdata --exclude auth.permission --exclude contenttypes --indent 2 --output local_dump.json

if (-not (Test-Path local_dump.json)) {
    Write-Error "Falló la exportación de datos."
    exit 1
}
Write-Host "   -> Éxito: Datos exportados." -ForegroundColor Green

# 3. Aplicar Migraciones en Supabase
Write-Host "`n2. Aplicando esquema (migraciones) en Supabase..." -ForegroundColor Yellow
$env:DATABASE_URL = $SupabaseUrl
python backend/manage.py migrate

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló la migración del esquema en Supabase."
    exit 1
}
Write-Host "   -> Éxito: Esquema aplicado." -ForegroundColor Green

# 4. Cargar Datos en Supabase
Write-Host "`n3. Cargando datos en Supabase..." -ForegroundColor Yellow
python backend/manage.py loaddata local_dump.json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló la carga de datos en Supabase."
    exit 1
}

Write-Host "`n=== ¡Migración Completa! ===" -ForegroundColor Cyan
Write-Host "Tu base de datos en Supabase ahora tiene los datos de tu entorno Local."
