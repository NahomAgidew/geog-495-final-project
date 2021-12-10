mapboxgl.accessToken =
    'pk.eyJ1IjoibmFob21hIiwiYSI6ImNrdmN1M2VqdjNwc2MycW1zcGdxNmlqeWEifQ.xLWKVeuyBVIhSID2bxYl6A';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/nahoma/ckwzik91z04a714o10jr83jtk',
  center: [-122.4124, 47.6446],
  zoom: 11
});

async function geojsonFetch() {
  let response, incidents;
  response = await fetch('assets/incidents.geojson');
  incidents = await response.json();

  let filterDay = ['!=', ['string', ['get', 'Day']], 'placeholder'];
  let filterHour = ['==', ['number', ['get', 'Hour']], 12];

  map.on('load', () => {
    map.addSource('incidents', {
      type: 'geojson',
      data: incidents
    });

    map.addLayer({
      id: 'incident-point',
      type: 'circle',
      source: 'incidents',
      // minzoom: 12,
      paint: {
        'circle-opacity': 0.8,
        'circle-color': [
            'match',
            ['get', 'type'],
            'Aid Response', '#b3a632',
            'Medic Response',  '#f821b6',
            'Trans to AMR',  '#f76091',
            'Auto Fire Alarm',  '#815755',
            'Low Acuity Response',  '#37830e',
            /* other */ '#26aab0'
        ]
      },
      'filter': ['all', filterHour, filterDay]
    });

    // update hour filter when the slider is dragged
    document.getElementById('slider').addEventListener('input', (event) => {
      const hour = parseInt(event.target.value);
      // update the map
      filterHour = ['==', ['number', ['get', 'Hour']], hour];
      map.setFilter('incident-point', ['all', filterHour, filterDay]);

      // converting 0-23 hour to AMPM format
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 ? hour % 12 : 12;

      // update text in the UI
      document.getElementById('active-hour').innerText = hour12 + ampm;
    });

    document
          .getElementById('filters')
          .addEventListener('change', (event) => {
              const day = event.target.value;
              // update the map filter
              if (day === 'all') {
                  filterDay = ['!=', ['string', ['get', 'Day']], 'placeholder'];
              } else if (day === 'weekday') {
                  filterDay = [
                      'match',
                      ['get', 'Day'],
                      ['Sat', 'Sun'],
                      false,
                      true
                  ];
              } else if (day === 'weekend') {
                  filterDay = [
                      'match',
                      ['get', 'Day'],
                      ['Sat', 'Sun'],
                      true,
                      false
                  ];
              } else {
                  console.error('error');
              }
              map.setFilter('incident-point', ['all', filterHour, filterDay]);
          });
  });

  map.on('click', 'incident-point', (event) => {
    new mapboxgl.Popup()
      .setLngLat(event.features[0].geometry.coordinates)
      .setHTML(`<strong>Address:</strong> ${event.features[0].properties.address} <br>
                <strong>Date & Time:</strong> ${new Date(event.features[0].properties.datetime).toLocaleString()} <br>
                <strong>Response:</strong> ${event.features[0].properties.type}`)
      .addTo(map);
  });
}

geojsonFetch();
