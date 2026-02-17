import fs from "fs";
import path from "path";

const phones = [
  "nokia 3310",
  "nokia 1100",
  "nokia 6600",
  "nokia n95",
  "nokia n97"
];

const outDir = "phones";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

for (const phone of phones) {
  const name = phone.toLowerCase().replace(/\s+/g, "-");
  const url = `https://source.unsplash.com/600x800/?${encodeURIComponent(phone)}`;

  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  fs.writeFileSync(path.join(outDir, `${name}.jpg`), buf);
  console.log(`Saved ${name}.jpg`);
}