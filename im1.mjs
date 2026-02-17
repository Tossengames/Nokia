import fs from "fs";
import path from "path";

const PHONES_JSON = "./phones.json";
const OUTPUT_DIR = "./phones";

// ensure phones folder exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// read phones.json
const phones = JSON.parse(fs.readFileSync(PHONES_JSON, "utf-8"));

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

for (const phone of phones) {
  const slug = slugify(phone.name);
  const filePath = path.join(OUTPUT_DIR, `${slug}.jpg`);

  // skip if image already exists
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${phone.name} (already exists)`);
    continue;
  }

  const url = `https://source.unsplash.com/600x800/?mobile,phone,${encodeURIComponent(phone.name)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed ${phone.name}`);
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved ${slug}.jpg`);
  } catch (err) {
    console.log(`Error downloading ${phone.name}`);
  }
}