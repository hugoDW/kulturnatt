const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootEnvPath = path.resolve(__dirname, "../../../.env");
const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node scripts/with-root-env.js <command> [...args]");
  process.exit(1);
}

if (fs.existsSync(rootEnvPath)) {
  const envFile = fs.readFileSync(rootEnvPath, "utf8");

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key.startsWith("EXPO_PUBLIC_")) {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const child = spawn(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
