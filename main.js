// main.js

// 1) Defina aqui as faixas (breaks) e as cores para cada nutriente,
//    conforme o "Livreto Completo Padrão". 
//    breaks = [valor_mínimo, corte1, corte2, ..., valor_máximo]
//    colors = [cor p/ Muito Baixo, Baixo, Médio, Bom, Muito Bom]

const classification = {
  "PH_EM_CACL":    { breaks:[0, 4.5, 5.2, 5.8, 6.4, 10],       colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "FOSFORO_mg":    { breaks:[0, 3,   4,   5,   8,   100],     colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "POTASSIO_m":    { breaks:[0, 20,  40,  60,  80,  1000],    colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "CALCIO_cmo":    { breaks:[0, 1,   1.6, 2,   4,   7],       colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "MAGNESIO_c":    { breaks:[0, 0.2, 0.5, 0.8, 1.4, 5],       colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "ALUMINIO_c":    { breaks:[0, 0.07,0.09,0.11,0.2,  10],     colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "MATERIA_OR":    { breaks:[0, 10,  14,  20,  24,  50],      colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "CTC_cmol_d":    { breaks:[0, 4,   5,   7,   9,   14],      colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "ENXOFRE_mg":    { breaks:[0, 6,   9,   11,  16,  50],      colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "FERRO_mg_d":    { breaks:[0, 20,  40,  60,  80,  500],     colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "MANGANES_m":    { breaks:[0, 1.9, 3,   4,   5,   100],     colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "ZINCO_mg_d":    { breaks:[0, 0.6, 0.9, 1.3, 1.6,  10],     colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] },
  "BORO_mg_dm":    { breaks:[0, 0.2, 0.3, 0.4, 0.5,  1],      colors:['#d73027','#fc8d59','#fee090','#91cf60','#1a9850'] }
};

// 2) Inicializa o mapa
const map = L.map('map').setView([-13.15, -53.42], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);

let pointsData, perimLayer, heatLayer, maskLayer;
const drop = document.getElementById('fieldSelect');

// 3) Carrega GeoJSONs de perímetro e pontos
Promise.all([
  fetch('perimetro.geojson').then(r=>r.json()),
  fetch('pontos.geojson').then(r=>r.json())
]).then(([perim, pontos])=>{
  perimLayer = L.geoJSON(perim, {style:{color:'#333',fill:false}}).addTo(map);
  map.fitBounds(perimLayer.getBounds());
  pointsData = pontos;

  // preenche dropdown só com atributos numéricos
  const sample = pontos.features[0].properties;
  for(const k in sample){
    if(Number.isFinite(Number(sample[k]))){
      const o = document.createElement('option');
      o.value = k; o.textContent = k;
      drop.appendChild(o);
    }
  }
  drop.addEventListener('change', updateHeat);
  updateHeat();
});

// 4) Função que desenha o heatmap classificado e aplica máscara
function updateHeat(){
  // limpa camada antiga
  if(heatLayer) map.removeLayer(heatLayer);
  if(maskLayer) map.removeLayer(maskLayer);

  const field = drop.value;
  const heatData = pointsData.features
    .map(f=>{
      const [lng,lat] = f.geometry.coordinates;
      const v = Number(f.properties[field]);
      return Number.isFinite(v) ? [lat,lng,v] : null;
    })
    .filter(Boolean);

  if(!heatData.length){
    alert('Nenhum valor numérico em "'+field+'".');
    return;
  }

  // monta objeto gradient conforme classificação
  const cfg = classification[field];
  let heatOpts = { radius:25, blur:15, maxZoom:17 };
  if(cfg){
    const br = cfg.breaks,
          cols = cfg.colors,
          mx = br[br.length-1],
          grad = {};
    // para cada faixa, a posição no gradiente = break/mx
    br.slice(0,-1).forEach((b,i)=> grad[b/mx] = cols[i]);
    grad[1] = cols[cols.length-1];
    heatOpts = { ...heatOpts, max: mx, gradient: grad };
  }

  heatLayer = L.heatLayer(heatData, heatOpts).addTo(map);
  applyMask();
}

// 5) Máscara para esconder tudo que fica FORA do perímetro
function applyMask(){
  // pega coords do perímetro (em lat,lng)
  const coords = perimLayer.toGeoJSON().features[0]
    .geometry.coordinates[0].map(c=>[c[1],c[0]]);
  // polígono “mundo” (ou use limites mais reais se quiser)
  const outer = [[90,-180],[90,180],[-90,180],[-90,-180]];
  // anel exterior (mundo) e interior (perímetro) → mascara
  maskLayer = L.polygon([outer, coords], {
    color:'#fff', fillColor:'#fff', fillOpacity:1, stroke:false
  }).addTo(map);
}
