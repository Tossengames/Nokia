import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const phones = JSON.parse(fs.readFileSync("phones.json", "utf8"));
const OUTPUT_DIR = "./phones";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

function fileNameFromModel(model) {
  return model
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + ".jpg";
}

async function fetchMainImage(wikiTitle) {
  const url =
    "https://en.wikipedia.org/w/api.php" +
    "?action=query" +
    "&titles=" + encodeURIComponent(wikiTitle) +
    "&prop=pageimages" +
    "&pithumbsize=800" +
    "&format=json" +
    "&origin=*";

  const res = await fetch(url);
  const data = await res.json();
  const page = Object.values(data.query.pages)[0];

  return page?.thumbnail?.source || null;
}

async function run() {
  for (const phone of phones) {
    const fileName = fileNameFromModel(phone.model);
    const filePath = path.join(OUTPUT_DIR, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Skipped (exists): ${fileName}`);
      continue;
    }

    console.log(`📱 ${phone.model}`);

    const imgUrl = await fetchMainImage(phone.wiki);
    if (!imgUrl) {
      console.log(`❌ No image found`);
      continue;
    }

    const imgRes = await fetch(imgUrl);
    const buffer = await imgRes.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    console.log(`✅ Saved: ${fileName}`);
  }

  console.log("\n🎉 All images downloaded.");
}

run();