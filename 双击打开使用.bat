@echo off
chcp 65001 >nul
title 文档管理系统 - 前端开发服务器

cd /d "%~dp0"

echo ========================================
echo   文档管理系统 - 启动前端
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
)

echo [启动] 正在启动开发服务器...
echo [访问] http://localhost:3000
echo [退出] 按 Ctrl+C 停止服务
echo.

call npm run dev

pause
