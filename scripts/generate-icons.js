const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico");

const source = path.join(__dirname, "../public/icon.png");
const publicDir = path.join(__dirname, "../public");

async function generateIcons() {
  if (!fs.existsSync(source)) {
    console.error("Missing public/icon.png");
    process.exit(1);
  }

  await sharp(source).resize(16, 16).png().toFile(path.join(publicDir, "favicon-16x16.png"));
  await sharp(source).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32x32.png"));
  await sharp(source).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  await sharp(source).resize(192, 192).png().toFile(path.join(publicDir, "android-chrome-192x192.png"));
  await sharp(source).resize(512, 512).png().toFile(path.join(publicDir, "android-chrome-512x512.png"));

  const icoBuffer = await pngToIco([
    path.join(publicDir, "favicon-16x16.png"),
    path.join(publicDir, "favicon-32x32.png"),
  ]);

  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);

  const manifest = {
    name: "Freelance Hub SA",
    short_name: "Freelance Hub SA",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#0f172a",
    background_color: "#0f172a",
    display: "standalone",
  };

  fs.writeFileSync(
    path.join(publicDir, "site.webmanifest"),
    JSON.stringify(manifest, null, 2)
  );

  console.log("Icons generated successfully.");
}

generateIcons();