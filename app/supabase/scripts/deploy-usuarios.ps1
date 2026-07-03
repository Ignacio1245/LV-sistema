param()

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Usuarios del sistema - Supabase" -ForegroundColor Cyan
Write-Host "Este script vincula el proyecto y despliega las funciones seguras de usuarios." -ForegroundColor Gray
Write-Host ""

$projectRef = "aofoacncvivxxwnusboi"

$accessToken = Read-Host "Pegue el Supabase Access Token"

if ([string]::IsNullOrWhiteSpace($accessToken)) {
    throw "Falta el Supabase Access Token."
}

$serviceRoleKey = Read-Host "Pegue la service_role key"

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    throw "Falta la service_role key."
}

$env:SUPABASE_ACCESS_TOKEN = $accessToken

Write-Host ""
Write-Host "1/3 Vinculando proyecto..." -ForegroundColor Yellow
npx.cmd supabase link --project-ref $projectRef

Write-Host ""
Write-Host "2/3 Guardando secreto seguro..." -ForegroundColor Yellow
npx.cmd supabase secrets set "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"

Write-Host ""
Write-Host "3/3 Desplegando funciones..." -ForegroundColor Yellow
npx.cmd supabase functions deploy crear-usuario-sistema
npx.cmd supabase functions deploy eliminar-usuario-sistema

Write-Host ""
Write-Host "Listo. Ya podes crear, editar y eliminar usuarios desde la app." -ForegroundColor Green
Read-Host "Presiona Enter para cerrar"
