// frontend/scripts/views/quotations.js
import api from '../services/api.js';
import { protectPage } from '../core/auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        if (!await protectPage()) return;

        const quotationsContainer = document.getElementById('quotations-container');
        const loadingMessage = document.getElementById('loading-message');
        const createBtn = document.getElementById('create-quotation-btn');
        const createModal = document.getElementById('create-quotation-modal');
        const closeCreateBtn = document.getElementById('create-quotation-close');
        const createForm = document.getElementById('create-quotation-form');
        const createError = document.getElementById('quotation-error');
        const clientSelect = document.getElementById('quotation-client');
        const menuSelect = document.getElementById('quotation-menu');
        const dishSelect = document.getElementById('quotation-dish');
        const itemNameInput = document.getElementById('quotation-item-name');
        const itemDescriptionInput = document.getElementById('quotation-item-description');
        const quantityInput = document.getElementById('quotation-quantity');
        const unitPriceInput = document.getElementById('quotation-unit-price');
        const filterTabs = document.querySelectorAll('.filter-tab');

        let currentFilter = 'all';

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

        async function fetchAndRenderQuotations(status = 'all') {
            try {
                loadingMessage.textContent = 'Loading quotations...';
                loadingMessage.style.display = 'block';
                quotationsContainer.innerHTML = '';

                const endpoint = status === 'all' ? '/quotations' : `/quotations?status=${status}`;
                const response = await api.get(endpoint);
                const quotations = response.data.data;

                if (quotations && quotations.length > 0) {
                    const table = document.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    
                    table.innerHTML = `
                        <thead>
                            <tr style="border-bottom:2px solid var(--color-gray-200);text-align:left;">
                                <th style="padding:var(--spacing-3);">Number</th>
                                <th style="padding:var(--spacing-3);">Client</th>
                                <th style="padding:var(--spacing-3);">Event Date</th>
                                <th style="padding:var(--spacing-3);">People</th>
                                <th style="padding:var(--spacing-3);">Total</th>
                                <th style="padding:var(--spacing-3);">Status</th>
                                <th style="padding:var(--spacing-3);">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="quotations-tbody"></tbody>
                    `;

                    const tbody = table.querySelector('#quotations-tbody');

                    quotations.forEach(q => {
                        const row = document.createElement('tr');
                        row.style.borderBottom = '1px solid var(--color-gray-100)';
                        
                        const statusBadges = {
                            'draft': '<span style="background:#e5e7eb;color:#374151;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;">Draft</span>',
                            'sent': '<span style="background:#dbeafe;color:#1e40af;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;">Sent</span>',
                            'accepted': '<span style="background:#d1fae5;color:#065f46;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;">Accepted</span>',
                            'rejected': '<span style="background:#fee2e2;color:#991b1b;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;">Rejected</span>',
                            'expired': '<span style="background:#fef3c7;color:#92400e;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;">Expired</span>'
                        };

                        const eventDate = q.event_date ? new Date(q.event_date).toLocaleDateString() : 'N/A';
                        
                        row.innerHTML = `
                            <td style="padding:var(--spacing-3);font-weight:600;">${q.quotation_number}</td>
                            <td style="padding:var(--spacing-3);">${q.client?.name || 'N/A'}</td>
                            <td style="padding:var(--spacing-3);">${eventDate}</td>
                            <td style="padding:var(--spacing-3);">${q.number_of_people || 'N/A'}</td>
                            <td style="padding:var(--spacing-3);font-weight:600;">$${q.total_price}</td>
                            <td style="padding:var(--spacing-3);">${statusBadges[q.status] || q.status}</td>
                            <td style="padding:var(--spacing-3);">
                                <button class="btn btn-outline btn-sm view-button" data-id="${q.id}">View</button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });

                    quotationsContainer.appendChild(table);
                    loadingMessage.style.display = 'none';
                } else {
                    loadingMessage.textContent = 'No quotations found. Create one to get started.';
                }
            } catch (error) {
                console.error('Failed to fetch quotations:', error);
                loadingMessage.textContent = getApiErrorMessage(error);
                loadingMessage.style.display = 'block';
            }
        }

        async function populateSelect(selectEl, items, placeholder) {
            selectEl.innerHTML = '';
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = placeholder;
            selectEl.appendChild(emptyOption);

            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                selectEl.appendChild(option);
            });
        }

        async function loadQuotationFormOptions() {
            try {
                const [clientsRes, menusRes, dishesRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/menus'),
                    api.get('/dishes')
                ]);

                const clients = clientsRes.data.data || [];
                const menus = menusRes.data.data || [];
                const dishes = dishesRes.data.data || [];

                await populateSelect(clientSelect, clients, 'Select client');
                await populateSelect(menuSelect, menus, 'Select menu');
                await populateSelect(dishSelect, dishes, 'Select dish');
            } catch (error) {
                console.error('Failed to load quotation form options:', error);
                createError.textContent = getApiErrorMessage(error);
                createError.style.display = 'block';
            }
        }

        async function handleCreateQuotation(event) {
            event.preventDefault();
            createError.textContent = '';
            createError.style.display = 'none';

            const quantityValue = Number(quantityInput.value || 0);
            const unitPriceValue = Number(unitPriceInput.value || 0);

            let itemName = itemNameInput.value.trim();
            if (!itemName && dishSelect.value) {
                itemName = dishSelect.options[dishSelect.selectedIndex].textContent.trim();
            }

            if (!itemName) {
                createError.textContent = 'Item name is required.';
                createError.style.display = 'block';
                return;
            }

            if (!quantityValue || !unitPriceValue) {
                createError.textContent = 'Quantity and unit price are required.';
                createError.style.display = 'block';
                return;
            }

            const payload = {
                client_id: clientSelect.value ? Number(clientSelect.value) : null,
                menu_id: menuSelect.value ? Number(menuSelect.value) : null,
                event_date: document.getElementById('quotation-event-date').value || null,
                number_of_people: document.getElementById('quotation-people').value ? Number(document.getElementById('quotation-people').value) : null,
                notes: document.getElementById('quotation-notes').value || null,
                terms_and_conditions: document.getElementById('quotation-terms').value || null,
                items: [
                    {
                        dish_id: dishSelect.value ? Number(dishSelect.value) : null,
                        item_name: itemName,
                        description: itemDescriptionInput.value || null,
                        quantity: quantityValue,
                        unit_price: unitPriceValue
                    }
                ]
            };

            try {
                await api.post('/quotations', payload);
                createForm.reset();
                createModal.style.display = 'none';
                fetchAndRenderQuotations(currentFilter);
            } catch (error) {
                console.error('Failed to create quotation:', error);
                createError.textContent = getApiErrorMessage(error);
                createError.style.display = 'block';
            }
        }

        function handleViewQuotation(quotationId) {
            window.location.href = `/pages/dashboard/quotation-detail.html?id=${quotationId}`;
        }

        quotationsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-button')) {
                handleViewQuotation(e.target.dataset.id);
            }
        });

        createBtn.addEventListener('click', async () => {
            createError.textContent = '';
            createError.style.display = 'none';
            createModal.style.display = 'block';
            await loadQuotationFormOptions();
        });

        closeCreateBtn.addEventListener('click', () => {
            createModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === createModal) {
                createModal.style.display = 'none';
            }
        });

        createForm.addEventListener('submit', handleCreateQuotation);

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.status;
                fetchAndRenderQuotations(currentFilter);
            });
        });

        fetchAndRenderQuotations(currentFilter);
    })();
});
