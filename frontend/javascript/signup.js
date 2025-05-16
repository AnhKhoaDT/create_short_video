// signup.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const passwordInput = document.querySelector('input[type="password"]');
    const confirmPasswordInput = document.querySelectorAll('input[type="password"]')[1];
    const eyeIcons = document.querySelectorAll('.eye-icon');

    // Toggle password visibility
    eyeIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                this.textContent = '👁️';
            } else {
                passwordField.type = 'password';
                this.textContent = '👁️';
            }
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate password match
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Passwords do not match!');
            return;
        }

        // Prepare user data
        const userData = {
            username: form.querySelector('input[type="text"]').value,
            email: form.querySelector('input[type="email"]').value,
            password: passwordInput.value,
            phone: form.querySelector('input[type="tel"]').value,
            dob: form.querySelector('input[type="date"]').value,
           
        };

        try {
            // Call API
            console.log('Sending request to:', 'http://localhost:8080/create-video-service/users');
            console.log('Request body:', JSON.stringify(userData));

            const response = await fetch('http://localhost:8080/create-video-service/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Thêm Authorization header nếu cần
                    // 'Authorization': 'Bearer your_token_here'
                },
                body: JSON.stringify(userData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            const data = await response.json();
            console.log('Response body:', data);

            if (response.ok) {
                alert('Registration successful!');
                // Redirect to login page or dashboard
                window.location.href = 'login.html';
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred during registration');
        }
    });
});