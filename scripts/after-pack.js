// electron-builder afterPack-hook: strip ALLE (deel)signaturen uit de .app,
// zodat Gatekeeper een ongesigneerde app als zodanig beoordeelt
// ("kan niet scannen op malware", te omzeilen) i.p.v. "beschadigd".
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_CodeSignature") {
        fs.rmSync(p, { recursive: true, force: true });
        continue;
      }
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function isSigned(file) {
  try {
    execFileSync("codesign", ["-d", file], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

exports.default = async function afterPack(context) {
  const appDir = context.appOutDir;
  const apps = fs
    .readdirSync(appDir)
    .filter((f) => f.endsWith(".app"))
    .map((f) => path.join(appDir, f));

  for (const app of apps) {
    for (const file of walk(app)) {
      if (isSigned(file)) {
        execFileSync("codesign", ["--remove-signature", file]);
      }
    }
    // Eerst alle _CodeSignature-mappen weg (ook in geneste .app's/frameworks),
    // daarna per bestand een eventuele losse signatuur verwijderen.
    try {
      execFileSync("find", [app, "-name", "_CodeSignature", "-exec", "rm", "-rf", "{}", "+"]);
    } catch {}
    for (const file of walk(app)) {
      if (isSigned(file)) {
        execFileSync("codesign", ["--remove-signature", file]);
      }
    }
    console.log(`[afterPack] signatures stripped from ${app}`);
  }
};
