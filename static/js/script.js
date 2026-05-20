const cityForm = document.getElementById('city-form');
const cityInput = document.getElementById('city-input');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results');
const weatherContent = document.getElementById('weather-content');
const photosContent = document.getElementById('photos-content');
const spotsContent = document.getElementById('spots-content');

const weatherCodeEmoji = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌧️',
  53: '🌧️',
  55: '🌧️',
  56: '🌧️',
  57: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  66: '🌧️',
  67: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  77: '❄️',
  80: '🌦️',
  81: '🌦️',
  82: '⛈️',
  85: '❄️',
  86: '❄️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️'
};

cityForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  await searchCity(city);
});

async function searchCity(city) {
  setError('');
  showLoading(true);

  try {
    const location = await getLocation(city);
    const [weather, photos, spots] = await Promise.all([
      getWeather(location),
      getCityPhotos(city),
      getTouristSpots(city)
    ]);

    renderWeather(location.displayName, weather);
    renderPhotos(photos);
    renderSpots(spots);
    resultsSection.classList.remove('hidden');
  } catch (error) {
    setError(error.message || 'Unable to load city data. Please try another city.');
    resultsSection.classList.add('hidden');
  } finally {
    showLoading(false);
  }
}

function showLoading(isLoading) {
  if (isLoading) {
    weatherContent.innerHTML = '<p>Loading weather…</p>';
    photosContent.innerHTML = '<p>Loading photos…</p>';
    spotsContent.innerHTML = '<p>Loading tourist spots…</p>';
    errorMessage.classList.add('hidden');
    resultsSection.classList.remove('hidden');
  }
}

function setError(message) {
  if (message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  } else {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
  }
}

async function getLocation(city) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Location service is unavailable.');

  const data = await response.json();
  if (!data.length) throw new Error('City not found. Please try a different name.');

  const { lat, lon, display_name } = data[0];
  return { lat, lon, displayName: display_name };
}

async function getWeather(location) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather service is unavailable.');
  const data = await response.json();

  if (!data.daily) throw new Error('Unable to read weather data.');
  return data.daily;
}

async function getCityPhotos(city) {
  const query = `${city} landmarks`;
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&prop=pageimages&piprop=thumbnail|original&pithumbsize=500&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Photo service is unavailable.');
  const data = await response.json();

  const pages = data.query?.pages ? Object.values(data.query.pages) : [];
  return pages
    .map((page) => ({
      title: page.title,
      image: page.thumbnail?.source || page.original?.source,
      link: `https://en.wikipedia.org/?curid=${page.pageid}`
    }))
    .filter((item) => item.image)
    .slice(0, 6);
}

async function getTouristSpots(city) {
  const query = `${city} tourist attractions`;
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=6&srprop=snippet&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Tourist spot service is unavailable.');
  const data = await response.json();

  return data.query?.search?.map((item) => ({
    title: item.title,
    snippet: item.snippet.replace(/<[^>]+>/g, ''),
    link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
  })) || [];
}

function renderWeather(displayName, daily) {
  weatherContent.innerHTML = '';

  daily.time.slice(0, 5).forEach((date, index) => {
    const weatherCode = daily.weathercode[index];
    const emoji = weatherCodeEmoji[weatherCode] || '🌥️';
    const forecast = document.createElement('div');
    forecast.className = 'forecast-item';
    forecast.innerHTML = `
      <div>
        <strong>${formatDate(date)}</strong>
        <span>${emoji} ${weatherCodeText(weatherCode)}</span>
      </div>
      <div>
        <span>${daily.temperature_2m_min[index]}°C – ${daily.temperature_2m_max[index]}°C</span>
      </div>
    `;
    weatherContent.appendChild(forecast);
  });
}

function renderPhotos(photos) {
  photosContent.innerHTML = '';
  if (!photos.length) {
    photosContent.innerHTML = '<p>No photos found for this city.</p>';
    return;
  }

  photos.forEach((photo) => {
    const card = document.createElement('a');
    card.className = 'photo-card';
    card.href = photo.link;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.innerHTML = `
      <img src="${photo.image}" alt="${photo.title}" loading="lazy" />
      <p>${photo.title}</p>
    `;
    photosContent.appendChild(card);
  });
}

function renderSpots(spots) {
  spotsContent.innerHTML = '';
  if (!spots.length) {
    spotsContent.innerHTML = '<li class="spot-item">No tourist spots found.</li>';
    return;
  }

  spots.forEach((spot) => {
    const item = document.createElement('li');
    item.className = 'spot-item';
    item.innerHTML = `
      <h3><a href="${spot.link}" target="_blank" rel="noopener noreferrer">${spot.title}</a></h3>
      <p>${spot.snippet}</p>
    `;
    spotsContent.appendChild(item);
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value));
}

function weatherCodeText(code) {
  const samples = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
  };
  return samples[code] || 'Mixed weather';
}
