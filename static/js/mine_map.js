const map = L.map("mineMap").setView([32.8067, -86.7911], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const layer = L.layerGroup().addTo(map);
let bounds = [];

function popupHtml(p) {
  return `
    <strong>${p.name || "Mine record"}</strong><br>
    <small>${p.county || "Alabama"} ${p.mine_type ? "• " + p.mine_type : ""}</small>
    <p>${p.summary || ""}</p>
    ${p.operator ? `<p><strong>Operator:</strong> ${p.operator}</p>` : ""}
    ${p.company ? `<p><strong>Company:</strong> ${p.company}</p>` : ""}
    ${p.status ? `<p><strong>Status:</strong> ${p.status}</p>` : ""}
    ${p.source_url ? `<a href="${p.source_url}">Source</a>` : ""}
  `;
}

async function loadMineMap() {
  const res = await fetch("/api/mine-map-points");
  const points = await res.json();

  const count = document.getElementById("mineCount");
  const note = document.getElementById("mineNote");
  const list = document.getElementById("mineList");

  count.textContent = `${points.length} exact mines plotted`;

  if (!points.length) {
    note.textContent =
      "No source-backed mine locations have been added yet. The interactive map is ready and will populate when exact mine records are loaded.";
    list.innerHTML = "";
    return;
  }

  note.textContent = "Showing source-backed Alabama mine locations.";

  for (const p of points) {
    const marker = L.circleMarker([p.lat, p.lon], {
      radius: 8,
      weight: 2,
      fillOpacity: 0.78
    }).bindPopup(popupHtml(p));

    marker.addTo(layer);
    bounds.push([p.lat, p.lon]);
  }

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }

  list.innerHTML = points.map(p => `
    <div class="map-record">
      <strong>${p.name}</strong>
      <small>${p.county || "Alabama"} • ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</small>
    </div>
  `).join("");
}

document.getElementById("fitBtn")?.addEventListener("click", () => {
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30] });
  } else {
    map.setView([32.8067, -86.7911], 7);
  }
});

loadMineMap();
