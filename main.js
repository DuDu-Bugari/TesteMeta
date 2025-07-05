
// Map init
const map = L.map('map').setView([-13.15, -53.42], 14);

// Base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let pointsData, perimLayer, idwLayer;
const drop = document.getElementById('fieldSelect');

// Load data
Promise.all([
  fetch('data/perimetro.geojson').then(r=>r.json()),
  fetch('data/pontos.geojson').then(r=>r.json())
]).then(([perim, pontos])=>{
  perimLayer = L.geoJSON(perim, {style:{color:'#333',fill:false}}).addTo(map);
  map.fitBounds(perimLayer.getBounds());

  pointsData = pontos;

  // Populate dropdown with numeric fields
  const sampleProps = pontos.features[0].properties;
  for(const k in sampleProps){
    const v = sampleProps[k];
    if(typeof v === 'number' && !Number.isNaN(v)){
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      drop.appendChild(opt);
    }
  }

  drop.addEventListener('change', updateIdw);
  updateIdw();
});

function updateIdw(){
  if(idwLayer){ map.removeLayer(idwLayer);}
  const field = drop.value;
  // convert to array for plugin [lat,lng,value]
  const data = pointsData.features.map(f=>{
    const coords = f.geometry.coordinates; // [lng,lat]
    const val = f.properties[field];
    return [coords[1], coords[0], val];
  });

  idwLayer = L.idwLayer(data, {
    opacity: 0.7,
    cellSize: 50, // pixel size, adjust if necessary
    exp: 2,
    max: Math.max(...data.map(d=>d[2])),
    gradient:{0.0:'green',0.5:'yellow',1.0:'red'}
  });
  idwLayer.addTo(map);
}
