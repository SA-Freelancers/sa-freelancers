const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico");

const source = path.join(__dirname, "../public/icon.png");
const publicDir = path.join(__dirname, "../public");

async function generate() {
  if (!fs.existsSync(source)) {
    console.error("public/icon.png not found");
    process.exit(1);
  }

  await sharp(source)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  await sharp(source)
    .resize(192, 192, { fit: "cover" })
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));

  await sharp(source)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(publicDir, "icon-512.png"));

  await sharp(source)
    .resize(48, 48, { fit: "cover" })
    .png()
    .toFile(path.join(publicDir, "favicon-48.png"));

  const icoBuffer = await pngToIco([
    path.join(publicDir, "favicon-48.png"),
  ]);

  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);

  console.log("Icons generated successfully");
}

generate();