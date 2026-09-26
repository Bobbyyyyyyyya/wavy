// electron-builder afterPack-hook: zet een verse AD-HOC signatuur over de
// hele bundel (met behoud van entitlements).
//
// Waarom: electron-builder past de bundel aan NA Electrons originele
// signing, waardoor geneste seals breken -> Gatekeeper zegt "beschadigd".
// Volledig strippen is geen optie (kernel killt de app bij launch).
// Een geldige ad-hoc seal vertrouwt Gatekeeper niet, maar toont wel de
// omzeilbare "kan niet scannen op malware"-melding i.p.v. "beschadigd".
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(context) {
  const appDir = context.appOutDir;
  const apps = fs
    .readdirSync(appDir)
    .filter((f) => f.endsWith(".app"))
    .map((f) => path.join(appDir, f));

  for (const app of apps) {
    execFileSync("codesign", [
      "--sign", "-",
      "--force",
      "--deep",
      "--preserve-metadata=entitlements",
      app,
    ]);
    const out = execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=1", app], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    console.log(`[afterPack] ad-hoc re-signed ${app}: ${out.split("\n").pop()}`);
  }
};
