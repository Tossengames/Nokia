import fs from "fs";
import path from "path";

// Paths
const PHONES_JSON = "./phones.json";
const OUTPUT_DIR = "./phones";

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Read phones.json
const phones = JSON.parse(fs.readFileSync(PHONES_JSON, "utf-8"));

// Convert phone name to slug for filename
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Fetch image URL from Wikipedia
async function fetchWikiImage(title) {
  const url =
    "https://en.wikipedia.org/w/api.php" +
    "?action=query" +
    "&titles=" + encodeURIComponent(title) +
    "&prop=pageimages" +
    "&pithumbsize=800" +
    "&format=json" +
    "&origin=*";

  try {
    const res = await fetch(url);
    const data = await res.json();
    const page = Object.values(data.query.pages)[0];
    return page?.thumbnail?.source || null;
  } catch (err) {
    console.log(`Error fetching Wikipedia image for ${title}: ${err}`);
    return null;
  }
}

// Main loop
for (const phone of phones) {
  const slug = slugify(phone.model);
  const filePath = path.join(OUTPUT_DIR, `${slug}.jpg`);

  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${phone.model} (already exists)`);
    continue;
  }

  if (!phone.wiki) {
    console.log(`No wiki page for ${phone.model}`);
    continue;
  }

  const imgUrl = await fetchWikiImage(phone.wiki);
  if (!imgUrl) {
    console.log(`No Wikipedia image found for ${phone.model}`);
    continue;
  }

  try {
    const imgRes = await fetch(imgUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved ${slug}.jpg`);
  } catch (err) {
    console.log(`Error downloading image for ${phone.model}: ${err}`);
  }
}

console.log("\n✅ Done downloading all Wikipedia images.");