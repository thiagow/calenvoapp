# Carregar variáveis do .env local e enviar para a Netlify
$envPath = ".\.env"
if (-Not (Test-Path $envPath)) {
    Write-Host "Arquivo .env não encontrado!"
    exit 1
}

Write-Host "Lendo .env e enviando banco de dados e segredo JWT para a Netlify..."

# Ler banco de dados
$dbUrl = Select-String -Path $envPath -Pattern "^DATABASE_URL='(.*)'$" | ForEach-Object { $_.Matches.Groups[1].Value }
if (-not $dbUrl) {
    # Tentar sem aspas simples
    $dbUrl = Select-String -Path $envPath -Pattern "^DATABASE_URL=(.*)$" | ForEach-Object { $_.Matches.Groups[1].Value }
}

# Ler nextauth secret
$nextauthSecret = Select-String -Path $envPath -Pattern "^NEXTAUTH_SECRET=(.*)$" | ForEach-Object { $_.Matches.Groups[1].Value }

if ($dbUrl) {
    Write-Host "Enviando DATABASE_URL..."
    # The actual npx netlify env:set command
    # We use Start-Process to avoid some parsing edge cases with special characters on powershell, but direct command is fine too.
    npx netlify env:set DATABASE_URL "$dbUrl"
} else {
    Write-Host "DATABASE_URL não encontrada no .env"
}

if ($nextauthSecret) {
    Write-Host "Enviando NEXTAUTH_SECRET..."
    npx netlify env:set NEXTAUTH_SECRET "$nextauthSecret"
} else {
    Write-Host "NEXTAUTH_SECRET não encontrada no .env"
}

Write-Host "Concluído! Faça um novo deploy na Netlify para aplicar as mudanças."
