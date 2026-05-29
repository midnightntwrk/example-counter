"use server";

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";

const execAsync = promisify(exec);

// Path to the workspace root
const ROOT_DIR = path.resolve(process.cwd(), "..");

async function runCliAction(command: string, args: string = "") {
  try {
    const { stdout } = await execAsync(`npx tsx src/cli-action.ts ${command} ${args}`, {
      cwd: ROOT_DIR,
      timeout: 300000, // 5 min timeout for wallet sync + tx finalize
    });
    
    // Parse the last line of stdout as JSON (in case there are other logs)
    const lines = stdout.trim().split("\n");
    const jsonStr = lines[lines.length - 1];
    
    return JSON.parse(jsonStr);
  } catch (err: any) {
    console.error("CLI Action failed:", err);
    throw new Error("Backend connection failed");
  }
}

export async function backendGetCounter() {
  const res = await runCliAction("get");
  if (!res.ok) throw new Error(res.error || "Unable to fetch counter value");
  return res;
}

export async function backendIncrement() {
  const res = await runCliAction("increment");
  if (!res.ok) throw new Error(res.error || "Unable to increment counter");
  return res;
}
