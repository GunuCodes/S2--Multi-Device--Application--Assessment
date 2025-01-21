const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : '/api';

// Make API calls with CORS headers.
async function makeAPICall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            mode: 'cors',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        
        return response;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Switch between login and register forms.
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
}

// Handle user login.
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await makeAPICall(`${API_URL}/users/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token and user info in local storage.
        localStorage.setItem('token', data.token);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Stored user data:', data.user); // Debug log
        }

        // Redirect to main page.
        window.location.href = '/index.html';
    } catch (error) {
        showError(error.message);
    }
}

// Handle user registration.
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await makeAPICall(`${API_URL}/users/register`, {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Store token and user info in local storage.
        localStorage.setItem('token', data.token);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Stored user data:', data.user); // Debug log
        }

        // Redirect to main page.
        window.location.href = '/index.html';
    } catch (error) {
        showError(error.message);
    }
}

// Display error message to the user.
function showError(message) {
    // Remove any existing error messages.
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create and show new error message.
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const activeForm = document.querySelector('.auth-form:not(.hidden)');
    activeForm.insertBefore(errorDiv, activeForm.querySelector('form'));

    // Remove error after 3 seconds.
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
} 