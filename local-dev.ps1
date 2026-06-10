param(
  [ValidateSet("up", "seed", "down", "logs", "ps", "restart")]
  [string]$Action = "up"
)

$ComposeFile = "infrastructure/docker-compose.yml"
$EnvFile = ".env"
$NginxPort = if ($env:NGINX_PORT) { $env:NGINX_PORT } else { "80" }

function Ensure-EnvFile {
  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
  }
}

function Wait-Gateway {
  Write-Host "Waiting for nginx health check..."
  for ($i = 1; $i -le 90; $i++) {
    try {
      $res = Invoke-WebRequest -Uri "http://localhost:$NginxPort/healthz" -UseBasicParsing -TimeoutSec 2
      if ($res.StatusCode -eq 200) {
        Write-Host "Nginx is ready."
        return
      }
    } catch {
      Write-Host "Nginx not ready yet ($i/90)"
    }
    Start-Sleep -Seconds 2
  }
  throw "Nginx health check timed out."
}

function Seed-Data {
  Write-Host "Seeding user-service..."
  docker compose --env-file $EnvFile -f $ComposeFile exec -T user-service python manage.py seed_data --skip-checks

  Write-Host "Seeding product-service..."
  docker compose --env-file $EnvFile -f $ComposeFile exec -T product-service python manage.py seed_data --skip-checks

  Write-Host "Seed completed."
  Write-Host "Test users:"
  Write-Host "- admin / admin123"
  Write-Host "- staff / staff123"
  Write-Host "- customer / customer123"
}

function Up-All {
  Ensure-EnvFile
  docker compose --env-file $EnvFile -f $ComposeFile up --build -d
  Wait-Gateway
  Seed-Data
  Write-Host "System is ready:"
  Write-Host "- Nginx entrypoint (UI + API): http://localhost"
  Write-Host "- Frontend direct dev port: http://localhost:3000"
  Write-Host "- Gateway direct API: http://localhost:8080"
}

switch ($Action) {
  "up" { Up-All }
  "seed" { Seed-Data }
  "down" { docker compose --env-file $EnvFile -f $ComposeFile down }
  "logs" { docker compose --env-file $EnvFile -f $ComposeFile logs -f }
  "ps" { docker compose --env-file $EnvFile -f $ComposeFile ps }
  "restart" {
    docker compose --env-file $EnvFile -f $ComposeFile down
    Up-All
  }
}
