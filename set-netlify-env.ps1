$env_vars = @(
  @("NEXTAUTH_URL", "https://calenvo-prod-thiago.netlify.app"),
  @("NEXT_PUBLIC_APP_URL", "https://calenvo-prod-thiago.netlify.app"),
  @("EVOLUTION_API_URL", "https://evolution-evolution-api.feidcm.easypanel.host/"),
  @("EVOLUTION_API_KEY", "Wh4Hgf19Kb1YEp41eQB8j8gLLqMiSMgX"),
  @("AWS_ACCESS_KEY_ID", "ff067f31c16a464c50bec040a8eda184"),
  @("AWS_SECRET_ACCESS_KEY", "88c88312c93fb7d5264d1d93d52bd3715a841565cfd332744d82d3be8e1c66ee"),
  @("AWS_ENDPOINT", "https://cdf14b94b8c0ac515dcfaf0bc806fe4f.r2.cloudflarestorage.com"),
  @("AWS_REGION", "auto"),
  @("AWS_BUCKET_NAME", "calenvo-storage"),
  @("AWS_FOLDER_PREFIX", "uploads/"),
  @("ABACUSAI_API_KEY", "d12e9e45cbd245b0917b8f528213e9a5"),
  @("STRIPE_PUBLISHABLE_KEY", "pk_test_51SmKceEe8DKEFqGiGFT7RuuIwrojHQHT4Zg1dXnrwczoqcfHUR1d9qq2cb8een0NWyDBSePWWKP0nqcYWIbQmrmI00JLx8Uhac"),
  @("STRIPE_SECRET_KEY", "sk_test_51SmKceEe8DKEFqGihDiEpZSNUy8b2mtMFwTqtWE02ifi3raR57AqBLrB1Xgfj5xvgVCV6IDGc1XOqPHTUzZzgtf000V6Ndx7ij"),
  @("STRIPE_STANDARD_PRICE_ID", "price_1SmKgHEe8DKEFqGiJwa9jy4T"),
  @("STRIPE_WEBHOOK_SECRET", "whsec_BESMNbUnM7c7lKZTKcGPzQF06RDEMbZ1"),
  @("N8N_WEBHOOK_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/whatsapp-calenvo"),
  @("N8N_CREATE_INSTANCE_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/criar-instancia"),
  @("N8N_UPDATE_QR_CODE_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/atualiza-qr-code"),
  @("N8N_STATUS_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/status-da-instancia"),
  @("N8N_DELETE_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/excluir-instancia"),
  @("N8N_SEND_MESSAGE_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/0dcbb952-7f01-40a7-9a8f-ca7babf85d40"),
  @("N8N_AI_AGENT_WEBHOOK_URL", "https://homologaamz-n8n.feidcm.easypanel.host/webhook/agente-ia-calenvo")
)

foreach ($var in $env_vars) {
  $key = $var[0]
  $value = $var[1]
  Write-Host "Setting $key..."
  npx netlify env:set $key $value
}

Write-Host "Done! All env vars set."
