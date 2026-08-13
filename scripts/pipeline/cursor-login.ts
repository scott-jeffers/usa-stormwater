/**
 * Log the Cursor SDK into your paid Cursor account (no Integrations API key).
 *
 *   npm run pipeline:cursor-login
 *
 * Opens your system browser; complete sign-in, then run overnight:go.
 */
import { spawn } from "node:child_process";
import { Cursor } from "@cursor/sdk";

function openInSystemBrowser(url: string) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    return;
  }
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
}

async function main() {
  const status = await Cursor.auth.status();
  if (status?.status === "logged-in") {
    console.log("Already logged in to Cursor SDK with your Cursor account.");
    console.log(JSON.stringify(status, null, 2));
    console.log("\nYou can walk away with:");
    console.log("  npm run overnight:go");
    return;
  }

  console.log("Starting Cursor SDK login with your Cursor account…");
  console.log("A browser window should open. Sign in (same account you pay for).");
  console.log("If it does not open, copy the URL printed below.\n");

  await Cursor.auth.login({
    openBrowser: true,
    onLoginUrl: (url: string) => {
      console.log("\n========== OPEN THIS URL ==========");
      console.log(url);
      console.log("===================================\n");
      openInSystemBrowser(url);
    },
  });

  const after = await Cursor.auth.status();
  console.log("\nLogin result:", JSON.stringify(after, null, 2));
  if (after?.status !== "logged-in") {
    process.exitCode = 1;
    console.error("Login did not complete. Re-run this script and finish the browser flow.");
  } else {
    console.log("OK — walk away with:");
    console.log("  npm run overnight:go");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
