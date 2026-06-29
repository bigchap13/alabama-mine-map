let companies = [];

function renderCompanies() {
  const q = document.getElementById("companySearch").value.trim().toLowerCase();
  const filtered = companies.filter(c => {
    const text = `${c.name || ""} ${c.slug || ""}`.toLowerCase();
    return !q || text.includes(q);
  });

  const shown = q ? filtered.slice(0, 200) : filtered.slice(0, 100);

  document.getElementById("companyCount").textContent =
    `${filtered.length} matching names`;

  document.getElementById("companyNote").textContent =
    q ? `Showing ${shown.length} search results.` : "Showing top 100. Search to narrow the full index.";

  document.getElementById("companyList").innerHTML = shown.map(c => `
    <a class="map-record mine-row" href="/company/${c.slug}">
      <strong>${c.name}</strong>
      <small>${c.count} linked mine records</small>
    </a>
  `).join("");
}

async function loadCompanies() {
  const res = await fetch("/api/companies");
  companies = await res.json();
  renderCompanies();
}

document.getElementById("companySearch").addEventListener("input", renderCompanies);

loadCompanies();
