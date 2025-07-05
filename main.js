// main.js

// Inicializa o mapa
const map = L.map('map').setView([-13.15, -53.42], 14);

// Camada de fundo OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let pointsData, perimLayer, heatLayer;
const drop = document.getElementById('fieldSelect');

// Carrega perímetro e pontos GeoJSON
Promise.all([
  fetch('perimetro.geojson').then(r => r.json()),
  fetch('pontos.geojson').then(r => r.json())
]).then(([perim, pontos]) => {
  // Desenha o perímetro
  perimLayer = L.geoJSON(perim, { style: { color: '#333', fill: false } })
                   .addTo(map);
  map.fitBounds(perimLayer.getBounds());

  // Guarda os pontos em memória
  pointsData = pontos;

  // Popula o dropdown apenas com atributos numéricos
  const sample = pontos.features[0].properties;
  for (const k in sample) {
    const v = Number(sample[k]);
    if (Number.isFinite(v)) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      drop.appendChild(opt);
    }
  }

  // Dispara o primeiro desenho
  drop.addEventListener('change', updateHeat);
  updateHeat();
});

// Função que desenha o heatmap
function updateHeat() {
  // Remove camada anterior (se existir)
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  const field = drop.value;
  // Transformar em array [lat, lng, valor]
  const heatData = pointsData.features
    .map(f => {
      const [lng, lat] = f.geometry.coordinates;
      const val = Number(f.properties[field]);
      return Number.isFinite(val) ? [lat, lng, val] : null;
    })
    .filter(Boolean);

  if (heatData.length === 0) {
    alert('Nenhum valor numérico encontrado para ' + field);
    return;
  }

  // Adiciona o heatmap
  heatLayer = L.heatLayer(heatData, {
    radius: 25,       // tamanho do “ponto”
    blur: 15,         // nível de desfoque
    maxZoom: 17,
    gradient: {
      0.0: 'green',
      0.5: 'yellow',
      1.0: 'red'
    }
  }).addTo(map);
}
