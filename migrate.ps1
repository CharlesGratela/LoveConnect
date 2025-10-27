# Migration Helper Script
# This script copies necessary files from the old Vite structure to the new Next.js structure

Write-Host "Starting migration..." -ForegroundColor Green

# Copy UI components
Write-Host "Copying UI components..." -ForegroundColor Yellow
if (Test-Path "src\components\ui") {
    Copy-Item -Recurse "src\components\ui\*" "components\ui\" -Force
    Write-Host "✓ UI components copied" -ForegroundColor Green
}

# Copy hooks
Write-Host "Copying hooks..." -ForegroundColor Yellow
if (Test-Path "src\hooks") {
    Copy-Item -Recurse "src\hooks\*" "hooks\" -Force
    Write-Host "✓ Hooks copied" -ForegroundColor Green
}

# Copy SwipeCard component
Write-Host "Copying SwipeCard component..." -ForegroundColor Yellow
if (Test-Path "src\components\discover") {
    Copy-Item -Recurse "src\components\discover\*" "components\discover\" -Force
    Write-Host "✓ SwipeCard component copied" -ForegroundColor Green
}

# Copy Header component
Write-Host "Copying Header component..." -ForegroundColor Yellow
if (Test-Path "src\components\layout") {
    Copy-Item -Recurse "src\components\layout\*" "components\layout\" -Force
    Write-Host "✓ Header component copied" -ForegroundColor Green
}

Write-Host "`nMigration complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Create .env.local file with your MongoDB URI and OpenAI API key"
Write-Host "2. Run: npm install"
Write-Host "3. Run: npm run dev"
Write-Host "`nSee NEXTJS_MIGRATION_README.md for detailed instructions" -ForegroundColor Cyan
