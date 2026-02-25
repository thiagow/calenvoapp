# Carregar variáveis do .env local e enviar para a Netlify
$envPath = ".\.env"
if (-Not (Test-Path $envPath)) {
    Write-Host "Arquivo .env não encontrado!"
    exit 1
}

Write-Host "Lendo .env e enviando credenciais AWS/R2 para a Netlify..."

$varsToPush = @(
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ENDPOINT",
    "AWS_REGION",
    "AWS_BUCKET_NAME",
    "AWS_FOLDER_PREFIX"
)

foreach ($varName in $varsToPush) {
    # Tentar ler com aspas simples (caso comum do env default)
    $val = Select-String -Path $envPath -Pattern "^$varName='(.*)'$" | ForEach-Object { $_.Matches.Groups[1].Value }
    
    # Tentar sem aspas
    if (-not $val) {
        $val = Select-String -Path $envPath -Pattern "^$varName=(.*)$" | ForEach-Object { $_.Matches.Groups[1].Value }
    }

    if ($val) {
        Write-Host "Enviando $varName..."
        echo "y" | npx netlify env:set $varName "$val"
    }
    else {
        Write-Host "Aviso: $varName não encontrada no .env"
    }
}

Write-Host "Concluído! Faça um novo deploy na Netlify para aplicar as mudanças."
