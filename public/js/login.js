// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    if (!credentials.username || !credentials.password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showToast(result.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    // Remove existing classes
    toast.className = 'fixed top-5 right-5 px-6 py-4 rounded-lg text-white font-medium z-50 transform translate-x-96 transition-transform duration-300 shadow-lg border-l-4';
    
    // Add type-specific classes
    if (type === 'success') {
        toast.classList.add('bg-gradient-to-r', 'from-green-500', 'to-green-600', 'border-green-400');
    } else if (type === 'error') {
        toast.classList.add('bg-gradient-to-r', 'from-red-500', 'to-red-600', 'border-red-400');
    } else {
        toast.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'border-blue-400');
    }
    
    // Show toast
    toast.classList.remove('translate-x-96');
    toast.classList.add('translate-x-0');
    
    setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-96');
    }, 3000);
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (show) {
        loadingSpinner.classList.remove('hidden');
        loadingSpinner.classList.add('flex');
    } else {
        loadingSpinner.classList.add('hidden');
        loadingSpinner.classList.remove('flex');
    }
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.click();
        }
    }
});

// Add form validation styling
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });

        input.addEventListener('focus', function() {
            this.classList.remove('error');
        });
    });
});
