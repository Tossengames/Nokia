async function loadPhone() {
  try {
    const res = await fetch("phones.json");
    const phones = await res.json();

    // Pick a random phone
    const phone = phones[Math.floor(Math.random() * phones.length)];

    const url =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query" +
      "&titles=" + phone.wiki +
      "&prop=pageimages" +
      "&pithumbsize=600" +
      "&format=json" +
      "&origin=*";

    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];

    const container = document.getElementById("result");
    container.innerHTML = "";

    if (!page.thumbnail) {
      container.innerHTML = "<p>No image found for this phone.</p>";
      return;
    }

    const img = document.createElement("img");
    img.src = page.thumbnail.source;

    const text = document.createElement("p");
    text.textContent = `${phone.model} — Released ${phone.year}\n${phone.fact}`;

    container.appendChild(img);
    container.appendChild(text);

  } catch (err) {
    console.error(err);
    document.getElementById("result").innerHTML = "<p>Error loading phone data.</p>";
  }
}