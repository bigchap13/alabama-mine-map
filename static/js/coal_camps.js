let camps = [];

function renderCamps() {
  const q = document.getElementById("campSearch").value.trim().toLowerCase();

  const filtered = camps.filter(c => {
    const text = `${c.name || ""} ${c.county || ""} ${c.company || ""} ${c.railroad || ""}`.toLowerCase();
    return !q || text.includes(q);
  });

  document.getElementById("campCount").textContent = `${filtered.length} records`;

  document.getElementById("campNote").textContent =
    filtered.length
      ? "Showing source-backed coal camp records."
      : "No source-backed coal camp records loaded yet.";

  document.getElementById("campList").innerHTML = filtered.slice(0, 200).map(c => `
    <a class="map-record mine-row" href="/coal-camp/${c.id}">
      <strong>${c.name}</strong>
      <small>${c.county || "Alabama"} • ${c.company || "company unknown"}</small>
    </a>
  `).join("");
}

async function loadCamps() {
  const res = await fetch("/api/coal-camps");
  camps = await res.json();
  renderCamps();
}

document.getElementById("campSearch").addEventListener("input", renderCamps);
loadCamps();
