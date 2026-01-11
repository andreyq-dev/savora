// frontend/scripts/views/login.js
import { login } from '../services/auth.js';
import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const submitButton = loginForm.querySelector('button');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.textContent = ''; // Clear previous errors
            submitButton.disabled = true;
            submitButton.textContent = 'Loading...';

            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const result = await login(username, password);
                console.log('Login successful:', result);

                // Decide next page before showing the dashboard.
                // If chef profile doesn't exist yet (404), send to onboarding.
                try {
                    await api.get('/chefs/profile');
                    window.location.href = '/pages/dashboard/overview.html';
                } catch (err) {
                    if (err?.response?.status === 404) {
                        window.location.href = '/pages/chef/onboarding.html';
                    } else {
                        // Non-profile-related errors: fallback to dashboard.
                        window.location.href = '/pages/dashboard/overview.html';
                    }
                }
            } catch (error) {
                console.error('Login failed:', error);
                const message = error?.message || error?.error || 'Login failed. Please check your credentials and try again.';
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        });
    }
});
