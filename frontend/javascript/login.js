document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const passwordInput = document.querySelector('input[type="password"]');
    const eyeIcon = document.querySelector('.eye-icon');

    // Toggle password visibility
    eyeIcon.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.textContent = '👁️‍🗨️'; // Icon khi hiển thị
        } else {
            passwordInput.type = 'password';
            this.textContent = '👁️'; // Icon khi ẩn
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Prepare user data for login
        const userData = {
            username: form.querySelector('input[type="username"]').value,
            password: passwordInput.value
        };

        try {
            // Call API
            console.log('Sending request to:', 'http://localhost:8080/create-video-service/auth/log-in');
            console.log('Request body:', JSON.stringify(userData));

            const response = await fetch('http://localhost:8080/create-video-service/auth/log-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Thêm Authorization header nếu cần (ví dụ: token từ lần đăng nhập trước)
                    // 'Authorization': 'Bearer your_token_here'
                },
                body: JSON.stringify(userData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            const data = await response.json();
            console.log('Response body:', data);

            if (response.ok) {
                // Lưu token vào localStorage
                localStorage.setItem('token', data.data.token);
                alert('Login successful!');
               console.log("Token:", localStorage.getItem('token'));
                // Chuyển hướng đến trang dashboard hoặc trang chính
                await new Promise(resolve => setTimeout(resolve, 100));
                
                window.location.href = 'homepage.html'; // Thay bằng URL thực tế
                console.log("Token:", localStorage.getItem('token'));
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred during login');
        }
    });
});