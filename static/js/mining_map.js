const map = L.map("mineMap").setView([33.8312, -87.2775], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const layer = L.layerGroup().addTo(map);
let bounds = [];

function popupHtml(p) {
  return `
    <strong>${p.name || "Mining-linked record"}</strong><br>
    <small>${p.type || ""}</small>
    <p>${p.summary || ""}</p>
    ${p.almanac_url ? `<a href="${p.almanac_url}">Open Almanac</a><br>` : ""}
    ${p.atlas_url ? `<a href="${p.atlas_url}">Open Atlas</a>` : ""}
  `;
}

async function loadMap() {
  const res = await fetch("/api/map-points");
  const points = await res.json();

  document.getElementById("pointCount").textContent = `${points.length} plotted`;
  const list = document.getElementById("pointList");

  if (!points.length) {
    document.getElementById("mapNote").textContent =
      "No mining-linked records currently have confirmed Atlas coordinates. Add or verify coordinates in Atlas, then this map will populate automatically.";
    list.innerHTML = "";
    return;
  }

  for (const p of points) {
    const marker = L.circleMarker([p.lat, p.lon], {
      radius: 8,
      weight: 2,
      fillOpacity: 0.75
    }).bindPopup(popupHtml(p));

    marker.addTo(layer);
    bounds.push([p.lat, p.lon]);
  }

  map.fitBounds(bounds, { padding: [30, 30] });

  list.innerHTML = points.map(p => `
    <div class="map-record">
      <strong>${p.name}</strong>
      <small>${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</small>
    </div>
  `).join("");
}

document.getElementById("fitBtn")?.addEventListener("click", () => {
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
});

loadMap();
