// frontend/scripts/views/public-request-quotation.js
import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const chefId = params.get('chef_id');

    const chefError = document.getElementById('chef-error');
    const formWrapper = document.getElementById('quotation-form-wrapper');
    const form = document.getElementById('quotation-form');
    const chefIdInput = document.getElementById('q-chef-id');
    const descriptionInput = document.getElementById('q-event-description');
    const charCount = document.querySelector('.char-count');
    const submitBtn = document.getElementById('quotation-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const errorDiv = document.getElementById('quotation-error');
    const successDiv = document.getElementById('quotation-success');

    // Validate chef_id from URL
    if (!chefId || isNaN(parseInt(chefId, 10))) {
        chefError.classList.remove('is-hidden');
        chefError.style.display = 'block';
        formWrapper.style.display = 'none';
        return;
    }

    chefIdInput.value = chefId;

    // Character counter for event description
    descriptionInput.addEventListener('input', () => {
        const count = descriptionInput.value.length;
        charCount.textContent = `${count}/2000 caracteres`;

        if (count > 1950) {
            charCount.style.color = '#dc2626';
        } else if (count > 1800) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6b7280';
        }
    });

    function getErrorMessage(error) {
        const payload = error?.response?.data;
        if (payload?.error?.message) return payload.error.message;
        if (typeof payload?.error === 'string') return payload.error;
        if (payload?.message) return payload.message;
        return error?.message || 'Error inesperado. Por favor intenta de nuevo.';
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('is-hidden');
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function enableForm() {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.classList.add('is-hidden');
        btnLoader.style.display = 'none';
        form.querySelectorAll('input, textarea').forEach((el) => (el.disabled = false));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous messages
        errorDiv.classList.add('is-hidden');
        errorDiv.style.display = 'none';
        successDiv.classList.add('is-hidden');
        successDiv.style.display = 'none';

        // Disable form while submitting
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.classList.remove('is-hidden');
        btnLoader.style.display = 'inline';
        form.querySelectorAll('input, textarea').forEach((el) => (el.disabled = true));

        const eventDescription = descriptionInput.value.trim();

        // Client-side validation
        if (eventDescription.length < 10) {
            showError('La descripción del evento debe tener al menos 10 caracteres.');
            enableForm();
            return;
        }
        if (eventDescription.length > 2000) {
            showError('La descripción no puede exceder 2000 caracteres.');
            enableForm();
            return;
        }

        const guestsRaw = document.getElementById('q-guests').value;
        const budgetRaw = document.getElementById('q-budget').value;
        const eventDateRaw = document.getElementById('q-event-date').value;

        const payload = {
            chef_id: parseInt(chefId, 10),
            name: document.getElementById('q-name').value.trim(),
            email: document.getElementById('q-email').value.trim(),
            phone: document.getElementById('q-phone').value.trim() || null,
            event_description: eventDescription,
            event_date: eventDateRaw || null,
            guests: guestsRaw ? parseInt(guestsRaw, 10) : null,
            budget: budgetRaw ? parseFloat(budgetRaw) : null,
        };

        try {
            await api.post('/public/quotations', payload);

            // Show success, hide form
            form.style.display = 'none';
            successDiv.classList.remove('is-hidden');
            successDiv.style.display = 'block';
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } catch (error) {
            console.error('Error submitting quotation request:', error);
            showError(getErrorMessage(error));
            enableForm();
        }
    });
});
