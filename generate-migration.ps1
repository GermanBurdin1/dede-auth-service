# generate-migration.ps1
# Script for generating new migrations in auth-service

param(
    [Parameter(Mandatory=$true)]
    [string]$MigrationName
)

Write-Host "[GEN] Generating migration: $MigrationName" -ForegroundColor Cyan

# Check that we are in the correct directory
if (!(Test-Path "package.json")) {
    Write-Host "[ERR] Error: package.json not found. Make sure you are in auth-service directory" -ForegroundColor Red
    exit 1
}

# Generate migration
try {
    Write-Host "[CMD] Executing command: npm run migration:generate -- src/migrations/$MigrationName -d src/data-source.ts" -ForegroundColor Yellow
    npm run migration:generate -- src/migrations/$MigrationName -d src/data-source.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Migration '$MigrationName' generated successfully!" -ForegroundColor Green
        Write-Host "[INFO] Check file in src/migrations/ folder" -ForegroundColor Gray
    } else {
        Write-Host "[ERR] Error generating migration" -ForegroundColor Red
    }
}  catch {
    Write-Host "[ERR] An error occurred: $_" -ForegroundColor Red
}

# Show list of migrations
Write-Host "`n[LIST] Current migrations:" -ForegroundColor Blue
Get-ChildItem -Path "src/migrations" -Filter "*.ts" | Sort-Object Name | ForEach-Object {
    Write-Host "   [FILE] $($_.Name)" -ForegroundColor Gray
}

Write-Host "`n[TIP] To apply migration use: .\run-migration.ps1" -ForegroundColor Cyan 