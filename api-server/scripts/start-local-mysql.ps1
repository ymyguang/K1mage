$ErrorActionPreference = "Stop"

$mysqlBase = "C:\Program Files\MySQL\MySQL Server 8.4"
$configPath = "E:\k1mage-mysql\my.ini"

$listener = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue |
  Where-Object { $_.State -eq "Listen" } |
  Select-Object -First 1

if ($listener) {
  Write-Host "MySQL is already listening on 3306."
  exit 0
}

Start-Process `
  -FilePath "$mysqlBase\bin\mysqld.exe" `
  -ArgumentList "--defaults-file=`"$configPath`"" `
  -WindowStyle Hidden

Start-Sleep -Seconds 5

$listener = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue |
  Where-Object { $_.State -eq "Listen" } |
  Select-Object -First 1

if (-not $listener) {
  throw "MySQL did not start on port 3306."
}

Write-Host "MySQL started on 3306 with data dir E:\k1mage-mysql\data."
