"""
增量重部署脚本 - 只上传修改的文件，利用 Docker 层缓存快速构建
用法: python redeploy.py

工作原理:
1. 通过 SFTP 上传本地修改的文件到服务器
2. docker compose build (npm ci 命中缓存，仅 next build 重新执行 ~30秒)
3. 重启容器并验证
"""
import paramiko
import time
import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "118.25.194.212"
USER = "root"
KEY_PATH = r"C:\Users\docto\.ssh\id_rsa"
BASE = os.path.dirname(os.path.abspath(__file__))
REMOTE = "/opt/doc-management"

# 要同步的文件列表 (相对于项目根目录)
# 修改后在这里添加，或直接全量同步
SYNC_FILES = [
    "next.config.js",
    "package.json",
    "package-lock.json",
    "Dockerfile",
    "docker-compose.yml",
    "start.js",
    "src/lib/db.ts",
    "src/lib/auth.ts",
    "src/types/sql.js.d.ts",
    "src/app/api/auth/route.ts",
    "src/app/api/register/route.ts",
    "src/app/api/users/route.ts",
    "src/app/api/documents/route.ts",
    "src/app/api/documents/[id]/download/route.ts",
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/app/globals.css",
    "src/contexts/AuthContext.tsx",
    "src/components/LoginPage.tsx",
    "src/components/RegisterPage.tsx",
    "src/components/AdminPanel.tsx",
    "src/components/DocumentManager.tsx",
    "src/components/UploadModal.tsx",
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, key_filename=KEY_PATH)

def run_cmd(cmd, timeout=600):
    print(f"\n$ {cmd}", flush=True)
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    while True:
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(4096).decode('utf-8', errors='replace')
            print(chunk, end='', flush=True)
        if stdout.channel.exit_status_ready():
            remaining = stdout.read().decode('utf-8', errors='replace')
            if remaining:
                print(remaining, end='', flush=True)
            break
        time.sleep(0.5)
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err:
        print(f"\n[stderr] {err}", flush=True)

def ensure_remote_dir(remote_path):
    """Recursively create remote directories"""
    parts = remote_path.split('/')
    for i in range(2, len(parts)):
        d = '/'.join(parts[:i])
        try:
            sftp.mkdir(d)
        except:
            pass

# Step 1: Upload files
print("=== 上传文件 ===", flush=True)
sftp = ssh.open_sftp()
uploaded = 0
for rel_path in SYNC_FILES:
    local = os.path.join(BASE, rel_path.replace('/', os.sep))
    remote = f"{REMOTE}/{rel_path}"
    if os.path.exists(local):
        ensure_remote_dir(remote)
        try:
            sftp.put(local, remote)
            print(f"  ✓ {rel_path}", flush=True)
            uploaded += 1
        except Exception as e:
            print(f"  ✗ {rel_path}: {e}", flush=True)
sftp.close()
print(f"\n已上传 {uploaded} 个文件", flush=True)

# Step 2: Build
print("\n=== 构建 Docker 镜像 (增量) ===", flush=True)
run_cmd(f"cd {REMOTE} && docker compose build 2>&1", timeout=600)

# Step 3: Restart
print("\n=== 重启容器 ===", flush=True)
run_cmd(f"cd {REMOTE} && docker compose up -d 2>&1")
run_cmd("sleep 8 && docker ps -a 2>&1")
run_cmd("docker logs --tail 15 doc-management 2>&1")

# Step 4: Verify
print("\n=== 验证 ===", flush=True)
run_cmd("curl -s -o /dev/null -w 'HTTP %{http_code}\\n' http://localhost:3000")
run_cmd("curl -s http://localhost:3000/api/auth")

ssh.close()
print(f"\n\n部署完成! 访问: http://{HOST}", flush=True)
