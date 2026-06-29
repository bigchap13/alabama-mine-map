const drawer = document.getElementById("drawer");
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

menuBtn?.addEventListener("click", () => drawer.classList.add("open"));
closeBtn?.addEventListener("click", () => drawer.classList.remove("open"));

searchBtn?.addEventListener("click", () => {
  searchInput?.scrollIntoView({ behavior: "smooth", block: "center" });
  searchInput?.focus();
});

async function search(q) {
  if (!q || q.length < 2) {
    searchResults.innerHTML = "";
    return;
  }

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  if (!data.length) {
    searchResults.innerHTML = `<div class="result">No mining records yet.</div>`;
    return;
  }

  searchResults.innerHTML = data.map(item => `
    <div class="result">
      <strong>${item.title || item.name || item.id || "Mining Record"}</strong>
      <small>${item.section || "record"}</small>
      <p>${item.summary || item.description || ""}</p>
    </div>
  `).join("");
}

let timer;
searchInput?.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => search(searchInput.value.trim()), 180);
});
