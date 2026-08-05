// frontend/scripts/views/appointments.js
import api from '../services/api.js';
import { protectPage } from '../core/auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        if (!await protectPage()) return;

        const appointmentsTableBody = document.getElementById('appointments-table-body');
        const loadingMessage = document.getElementById('appointments-loading');
        const filterForm = document.getElementById('appointments-filter-form');
        const filterStatus = document.getElementById('filter-status');
        const filterStart = document.getElementById('filter-start');
        const filterEnd = document.getElementById('filter-end');
        const filterUpcoming = document.getElementById('filter-upcoming');
        const filterDays = document.getElementById('filter-days');

        const createModal = document.getElementById('create-appointment-modal');
        const createButton = document.getElementById('create-appointment-btn');
        const createCloseButton = document.getElementById('create-appointment-close');
        const createForm = document.getElementById('create-appointment-form');
        const createError = document.getElementById('appointment-error');

        const editModal = document.getElementById('edit-appointment-modal');
        const editCloseButton = document.getElementById('edit-appointment-close');
        const editForm = document.getElementById('edit-appointment-form');
        const editError = document.getElementById('edit-appointment-error');

        const createClientSelect = document.getElementById('appointment-client');
        const editClientSelect = document.getElementById('edit-appointment-client');

        let clients = [];

        function unwrap(payload) {
            if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
                return payload.data;
            }
            return payload;
        }

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

        function formatDateTime(value) {
            if (!value) return '';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleString();
        }

        function formatDuration(minutes) {
            if (!minutes) return '—';
            return `${minutes} min`;
        }

        function toLocalDateTimeInput(value) {
            if (!value) return '';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return '';
            const pad = (num) => String(num).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }

        function buildStatusBadge(status) {
            const safe = status || 'scheduled';
            return `<span class="status-badge ${safe}">${safe.replace('_', ' ')}</span>`;
        }

        function renderAppointments(appointments) {
            appointmentsTableBody.innerHTML = '';

            if (!appointments.length) {
                loadingMessage.textContent = 'No appointments found. Create one to get started.';
                loadingMessage.style.display = 'block';
                return;
            }

            appointments.forEach((appointment) => {
                const row = document.createElement('tr');
                row.dataset.id = appointment.id;
                const clientName = appointment?.client?.name || clients.find(c => Number(c.id) === Number(appointment.client_id))?.name || '—';
                const status = appointment.status || 'scheduled';
                const scheduled = formatDateTime(appointment.scheduled_at);
                row.innerHTML = `
                    <td>
                        <div style="font-weight:600;">${appointment.title || 'Appointment'}</div>
                        <div style="color: var(--color-gray-600); font-size: 0.875rem;">${appointment.location || 'No location'}</div>
                    </td>
                    <td>${clientName}</td>
                    <td>
                        <div>${scheduled}</div>
                        <div style="color: var(--color-gray-600); font-size: 0.875rem;">Ends ${formatDateTime(appointment.end_time)}</div>
                    </td>
                    <td>${formatDuration(appointment.duration_minutes)}</td>
                    <td>${buildStatusBadge(status)}</td>
                    <td>
                        <div style="display:flex; gap: var(--spacing-2); flex-wrap: wrap;">
                            <button class="btn btn-outline btn-sm" data-action="edit">Edit</button>
                            <button class="btn btn-outline btn-sm" data-action="ics" title="Download calendar file">📅 .ics</button>
                            <button class="btn btn-outline btn-sm" data-action="delete">Delete</button>
                        </div>
                        <div style="display:flex; gap: var(--spacing-2); margin-top: var(--spacing-2);">
                            <select class="appointment-status-select" style="min-width: 140px;">
                                <option value="scheduled" ${status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                                <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                <option value="no_show" ${status === 'no_show' ? 'selected' : ''}>No show</option>
                            </select>
                            <button class="btn btn-outline btn-sm" data-action="status">Update</button>
                        </div>
                    </td>
                `;
                appointmentsTableBody.appendChild(row);
            });

            loadingMessage.style.display = 'none';
        }

        async function fetchClients() {
            try {
                const response = await api.get('/clients');
                clients = unwrap(response.data) || [];
                populateClientSelect(createClientSelect);
                populateClientSelect(editClientSelect);
            } catch (error) {
                console.error('Failed to fetch clients:', error);
                clients = [];
            }
        }

        function populateClientSelect(selectEl) {
            if (!selectEl) return;
            const currentValue = selectEl.value;
            selectEl.innerHTML = '<option value="">No client</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                selectEl.appendChild(option);
            });
            if (currentValue) selectEl.value = currentValue;
        }

        async function fetchAppointments() {
            try {
                loadingMessage.textContent = 'Loading appointments...';
                loadingMessage.style.display = 'block';

                const params = new URLSearchParams();
                if (filterStatus.value) params.set('status', filterStatus.value);
                if (filterUpcoming.checked) {
                    params.set('upcoming', 'true');
                    if (filterDays.value) params.set('days', filterDays.value);
                } else {
                    if (filterStart.value) params.set('start_date', new Date(filterStart.value).toISOString());
                    if (filterEnd.value) {
                        const endDate = new Date(filterEnd.value);
                        endDate.setHours(23, 59, 59, 999);
                        params.set('end_date', endDate.toISOString());
                    }
                }

                const response = await api.get(`/appointments?${params.toString()}`);
                const appointments = unwrap(response.data) || [];
                renderAppointments(appointments);
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
                loadingMessage.textContent = getApiErrorMessage(error);
                loadingMessage.style.display = 'block';
            }
        }

        async function handleCreateAppointment(event) {
            event.preventDefault();
            createError.style.display = 'none';

            const payload = {
                client_id: createClientSelect.value ? Number(createClientSelect.value) : null,
                title: createForm['title'].value.trim(),
                description: createForm['description'].value.trim() || null,
                scheduled_at: new Date(createForm['scheduled_at'].value).toISOString(),
                duration_minutes: createForm['duration_minutes'].value ? Number(createForm['duration_minutes'].value) : null,
                location: createForm['location'].value.trim() || null,
                meeting_url: createForm['meeting_url'].value.trim() || null,
                notes: createForm['notes'].value.trim() || null
            };

            try {
                await api.post('/appointments', payload);
                createForm.reset();
                createModal.style.display = 'none';
                fetchAppointments();
            } catch (error) {
                console.error('Failed to create appointment:', error);
                createError.textContent = getApiErrorMessage(error);
                createError.style.display = 'block';
            }
        }

        async function openEditModal(appointmentId) {
            editError.style.display = 'none';
            try {
                const response = await api.get(`/appointments/${appointmentId}`);
                const appointment = unwrap(response.data);

                editForm['id'].value = appointment.id;
                editForm['title'].value = appointment.title || '';
                editForm['description'].value = appointment.description || '';
                editForm['scheduled_at'].value = toLocalDateTimeInput(appointment.scheduled_at);
                editForm['duration_minutes'].value = appointment.duration_minutes || '';
                editForm['location'].value = appointment.location || '';
                editForm['meeting_url'].value = appointment.meeting_url || '';
                editForm['notes'].value = appointment.notes || '';
                editClientSelect.value = appointment.client_id || '';

                editModal.style.display = 'flex';
            } catch (error) {
                console.error('Failed to load appointment:', error);
                alert(getApiErrorMessage(error));
            }
        }

        async function handleUpdateAppointment(event) {
            event.preventDefault();
            editError.style.display = 'none';

            const appointmentId = editForm['id'].value;
            const payload = {
                client_id: editClientSelect.value ? Number(editClientSelect.value) : null,
                title: editForm['title'].value.trim(),
                description: editForm['description'].value.trim() || null,
                scheduled_at: new Date(editForm['scheduled_at'].value).toISOString(),
                duration_minutes: editForm['duration_minutes'].value ? Number(editForm['duration_minutes'].value) : null,
                location: editForm['location'].value.trim() || null,
                meeting_url: editForm['meeting_url'].value.trim() || null,
                notes: editForm['notes'].value.trim() || null
            };

            try {
                await api.put(`/appointments/${appointmentId}`, payload);
                editModal.style.display = 'none';
                fetchAppointments();
            } catch (error) {
                console.error('Failed to update appointment:', error);
                editError.textContent = getApiErrorMessage(error);
                editError.style.display = 'block';
            }
        }

        async function handleUpdateStatus(appointmentId, status) {
            try {
                await api.patch(`/appointments/${appointmentId}/status`, { status });
                fetchAppointments();
            } catch (error) {
                console.error('Failed to update status:', error);
                alert(getApiErrorMessage(error));
            }
        }

        async function handleDeleteAppointment(appointmentId) {
            if (!confirm('Are you sure you want to delete this appointment?')) return;
            try {
                await api.delete(`/appointments/${appointmentId}`);
                fetchAppointments();
            } catch (error) {
                console.error('Failed to delete appointment:', error);
                alert(getApiErrorMessage(error));
            }
        }

        async function handleDownloadIcs(appointmentId, title) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/appointments/${appointmentId}/calendar.ics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `appointment-${title || appointmentId}.ics`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Failed to download ICS:', error);
                alert('Could not download calendar file. Please try again.');
            }
        }

        appointmentsTableBody.addEventListener('click', (event) => {
            const action = event.target?.dataset?.action;
            if (!action) return;
            const row = event.target.closest('tr');
            const appointmentId = row?.dataset?.id;
            if (!appointmentId) return;

            if (action === 'edit') {
                openEditModal(appointmentId);
            }

            if (action === 'delete') {
                handleDeleteAppointment(appointmentId);
            }

            if (action === 'status') {
                const select = row.querySelector('.appointment-status-select');
                handleUpdateStatus(appointmentId, select.value);
            }

            if (action === 'ics') {
                const title = row.querySelector('td div[style*="font-weight"]')?.textContent?.trim();
                handleDownloadIcs(appointmentId, title);
            }
        });

        filterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            fetchAppointments();
        });

        createButton.addEventListener('click', () => {
            createError.style.display = 'none';
            createModal.style.display = 'flex';
        });

        createCloseButton.addEventListener('click', () => createModal.style.display = 'none');
        editCloseButton.addEventListener('click', () => editModal.style.display = 'none');

        window.addEventListener('click', (event) => {
            if (event.target === createModal) {
                createModal.style.display = 'none';
            }
            if (event.target === editModal) {
                editModal.style.display = 'none';
            }
        });

        createForm.addEventListener('submit', handleCreateAppointment);
        editForm.addEventListener('submit', handleUpdateAppointment);

        await fetchClients();
        fetchAppointments();
    })();
});
