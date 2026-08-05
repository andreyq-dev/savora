/**
 * Public Chef Profile View
 * Displays chef profile and handles contact form submission
 */

import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorText = document.getElementById('error-text');
    const chefContent = document.getElementById('chef-content');

    // Get chef ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const chefId = urlParams.get('id');

    if (!chefId) {
        showError('No se especificó ID de chef');
        return;
    }

    function unwrap(payload) {
        // Supports both raw responses and Envelope v1 {success, message, data}
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

    try {
        // Fetch chef profile
        const response = await api.get(`/public/chefs/${chefId}`);
        const payload = unwrap(response.data);
        const chef = payload?.chef ?? payload;
        const dishes = payload?.dishes ?? [];
        const stats = payload?.stats ?? {
            total_menus: 0,
            total_dishes: dishes.length
        };

        // Hide loading, show content
        loadingState.style.display = 'none';
        chefContent.classList.remove('is-hidden');
        chefContent.style.display = 'block';

        // Render chef profile
        renderChefProfile(chef, stats);

        // Load paginated menus
        await loadChefMenus(stats);

        // Initialize contact form
        initContactForm(chef);

    } catch (error) {
        console.error('Error fetching chef profile:', error);
        const message = getErrorMessage(error) || 'Error al cargar el perfil del chef';
        showError(message);
    }

    function showError(message) {
        loadingState.style.display = 'none';
        errorState.classList.remove('is-hidden');
        errorState.style.display = 'block';
        errorText.textContent = message;
    }

    function renderChefProfile(chef, stats) {
        // Chef name
        const displayName = chef?.name || chef?.user?.username || 'Chef';
        document.getElementById('chef-name').textContent = displayName;

        // Chef specialty
        document.getElementById('chef-specialty').textContent = chef.specialty || 'Especialidad Culinaria';

        // Chef location
        if (chef.location) {
            document.getElementById('chef-location').textContent = `📍 ${chef.location}`;
        } else {
            document.getElementById('chef-location').style.display = 'none';
        }

        // Biography
        if (chef.bio) {
            const bioSection = document.getElementById('bio-section');
            bioSection.classList.remove('is-hidden');
            bioSection.style.display = 'block';
            document.getElementById('chef-bio').textContent = chef.bio;
        }

        const statsContainer = document.getElementById('chef-stats');
        if (statsContainer) {
            const totalMenus = stats?.total_menus ?? 0;
            const totalDishes = stats?.total_dishes ?? 0;
            statsContainer.innerHTML = `
                <span class="chef-profile-stat">${totalMenus} menú${totalMenus === 1 ? '' : 's'} publicados</span>
                <span class="chef-profile-stat">${totalDishes} plato${totalDishes === 1 ? '' : 's'} en el catálogo</span>
            `;
        }

        // Quotation CTA in hero
        const heroActions = document.getElementById('chef-hero-actions');
        if (heroActions) {
            heroActions.innerHTML = `
                <a class="btn btn-primary" href="/pages/public/request-quotation.html?chef_id=${chefId}">Solicitar cotización</a>
                <a class="btn btn-outline" href="#contact-section">Enviar mensaje</a>
            `;
        }

        // Update page title
        document.title = `${displayName} - Savora`;

        if (window.SavoraReveal?.refresh) {
            window.SavoraReveal.refresh();
        }
    }

    function createMenuCard(menu, index) {
        const menuImages = [
            'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'
        ];
        const description = menu?.description || 'Menú personalizado para experiencias memorables.';
        const dishCount = menu?.dish_count ?? menu?.dishes?.length ?? 0;
        const totalPrice = menu?.total_price ? `$${menu.total_price}` : 'Precio a convenir';
        const firstDishPhoto = menu?.dishes?.[0]?.dish?.photo_url;
        const imageUrl = firstDishPhoto || menuImages[index % menuImages.length];
        const highlightDishes = (menu?.dishes || [])
            .map((item) => item?.dish?.name)
            .filter(Boolean)
            .slice(0, 3)
            .join(' · ');

        return `
            <article class="public-menu-card" data-reveal="up">
                <img src="${imageUrl}" alt="Vista previa del menú">
                <div class="public-menu-card-body">
                    <h3 class="public-menu-card-title">${menu.name}</h3>
                    <div class="public-menu-card-price">${totalPrice} total · ${dishCount} plato${dishCount === 1 ? '' : 's'}</div>
                    <p class="public-menu-card-text">${description}</p>
                    ${highlightDishes ? `<p class="public-menu-card-text">${highlightDishes}</p>` : ''}
                    <a class="btn btn-outline" href="#contact-section">Contactar al chef</a>
                    <a class="btn btn-primary" href="/pages/public/request-quotation.html?chef_id=${chefId}">Solicitar cotización</a>
                </div>
            </article>
        `;
    }

    async function loadChefMenus(stats) {
        const menusGrid = document.getElementById('chef-menus-grid');
        const menusEmpty = document.getElementById('chef-menus-empty');
        const loadMoreButton = document.getElementById('chef-menus-load-more');

        if (!menusGrid || !menusEmpty || !loadMoreButton) return;

        let page = 1;
        let totalPages = 1;
        let isLoading = false;

        const fetchPage = async () => {
            if (isLoading) return;
            isLoading = true;

            try {
                const response = await api.get(`/public/chefs/${chefId}/menus?page=${page}&per_page=6`);
                const data = unwrap(response.data);
                const menus = data?.menus ?? [];
                const pagination = data?.pagination ?? {};

                totalPages = pagination.total_pages ?? totalPages;

                if (!menus.length && page === 1) {
                    menusEmpty.textContent = 'Este chef aún no ha publicado menús. Escríbele para crear uno a tu medida.';
                    loadMoreButton.classList.add('is-hidden');
                    return;
                }

                menusEmpty.style.display = 'none';

                const offsetIndex = (page - 1) * 6;
                menusGrid.insertAdjacentHTML(
                    'beforeend',
                    menus.map((menu, index) => createMenuCard(menu, offsetIndex + index)).join('')
                );

                if (page >= totalPages) {
                    loadMoreButton.classList.add('is-hidden');
                } else {
                    loadMoreButton.classList.remove('is-hidden');
                }

                if (window.SavoraReveal?.refresh) {
                    window.SavoraReveal.refresh();
                }
            } catch (error) {
                console.error('Error fetching chef menus:', error);
                if (page === 1) {
                    menusEmpty.textContent = getErrorMessage(error) || 'No se pudieron cargar los menús.';
                }
            } finally {
                isLoading = false;
            }
        };

        loadMoreButton.addEventListener('click', () => {
            if (page < totalPages) {
                page += 1;
                fetchPage();
            }
        });

        await fetchPage();
    }

    function initContactForm(chef) {
        const form = document.getElementById('contact-form');
        const messageInput = document.getElementById('contact-message');
        const charCount = document.querySelector('.char-count');
        const submitBtn = document.getElementById('contact-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const errorDiv = document.getElementById('contact-error');
        const successDiv = document.getElementById('contact-success');

        // Character counter
        messageInput.addEventListener('input', () => {
            const count = messageInput.value.length;
            charCount.textContent = `${count}/2000 caracteres`;

            // Visual feedback
            if (count > 1950) {
                charCount.style.color = '#dc2626';
            } else if (count > 1800) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#6b7280';
            }
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Hide previous messages
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            // Disable form
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';

            // Disable all inputs
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => input.disabled = true);

            const formData = {
                chef_id: parseInt(chefId),
                name: document.getElementById('contact-name').value.trim(),
                email: document.getElementById('contact-email').value.trim(),
                phone: document.getElementById('contact-phone').value.trim() || null,
                message: messageInput.value.trim()
            };

            // Client-side validation
            if (formData.message.length < 10) {
                showFormError('El mensaje debe tener al menos 10 caracteres');
                enableForm();
                return;
            }

            if (formData.message.length > 2000) {
                showFormError('El mensaje no puede exceder 2000 caracteres');
                enableForm();
                return;
            }

            try {
                await api.post('/public/contact', formData);

                // Success
                successDiv.style.display = 'block';
                form.reset();
                charCount.textContent = '0/2000 caracteres';

                // Scroll to success message
                successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Re-enable form after success
                setTimeout(() => {
                    enableForm();
                }, 1000);

            } catch (error) {
                console.error('Error sending contact message:', error);

                let message = 'Error al enviar mensaje. Por favor intenta de nuevo.';

                message = getErrorMessage(error) || message;

                showFormError(message);
                enableForm();
            }
        });

        function showFormError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function enableForm() {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';

            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => input.disabled = false);
        }
    }
});
