// frontend/scripts/views/menus.js
import api from '../services/api.js';
import { protectPage } from '../core/auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        if (!await protectPage()) return;

        const menusContainer = document.getElementById('menus-container');
        const addMenuForm = document.getElementById('add-menu-form');
        const errorMessage = document.getElementById('error-message');
        const loadingMessage = document.getElementById('loading-message');
        const submitButton = addMenuForm.querySelector('button[type="submit"]');
        const openCreateMenuButton = document.getElementById('open-create-menu');
        const createMenuModal = document.getElementById('create-menu-modal');
        const createMenuCloseButton = document.getElementById('create-menu-close');

        const editModal = document.getElementById('edit-menu-modal');
        const editMenuForm = document.getElementById('edit-menu-form');
        const closeButton = editModal.querySelector('.modal-close');
        const editErrorMessage = document.getElementById('edit-error-message');
        const editSubmitButton = editMenuForm.querySelector('button[type="submit"]');

        const openCreateDishesButton = document.getElementById('open-create-dishes');
        const createDishesSummary = document.getElementById('create-dishes-summary');

        const manageModal = document.getElementById('manage-dishes-modal');
        const manageCloseButton = document.getElementById('manage-dishes-close');
        const manageCancelButton = document.getElementById('manage-dishes-cancel');
        const manageSaveButton = document.getElementById('manage-dishes-save');
        const manageMenuIdInput = document.getElementById('manage-menu-id');
        const manageErrorMessage = document.getElementById('manage-dishes-error');
        const manageAvailableLoading = document.getElementById('manage-available-loading');
        const manageAvailable = document.getElementById('manage-available');
        const manageSelected = document.getElementById('manage-selected');
        const manageTitle = document.getElementById('manage-dishes-title');
        const availableFilter = document.getElementById('available-filter');

        let allDishes = [];
        let selectedDishIds = [];
        let createSelectedDishIds = [];
        let selectionMode = 'manage';
        let dragState = null;

        function getApiErrorMessage(error) {
            const payload = error?.response?.data;
            const message = payload?.message || payload?.error;
            const details = payload?.data;

            if (details && typeof details === 'object' && !Array.isArray(details)) {
                const detailText = Object.values(details).flat().join(' ').trim();
                if (detailText) {
                    return message ? `${message}: ${detailText}` : detailText;
                }
            }

            return message || 'An unexpected error occurred. Please try again.';
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        async function fetchAllDishes() {
            try {
                const response = await api.get('/dishes');
                allDishes = response.data.data || [];
            } catch (error) {
                console.error('Failed to fetch dishes:', error);
                allDishes = [];
            }
        }

        function getDishById(dishId) {
            return allDishes.find(d => Number(d.id) === Number(dishId));
        }

        function getActiveSelection() {
            return selectionMode === 'create' ? createSelectedDishIds : selectedDishIds;
        }

        function setActiveSelection(next) {
            if (selectionMode === 'create') {
                createSelectedDishIds = next;
                updateCreateSummary();
            } else {
                selectedDishIds = next;
            }
        }

        function updateCreateSummary() {
            const count = createSelectedDishIds.length;
            if (!count) {
                createDishesSummary.textContent = 'No dishes selected';
                return;
            }
            createDishesSummary.textContent = `${count} dish${count === 1 ? '' : 'es'} selected`;
        }

        function renderManageDishesModal() {
            manageErrorMessage.textContent = '';
            manageErrorMessage.style.display = 'none';

            const activeSelection = getActiveSelection();
            const selectedSet = new Set(activeSelection.map(Number));

            if (!activeSelection.length) {
                manageSelected.innerHTML = '<p class="helper-text" style="margin:0;">No dishes selected yet.</p>';
            } else {
                manageSelected.innerHTML = activeSelection.map((dishId, index) => {
                    const dish = getDishById(dishId);
                    const label = dish ? escapeHtml(dish.name) : `Dish #${dishId}`;
                    const price = dish?.price != null ? `$${dish.price}` : '';
                    return `
                        <div style="background:#fff; border:1px solid var(--color-gray-200); border-radius: var(--radius-md); padding: var(--spacing-3); margin: 0 0 var(--spacing-2) 0; cursor: move;" draggable="true" data-role="selected-item" data-id="${dishId}" data-index="${index}">
                            <div style="display:flex; align-items:center; gap: var(--spacing-2);">
                                <span style="min-width: 24px; color: var(--color-gray-600); font-weight:600;">${index + 1}</span>
                                <div style="flex:1; min-width: 0;">
                                    <div style="font-weight:600;">${label}</div>
                                    <div style="color: var(--color-gray-600); font-size: 0.875rem;">${escapeHtml(price)}</div>
                                </div>
                                <button class="btn btn-outline btn-sm" data-action="remove" data-id="${dishId}">Remove</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Available
            if (!allDishes.length) {
                manageAvailable.innerHTML = '<p class="helper-text" style="margin:0;">No dishes available.</p>';
                return;
            }

            const filterText = (availableFilter?.value || '').trim().toLowerCase();
            const sorted = [...allDishes]
                .filter(dish => !filterText || String(dish.name || '').toLowerCase().includes(filterText))
                .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

            manageAvailable.innerHTML = sorted.map(dish => {
                const isSelected = selectedSet.has(Number(dish.id));
                const price = dish.price != null ? `$${dish.price}` : '';
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap: var(--spacing-2); padding: 8px 6px; border-radius: var(--radius-md);" draggable="true" data-role="available-item" data-id="${dish.id}">
                        <div style="min-width: 0;">
                            <div style="font-weight:600;">${escapeHtml(dish.name)}</div>
                            <div style="color: var(--color-gray-600); font-size: 0.875rem;">${escapeHtml(price)}</div>
                        </div>
                        <button class="btn btn-outline btn-sm" data-action="add" data-id="${dish.id}" ${isSelected ? 'disabled' : ''}>
                            ${isSelected ? 'Added' : 'Add'}
                        </button>
                    </div>
                `;
            }).join('');
        }

        async function fetchAndRenderMenus() {
            try {
                loadingMessage.textContent = 'Loading menus...';
                menusContainer.innerHTML = '';

                const response = await api.get('/menus');
                const menus = response.data.data;

                if (menus && menus.length > 0) {
                    menus.forEach(menu => {
                        const card = document.createElement('div');
                        card.className = 'card menu-card';
                        card.id = `menu-card-${menu.id}`;
                        
                        const statusClass = `status-badge ${menu.status || 'draft'}`;

                        card.innerHTML = `
                            <div class="card-body">
                                <div class="menu-card-header">
                                    <div>
                                        <h4 class="menu-card-title">${menu.name}</h4>
                                        <p class="menu-card-description">${menu.description || 'No description'}</p>
                                    </div>
                                    <span class="${statusClass}">${menu.status || 'draft'}</span>
                                </div>
                                <div class="menu-card-meta">
                                    <span>🍽️ ${menu.dish_count || 0} dishes</span>
                                    <span>💰 $${menu.total_price || '0.00'}</span>
                                </div>
                                <div class="menu-card-actions">
                                    <button class="btn btn-outline edit-button" data-id="${menu.id}">Edit</button>
                                    <button class="btn btn-outline delete-button" data-id="${menu.id}">Delete</button>
                                    <button class="btn btn-primary manage-dishes-button" data-id="${menu.id}">Manage Dishes</button>
                                </div>
                            </div>
                        `;
                        menusContainer.appendChild(card);
                    });
                    loadingMessage.style.display = 'none';
                } else {
                    loadingMessage.textContent = 'No menus found. Use "New Menu" to create one.';
                }
            } catch (error) {
                console.error('Failed to fetch menus:', error);
                loadingMessage.textContent = getApiErrorMessage(error);
                loadingMessage.style.display = 'block';
            }
        }

        async function handleAddMenu(event) {
            event.preventDefault();
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
            submitButton.disabled = true;
            submitButton.textContent = 'Creating...';

            const selected = createSelectedDishIds.slice();

            const menuData = {
                name: addMenuForm.name.value,
                description: addMenuForm.description.value,
                status: addMenuForm.status.value,
                dish_ids: selected
            };

            try {
                await api.post('/menus', menuData);
                addMenuForm.reset();
                createSelectedDishIds = [];
                updateCreateSummary();
                createMenuModal.style.display = 'none';
                fetchAndRenderMenus();
            } catch (error) {
                console.error('Failed to add menu:', error);
                errorMessage.textContent = getApiErrorMessage(error);
                errorMessage.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Create Menu';
            }
        }

        async function openEditModal(menuId) {
            try {
                const response = await api.get(`/menus/${menuId}`);
                const menu = response.data.data;

                editMenuForm['edit-menu-id'].value = menu.id;
                editMenuForm['edit-menu-name'].value = menu.name;
                editMenuForm['edit-menu-description'].value = menu.description || '';
                editMenuForm['edit-menu-status'].value = menu.status;

                createMenuModal.style.display = 'none';
                editModal.style.display = 'flex';
            } catch (error) {
                console.error(`Failed to fetch menu ${menuId}:`, error);
                alert(getApiErrorMessage(error));
            }
        }

        async function handleUpdateMenu(event) {
            event.preventDefault();
            editErrorMessage.textContent = '';
            editErrorMessage.style.display = 'none';
            editSubmitButton.disabled = true;
            editSubmitButton.textContent = 'Saving...';

            const menuId = editMenuForm['edit-menu-id'].value;
            const menuData = {
                name: editMenuForm['edit-menu-name'].value,
                description: editMenuForm['edit-menu-description'].value,
                status: editMenuForm['edit-menu-status'].value,
            };

            try {
                await api.put(`/menus/${menuId}`, menuData);
                editModal.style.display = 'none';
                fetchAndRenderMenus();
            } catch (error) {
                console.error(`Failed to update menu ${menuId}:`, error);
                editErrorMessage.textContent = getApiErrorMessage(error);
                editErrorMessage.style.display = 'block';
            } finally {
                editSubmitButton.disabled = false;
                editSubmitButton.textContent = 'Save Changes';
            }
        }

        async function handleCardClick(event) {
            const target = event.target;
            if (target.classList.contains('edit-button')) {
                openEditModal(target.dataset.id);
            } else if (target.classList.contains('delete-button')) {
                const menuId = target.dataset.id;
                const menuCard = target.closest('.card');
                const menuName = menuCard?.querySelector('h4')?.textContent || 'this menu';

                if (confirm(`Are you sure you want to delete "${menuName}"?`)) {
                    try {
                        await api.delete(`/menus/${menuId}`);
                        fetchAndRenderMenus();
                    } catch (error) {
                        console.error(`Failed to delete menu ${menuId}:`, error);
                        alert(getApiErrorMessage(error));
                    }
                }
            } else if (target.classList.contains('manage-dishes-button')) {
                const menuId = target.dataset.id;
                await openManageDishesModal(menuId);
            }
        }

        async function openManageDishesModal(menuId) {
            editModal.style.display = 'none';
            createMenuModal.style.display = 'none';
            selectionMode = 'manage';
            manageTitle.textContent = 'Manage Menu Dishes';
            manageMenuIdInput.value = String(menuId);
            manageErrorMessage.textContent = '';
            manageErrorMessage.style.display = 'none';

            manageAvailableLoading.style.display = 'block';
            manageAvailable.innerHTML = '';
            manageSelected.innerHTML = '';
            manageSaveButton.disabled = true;
            manageSaveButton.textContent = 'Loading...';

            // Ensure we have dish catalog
            if (!allDishes.length) {
                await fetchAllDishes();
            }

            try {
                const response = await api.get(`/menus/${menuId}`);
                const menu = response.data.data;
                const menuDishes = Array.isArray(menu?.dishes) ? menu.dishes : [];
                selectedDishIds = menuDishes
                    .slice()
                    .sort((a, b) => Number(a.order_position ?? 0) - Number(b.order_position ?? 0))
                    .map(d => Number(d.dish_id))
                    .filter(Number.isFinite);

                manageModal.style.display = 'flex';
                manageAvailableLoading.style.display = 'none';
                manageSaveButton.disabled = false;
                manageSaveButton.textContent = 'Save';

                renderManageDishesModal();
            } catch (error) {
                console.error(`Failed to fetch menu ${menuId} for dish management:`, error);
                manageAvailableLoading.style.display = 'none';
                manageSaveButton.disabled = false;
                manageSaveButton.textContent = 'Save';
                manageErrorMessage.textContent = getApiErrorMessage(error);
                manageErrorMessage.style.display = 'block';
                manageModal.style.display = 'flex';
                renderManageDishesModal();
            }
        }

        async function openCreateDishesModal() {
            selectionMode = 'create';
            manageTitle.textContent = 'Select Dishes for Menu';
            manageMenuIdInput.value = '';
            manageErrorMessage.textContent = '';
            manageErrorMessage.style.display = 'none';
            manageAvailableLoading.style.display = 'block';
            manageAvailable.innerHTML = '';
            manageSelected.innerHTML = '';
            manageSaveButton.disabled = true;
            manageSaveButton.textContent = 'Loading...';

            if (!allDishes.length) {
                await fetchAllDishes();
            }

            manageModal.style.display = 'flex';
            manageAvailableLoading.style.display = 'none';
            manageSaveButton.disabled = false;
            manageSaveButton.textContent = 'Save';
            renderManageDishesModal();
        }

        function closeManageDishesModal() {
            manageModal.style.display = 'none';
            manageMenuIdInput.value = '';
            if (selectionMode === 'manage') {
                selectedDishIds = [];
            }
        }

        function removeSelectedDish(dishId) {
            const id = Number(dishId);
            const next = getActiveSelection().filter(x => Number(x) !== id);
            setActiveSelection(next);
            renderManageDishesModal();
        }

        function addSelectedDish(dishId) {
            const id = Number(dishId);
            if (!Number.isFinite(id)) return;
            const active = getActiveSelection();
            if (active.some(x => Number(x) === id)) return;
            setActiveSelection([...active, id]);
            renderManageDishesModal();
        }

        function reorderSelected(dishId, targetIndex) {
            const id = Number(dishId);
            const active = getActiveSelection();
            const fromIndex = active.findIndex(x => Number(x) === id);
            if (fromIndex < 0) return;
            const next = active.slice();
            const [moved] = next.splice(fromIndex, 1);
            const safeIndex = Math.max(0, Math.min(targetIndex, next.length));
            next.splice(safeIndex, 0, moved);
            setActiveSelection(next);
            renderManageDishesModal();
        }

        async function saveManageDishes() {
            if (selectionMode === 'create') {
                closeManageDishesModal();
                return;
            }

            const menuId = manageMenuIdInput.value;
            if (!menuId) return;

            manageErrorMessage.textContent = '';
            manageErrorMessage.style.display = 'none';
            manageSaveButton.disabled = true;
            manageSaveButton.textContent = 'Saving...';

            try {
                const payload = {
                    dishes: selectedDishIds.map((dishId, index) => ({
                        dish_id: Number(dishId),
                        order_position: index
                    }))
                };
                await api.put(`/menus/${menuId}/dishes`, payload);
                closeManageDishesModal();
                fetchAndRenderMenus();
            } catch (error) {
                console.error(`Failed to assign dishes for menu ${menuId}:`, error);
                manageErrorMessage.textContent = getApiErrorMessage(error);
                manageErrorMessage.style.display = 'block';
            } finally {
                manageSaveButton.disabled = false;
                manageSaveButton.textContent = 'Save';
            }
        }

        addMenuForm.addEventListener('submit', handleAddMenu);
        editMenuForm.addEventListener('submit', handleUpdateMenu);
        menusContainer.addEventListener('click', handleCardClick);
        openCreateMenuButton.addEventListener('click', () => {
            editModal.style.display = 'none';
            manageModal.style.display = 'none';
            createMenuModal.style.display = 'flex';
        });
        createMenuCloseButton.addEventListener('click', () => {
            createMenuModal.style.display = 'none';
        });

        manageAvailable.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const action = target.dataset.action;
            const id = target.dataset.id;
            if (action === 'add') {
                addSelectedDish(id);
            }
        });

        manageSelected.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const action = target.dataset.action;
            const id = target.dataset.id;
            if (!action || !id) return;

            if (action === 'remove') removeSelectedDish(id);
        });

        manageAvailable.addEventListener('dragstart', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const item = target.closest('[data-role="available-item"]');
            if (!item) return;
            const dishId = item.dataset.id;
            if (!dishId) return;
            dragState = { source: 'available', dishId: Number(dishId) };
            event.dataTransfer?.setData('text/plain', String(dishId));
        });

        manageSelected.addEventListener('dragstart', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const item = target.closest('[data-role="selected-item"]');
            if (!item) return;
            const dishId = item.dataset.id;
            const index = item.dataset.index;
            if (!dishId) return;
            dragState = { source: 'selected', dishId: Number(dishId), index: Number(index) };
            event.dataTransfer?.setData('text/plain', String(dishId));
        });

        manageSelected.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        manageAvailable.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        manageSelected.addEventListener('drop', (event) => {
            event.preventDefault();
            if (!dragState) return;

            const target = event.target instanceof HTMLElement ? event.target : null;
            const targetItem = target?.closest('[data-role="selected-item"]');
            const targetIndex = targetItem ? Number(targetItem.dataset.index) : getActiveSelection().length;

            if (dragState.source === 'available') {
                addSelectedDish(dragState.dishId);
                if (targetItem) {
                    reorderSelected(dragState.dishId, targetIndex);
                }
            } else if (dragState.source === 'selected') {
                reorderSelected(dragState.dishId, targetIndex);
            }
            dragState = null;
        });

        manageAvailable.addEventListener('drop', (event) => {
            event.preventDefault();
            if (!dragState) return;
            if (dragState.source === 'selected') {
                removeSelectedDish(dragState.dishId);
            }
            dragState = null;
        });

        manageSaveButton.addEventListener('click', saveManageDishes);
        manageCancelButton.addEventListener('click', closeManageDishesModal);
        manageCloseButton.addEventListener('click', closeManageDishesModal);
        openCreateDishesButton.addEventListener('click', openCreateDishesModal);
        availableFilter.addEventListener('input', renderManageDishesModal);

        closeButton.addEventListener('click', () => editModal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target == editModal) {
                editModal.style.display = 'none';
            }
            if (event.target == createMenuModal) {
                createMenuModal.style.display = 'none';
            }
            if (event.target == manageModal) {
                closeManageDishesModal();
            }
        });

        await fetchAllDishes();
        updateCreateSummary();
        fetchAndRenderMenus();
    })();
});
