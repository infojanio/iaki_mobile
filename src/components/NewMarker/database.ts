export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Marker {
  id: number
  color: 'red' | 'green'
  coordinates: Coordinates
}

interface Database {
  markers: Marker[]
}

function getRandomColor(): 'red' | 'green' {
  return Math.random() > 0.5 ? 'red' : 'green'
}

/*
function getRandomLatitude(min = -6, max = -23) {
  return Math.random() * (max - min) + min
}


function getRandomLongitude(min = -40, max = -60) {
  return Math.random() * (max - min) + min
}
*/

function getCityLatitude(latitude: Coordinates) {
  return latitude
}

function getCityLongitude(longitude: Coordinates) {
  return longitude
}

function generateRandomMarkers(numberOfmarkers = 1) {
  const markers: Marker[] = []
  for (let i = 0; i < numberOfmarkers; i++) {
    markers.push({
      id: i,
      color: getRandomColor(),
      coordinates: {
        latitude: -13.037538,
        longitude: -46.770345,
      },
    })
  }
  return markers
}

const database: Database = {
  markers: generateRandomMarkers(0),
}

export default database
