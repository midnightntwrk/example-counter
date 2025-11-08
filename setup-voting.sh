#!/bin/bash

# Setup script for the Anonymous Voting System
# This script installs dependencies and builds the project

set -e

echo "=========================================="
echo "Anonymous Voting System Setup"
echo "=========================================="
echo

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Found Node.js $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v(2[2-9]|[3-9][0-9])\. ]]; then
    echo "❌ Error: Node.js 22.15 or higher is required"
    echo "Please install from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js version OK"
echo

# Check for compact compiler
echo "Checking for Compact compiler..."
if command -v compact &> /dev/null; then
    COMPACT_VERSION=$(compact --version 2>&1 || echo "unknown")
    echo "✅ Compact compiler found: $COMPACT_VERSION"
else
    echo "❌ Compact compiler not found"
    echo
    echo "Installing Compact compiler..."
    echo "Running: curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh"

    if curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh; then
        echo "✅ Compact compiler installed"
        echo
        echo "⚠️  Please run the following command and try again:"
        echo "source \$HOME/.local/bin/env"
        echo
        echo "Then run this script again: ./setup-voting.sh"
        exit 0
    else
        echo "❌ Failed to install Compact compiler"
        echo "Please install manually following the instructions in VOTING_SYSTEM.md"
        exit 1
    fi
fi
echo

# Check for Docker
echo "Checking for Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker found: $DOCKER_VERSION"
else
    echo "⚠️  Docker not found"
    echo "Docker is required to run the proof server"
    echo "Install from: https://docs.docker.com/desktop/"
    echo
    echo "You can continue, but you'll need to install Docker before running the voting system"
    echo
fi
echo

# Install npm dependencies
echo "Installing npm dependencies..."
if npm install; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo

# Compile smart contracts
echo "Compiling smart contracts..."
cd contract
if npm run compact; then
    echo "✅ Smart contracts compiled"
else
    echo "❌ Failed to compile smart contracts"
    exit 1
fi
cd ..
echo

# Build the project
echo "Building the project..."
if npm run build --workspaces; then
    echo "✅ Project built successfully"
else
    echo "❌ Failed to build project"
    exit 1
fi
echo

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo
echo "Next steps:"
echo
echo "1. Start the proof server:"
echo "   docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'"
echo
echo "2. In a new terminal, start the voting system:"
echo "   cd counter-cli && npm run start-voting"
echo
echo "See VOTING_SYSTEM.md for detailed usage instructions."
echo
