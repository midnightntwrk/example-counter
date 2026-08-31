# Running example-counter on Windows (WSL2)

This guide covers running the counter example on Windows using
WSL2 (Windows Subsystem for Linux). All commands run inside your
WSL terminal unless stated otherwise.

## Prerequisites

- Windows 10 version 2004 or later, or Windows 11
- WSL2 with Ubuntu 22.04 or 24.04

## 1. Install Node.js via nvm

The example requires Node.js v22 or later. Using nvm avoids
permission issues that occur with the system package manager.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version  # must show v22.x.x
```

## 2. Install Docker in WSL2

WSL2 does not ship with Docker. Install it directly in your
Ubuntu environment:

```bash
sudo apt update
sudo apt install -y docker.io
sudo usermod -aG docker $USER
newgrp docker
```

Start the Docker daemon (required each session, or add to `~/.bashrc`):

```bash
sudo service docker start
```

Verify Docker is running:

```bash
docker info
```

## 3. Run the proof server

```bash
docker run -d \
  -p 6300:6300 \
  --name midnight-proof-server \
  midnightntwrk/proof-server:latest

# Verify
curl http://localhost:6300/health
# Expected: {"status":"ok"}
```

Keep this running for all contract interactions. To restart after
a system reboot:

```bash
sudo service docker start
docker start midnight-proof-server
```

## 4. Install the Compact compiler

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

source $HOME/.local/bin/env
compact --version
```

## 5. Clone and run the example

```bash
git clone https://github.com/midnightntwrk/example-counter.git
cd example-counter
npm install
npm run build
npm start
```

## Common WSL2 issues

### Docker daemon not starting

WSL2 does not use systemd by default. Start Docker manually:

```bash
sudo service docker start
```

To start Docker automatically on every WSL session, add this line
to your `~/.bashrc`:

```bash
echo 'sudo service docker start > /dev/null 2>&1' >> ~/.bashrc
```

### Port not accessible from Windows browser

WSL2 ports are accessible from Windows at `localhost`. If
`http://localhost:6300` does not respond in your Windows browser,
find your WSL IP and use it directly:

```bash
hostname -I | awk '{print $1}'
```

### Slow file operations

Avoid storing the project under `/mnt/c/` (your Windows drive).
Use the WSL native filesystem for best performance:

```bash
# Recommended
cd ~/projects
git clone https://github.com/midnightntwrk/example-counter.git
```