@echo off
REM Mo 2 cua so terminal rieng: 1 chay server (API, port 4001), 1 chay client (giao dien, port 5174)
REM Chay file nay bang cach double-click, hoac go "start-all.bat" trong terminal tai thu muc du an.

start "dienmaynk-mini - server (4001)" cmd /k "cd /d %~dp0server && npm run dev"
start "dienmaynk-mini - client (5174)" cmd /k "cd /d %~dp0client && npm run dev -- --port 5174"

echo Da mo 2 cua so: server tai http://localhost:4001, client tai http://localhost:5174
echo Doi vai giay cho server/client khoi dong xong roi mo trinh duyet vao http://localhost:5174
