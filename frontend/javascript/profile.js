document.addEventListener('DOMContentLoaded', () => {
    // Function to parse JWT token
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT token:', error);
            return null;
        }
    }

    // Function to format date from ISO string
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }

    // Function to load user profile from token
    function loadUserProfile() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const userData = parseJwt(token);
        if (!userData) {
            console.error('Invalid token');
            return;
        }

        // Update form fields with data from token
        document.getElementById('username').value = userData.sub || ''; // sub is the username in JWT
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('dob').value = formatDate(userData.dateOfBirth) || '';
        
        // Update avatar initial
        const initial = userData.sub ? userData.sub.charAt(0).toUpperCase() : 'U';
        document.getElementById('userInitial').textContent = initial;

        // Update role/scope if needed
        if (userData.scope) {
            const roleElement = document.getElementById('userRole');
            if (roleElement) {
                roleElement.textContent = userData.scope;
            }
        }

        // Log token expiration time
        if (userData.exp) {
            const expirationDate = new Date(userData.exp * 1000);
            console.log('Token expires at:', expirationDate.toLocaleString());
        }
    }

    // Function to handle edit mode
    function toggleEditMode() {
        const inputs = document.querySelectorAll('input[readonly]');
        const saveEditBtn = document.getElementById('saveEditBtn');
        
        if (inputs[0].readOnly) {
            // Enable editing
            inputs.forEach(input => input.readOnly = false);
            saveEditBtn.innerHTML = `
                <iconify-icon icon="mdi:content-save" class="mr-2"></iconify-icon>
                Lưu thay đổi
            `;
        } else {
            // Save changes
            saveChanges();
        }
    }

    // Function to save changes
    async function saveChanges() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            dateOfBirth: document.getElementById('dob').value
        };

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            // Update token with new data
            const newToken = await response.json();
            localStorage.setItem('token', newToken);

            // Disable editing
            const inputs = document.querySelectorAll('input');
            inputs.forEach(input => input.readOnly = true);
            
            const saveEditBtn = document.getElementById('saveEditBtn');
            saveEditBtn.innerHTML = `
                <iconify-icon icon="mdi:pencil" class="mr-2"></iconify-icon>
                Chỉnh sửa
            `;

            alert('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
        }
    }

    // Function to handle password change
    async function handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới không khớp!');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                throw new Error('Failed to change password');
            }

            alert('Đổi mật khẩu thành công!');
            closePasswordModal();
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
        }
    }

    // Function to show password modal
    function showPasswordModal() {
        document.getElementById('passwordModal').classList.remove('hidden');
        document.getElementById('passwordModal').classList.add('flex');
    }

    // Function to close password modal
    function closePasswordModal() {
        document.getElementById('passwordModal').classList.add('hidden');
        document.getElementById('passwordModal').classList.remove('flex');
        document.getElementById('changePasswordForm').reset();
    }

    // xử lý logout
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');

    // Hàm gọi API logout
    async function logout() {
        if (!token) {
            console.warn('Không tìm thấy token để đăng xuất');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/create-video-service/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token }),
            });

            if (response.ok) {
                console.log('Đăng xuất thành công');
                // Xóa token khỏi localStorage
                localStorage.removeItem('token');
                // Chuyển hướng về trang login
                window.location.href = 'login.html';
            } else {
                const errorText = await response.text();
                console.error('Đăng xuất thất bại:', errorText);
                alert('Đăng xuất thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API logout:', error);
            alert('Đăng xuất thất bại do lỗi kết nối. Vui lòng thử lại.');
        }
    }

    // Add event listeners
    document.getElementById('saveEditBtn').addEventListener('click', toggleEditMode);
    document.getElementById('changePasswordBtn').addEventListener('click', showPasswordModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);

    // Load profile on page load
    loadUserProfile();
});

