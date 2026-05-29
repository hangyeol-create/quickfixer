@echo off
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo npm install failed. Please install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
)
echo Open http://localhost:5173 in your browser.
echo Close this window to stop the server.
npm run dev
if errorlevel 1 (
    echo Server failed to start. See error above.
    pause
)
