const sharp = require("sharp");
const path = require("path");

const SOURCE =
  "C:\\Users\\jeff-\\.gemini\\antigravity-ide\\brain\\6c4c5ee2-e6c0-4f8e-8514-0def03e1e97d\\pregadynamic_icon_1781876766510.png";
const RES_DIR = "android/app/src/main/res";

const sizes = [
  { dir: "mipmap-mdpi", size: 48 },
  { dir: "mipmap-hdpi", size: 72 },
  { dir: "mipmap-xhdpi", size: 96 },
  { dir: "mipmap-xxhdpi", size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 },
];

const icons = ["ic_launcher.png", "ic_launcher_round.png"];

const fgSizes = [
  { dir: "mipmap-mdpi", size: 108 },
  { dir: "mipmap-hdpi", size: 162 },
  { dir: "mipmap-xhdpi", size: 216 },
  { dir: "mipmap-xxhdpi", size: 324 },
  { dir: "mipmap-xxxhdpi", size: 432 },
];

async function run() {
  for (const { dir, size } of sizes) {
    for (const icon of icons) {
      const dest = path.join(RES_DIR, dir, icon);
      await sharp(SOURCE).resize(size, size).png().toFile(dest);
      console.log(`✅ ${dest} (${size}x${size})`);
    }
  }

  for (const { dir, size } of fgSizes) {
    const innerSize = Math.round(size * 0.6);
    const dest = path.join(RES_DIR, dir, "ic_launcher_foreground.png");
    await sharp(SOURCE)
      .resize(innerSize, innerSize)
      .extend({
        top: Math.floor((size - innerSize) / 2),
        bottom: Math.ceil((size - innerSize) / 2),
        left: Math.floor((size - innerSize) / 2),
        right: Math.ceil((size - innerSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(dest);
    console.log(`✅ ${dest} foreground (${size}x${size})`);
  }

  // PWA icons
  await sharp(SOURCE).resize(512, 512).png().toFile("public/icons/icon-512.png");
  await sharp(SOURCE).resize(192, 192).png().toFile("public/icons/icon-192.png");
  console.log("✅ public/icons/icon-512.png");
  console.log("✅ public/icons/icon-192.png");

  console.log("\n🎉 Todos os ícones gerados com sucesso!");
}

run().catch(console.error);
