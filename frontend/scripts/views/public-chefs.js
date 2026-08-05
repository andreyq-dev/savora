// frontend/scripts/views/public-chefs.js
import api from '../services/api.js';

const chefsGrid = document.getElementById('chefs-grid');
const loadingMessage = document.getElementById('chef-loading');
const filterForm = document.getElementById('chef-filters-form');
const searchInput = document.getElementById('chef-search');
const specialtySelect = document.getElementById('chef-specialty');
const locationSelect = document.getElementById('chef-location');
const resultsCount = document.getElementById('chef-results-count');
const clearFiltersButton = document.getElementById('clear-chef-filters');

function unwrap(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
}

function getErrorMessage(error) {
  const payload = error?.response?.data;
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  return error?.message || 'Error inesperado';
}

function createChefCard(chef, index) {
  const displayName = chef?.name || chef?.user?.username || 'Chef';
  const specialty = chef?.specialty || 'Especialidad culinaria';
  const location = chef?.location || 'Ubicación disponible';
  const bio = chef?.bio || 'Consulta disponibilidad y servicios personalizados.';
  const revealDirection = index % 2 === 0 ? 'up' : 'down';

  const card = document.createElement('article');
  card.className = 'chef-card';
  card.setAttribute('data-reveal', revealDirection);
  card.innerHTML = `
    <div class="chef-card-body">
      <div class="chef-card-header">
        <span class="chef-card-avatar">👨‍🍳</span>
        <div>
          <h3 class="chef-card-title">${displayName}</h3>
          <p class="chef-card-meta">${specialty}</p>
          <p class="chef-card-meta">📍 ${location}</p>
        </div>
      </div>
      <p class="chef-card-text">${bio}</p>
      <div class="chef-card-actions">
        <a class="btn btn-outline" href="/pages/public/chef-profile.html?id=${chef.id}">Ver perfil</a>
        <a class="btn btn-primary" href="/pages/public/request-quotation.html?chef_id=${chef.id}">Solicitar cotización</a>
      </div>
    </div>
  `;
  return card;
}

async function loadFilters() {
  try {
    const response = await api.get('/public/filters');
    const data = unwrap(response.data);

    const specialties = data?.specialties || [];
    const locations = data?.locations || [];

    specialties.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      specialtySelect.appendChild(option);
    });

    locations.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      locationSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load filters:', error);
  }
}

async function loadChefs() {
  try {
    loadingMessage.textContent = 'Cargando chefs...';
    loadingMessage.style.display = 'block';
    resultsCount.textContent = 'Mostrando chefs...';
    chefsGrid.innerHTML = '';

    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (specialtySelect.value) params.set('specialty', specialtySelect.value);
    if (locationSelect.value) params.set('location', locationSelect.value);

    const response = await api.get(`/public/chefs?${params.toString()}`);
    const data = unwrap(response.data);
    const chefs = data?.chefs || [];

    if (chefs.length === 0) {
      loadingMessage.textContent = 'No se encontraron chefs con esos filtros.';
      resultsCount.textContent = '0 chefs encontrados';
      return;
    }

    chefs.forEach((chef, index) => {
      chefsGrid.appendChild(createChefCard(chef, index));
    });

    loadingMessage.style.display = 'none';
    resultsCount.textContent = `${chefs.length} chef${chefs.length === 1 ? '' : 's'} encontrados`;

    if (window.SavoraReveal?.refresh) {
      window.SavoraReveal.refresh();
    }
  } catch (error) {
    console.error('Failed to load chefs:', error);
    loadingMessage.textContent = getErrorMessage(error);
  }
}

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadChefs();
});

clearFiltersButton.addEventListener('click', () => {
  searchInput.value = '';
  specialtySelect.value = '';
  locationSelect.value = '';
  loadChefs();
});

loadFilters().finally(() => loadChefs());
