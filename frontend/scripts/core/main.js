// frontend/scripts/core/main.js
import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
	const menuGrid = document.getElementById('featured-menus');
	const emptyState = document.getElementById('featured-menus-empty');

	if (!menuGrid || !emptyState) return;

	const unwrap = (payload) => payload?.data ?? payload;

	const menuImages = [
		'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'
	];

	const renderCard = (menu, index) => {
		const totalPrice = menu?.total_price ? `$${menu.total_price}` : '$0.00';
		const description = menu?.description || 'Menú personalizado creado por nuestros chefs.';
		const reveal = index % 2 === 0 ? 'up' : 'down';
		const firstDishPhoto = menu?.dishes?.[0]?.dish?.photo_url;
		const imageUrl = firstDishPhoto || menuImages[index % menuImages.length];
		const chefLink = menu?.chef_id
			? `/pages/public/chef-profile.html?id=${menu.chef_id}`
			: '/pages/public/chefs.html';

		return `
			<article class="public-menu-card" data-reveal="${reveal}">
				<img src="${imageUrl}" alt="Vista previa del menú">
				<div class="public-menu-card-body">
					<h3 class="public-menu-card-title">${menu.name}</h3>
					<div class="public-menu-card-price">${totalPrice} por persona</div>
					<p class="public-menu-card-text">${description}</p>
					<a href="${chefLink}" class="btn btn-outline">Ver chef</a>
				</div>
			</article>
		`;
	};

	try {
		emptyState.textContent = 'Loading menus...';
		const response = await api.get('/public/menus?per_page=3');
		const data = unwrap(response.data);
		const menus = data?.menus || [];

		if (!menus.length) {
			emptyState.textContent = 'Aún no hay menús destacados disponibles.';
			return;
		}

		menuGrid.innerHTML = menus.map(renderCard).join('');
		emptyState.style.display = 'none';

		if (window.SavoraReveal?.refresh) {
			window.SavoraReveal.refresh();
		}
	} catch (error) {
		console.error('Failed to load featured menus:', error);
		emptyState.textContent = 'No se pudieron cargar los menús destacados en este momento.';
	}
});
