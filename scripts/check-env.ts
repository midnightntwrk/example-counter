// This file is part of example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * check-env.ts
 *
 * Preflight environment check for the Counter DApp.
 * Run this before starting the DApp to catch common
 * setup issues early with actionable error messages.
 *
 * Usage: npm run check-env
 */

import { execSync } from "child_process";

const REQUIRED_NODE_MAJOR = 22;
const REQUIRED_COMPACT_VERSION = "0.28.0";
const PROOF_SERVER_PORT = 6300;

let passed = 0;
let failed = 0;

function ok(label: string, detail?: string) {
  console.log(`  ✓  ${label}${detail ? ` (${detail})` : ""}`);
  passed++;
}

function fail(label: string, fix: string) {
  console.log(`  ✗  ${label}`);
  console.log(`     Fix: ${fix}`);
  failed++;
}

function run(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch {
    return null;
  }
}

console.log("\nTrustWork Counter DApp - Environment Check");
console.log("===========================================\n");

// ── Node.js version ──────────────────────────────────────────
const nodeVersion = process.version; // e.g. v22.15.0
const nodeMajor = parseInt(nodeVersion.slice(1).split(".")[0], 10);
if (nodeMajor >= REQUIRED_NODE_MAJOR) {
  ok("Node.js", nodeVersion);
} else {
  fail(
    `Node.js ${nodeVersion} is too old (need v${REQUIRED_NODE_MAJOR}+)`,
    `Install Node.js ${REQUIRED_NODE_MAJOR}+ from https://nodejs.org`
  );
}

// ── npm ──────────────────────────────────────────────────────
const npmVersion = run("npm --version");
if (npmVersion) {
  ok("npm", `v${npmVersion}`);
} else {
  fail("npm not found", "npm is bundled with Node.js - reinstall Node.js");
}

// ── Docker installed ─────────────────────────────────────────
const dockerVersion = run("docker --version");
if (dockerVersion) {
  ok("Docker installed", dockerVersion.replace("Docker version ", ""));
} else {
  fail(
    "Docker not found",
    "Install Docker Desktop from https://docs.docker.com/get-docker"
  );
}

// ── Docker running ───────────────────────────────────────────
const dockerRunning = run("docker info");
if (dockerRunning) {
  ok("Docker daemon is running");
} else {
  fail(
    "Docker daemon is not running",
    "Open Docker Desktop and wait for it to fully start before retrying"
  );
}

// ── docker compose ───────────────────────────────────────────
const composeVersion =
  run("docker compose version") ?? run("docker-compose --version");
if (composeVersion) {
  ok("docker compose", composeVersion.replace("Docker Compose version ", ""));
} else {
  fail(
    "docker compose not found",
    "Update Docker Desktop to a version that includes Compose V2"
  );
}

// ── Compact compiler ─────────────────────────────────────────
const compactVersion = run("compact compile --version");
if (compactVersion) {
  if (compactVersion.includes(REQUIRED_COMPACT_VERSION)) {
    ok("Compact compiler", compactVersion);
  } else {
    fail(
      `Compact compiler version mismatch (found: ${compactVersion}, need: ${REQUIRED_COMPACT_VERSION})`,
      `Run: compact update ${REQUIRED_COMPACT_VERSION}`
    );
  }
} else {
  fail(
    "Compact compiler not found",
    'Install with: curl --proto \'=https\' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh\n     Then run: compact update ' + REQUIRED_COMPACT_VERSION
  );
}

// ── Proof server reachable (optional, non-blocking) ──────────
try {
  const { createConnection } = await import("net");
  await new Promise<void>((resolve) => {
    const socket = createConnection(PROOF_SERVER_PORT, "127.0.0.1");
    socket.setTimeout(1500);
    socket.on("connect", () => {
      ok("Proof server", `reachable on port ${PROOF_SERVER_PORT}`);
      socket.destroy();
      resolve();
    });
    socket.on("error", () => {
      console.log(`  ⚠  Proof server not running on port ${PROOF_SERVER_PORT}`);
      console.log(
        "     This is fine if you haven't started it yet. Run: npm run preprod-ps"
      );
      socket.destroy();
      resolve();
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve();
    });
  });
} catch {
  // net module unavailable - skip this check
}

// ── Summary ──────────────────────────────────────────────────
console.log("\n-------------------------------------------");
if (failed === 0) {
  console.log(`  All ${passed} checks passed. You're good to go!\n`);
  console.log("  Next step: cd counter-cli && npm run preprod-ps\n");
  process.exit(0);
} else {
  console.log(
    `  ${passed} passed, ${failed} failed. Fix the issues above before continuing.\n`
  );
  process.exit(1);
}
```

Commit message:
```
feat(scripts): add check-env preflight script for environment validation
