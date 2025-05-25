document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load user profile
    loadUserProfile();

    // Setup event listeners
    document.getElementById('editBtn').addEventListener('click', toggleEditMode);
    document.getElementById('changePasswordBtn').addEventListener('click', openPasswordModal);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
});

async function loadUserProfile() {
    try {
        const response = await fetch('/create-video-service/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const user = await response.json();
        
        // Update form fields
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('dob').value = user.dateOfBirth || '';
        
        // Update avatar initial
        document.getElementById('userInitial').textContent = user.username.charAt(0).toUpperCase();
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile. Please try again later.');
    }
}

function toggleEditMode() {
    const inputs = document.querySelectorAll('.form-input');
    const editBtn = document.getElementById('editBtn');
    
    if (editBtn.textContent === 'Edit Profile') {
        // Enable editing
        inputs.forEach(input => input.removeAttribute('readonly'));
        editBtn.textContent = 'Save Changes';
        editBtn.classList.remove('btn-primary');
        editBtn.classList.add('btn-secondary');
    } else {
        // Save changes
        saveProfileChanges();
    }
}

async function saveProfileChanges() {
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        dateOfBirth: document.getElementById('dob').value
    };

    try {
        const response = await fetch('/create-video-service/api/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        // Disable editing
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => input.setAttribute('readonly', true));
        
        const editBtn = document.getElementById('editBtn');
        editBtn.textContent = 'Edit Profile';
        editBtn.classList.remove('btn-secondary');
        editBtn.classList.add('btn-primary');

        showSuccess('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again.');
    }
}

function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return;
    }

    try {
        const response = await fetch('/create-video-service/api/users/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            throw new Error('Failed to change password');
        }

        closePasswordModal();
        showSuccess('Password changed successfully');
    } catch (error) {
        console.error('Error changing password:', error);
        showError('Failed to change password. Please try again.');
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    document.querySelector('.profile-card').insertBefore(alert, document.querySelector('.profile-form'));
    setTimeout(() => alert.remove(), 3000);
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.querySelector('.profile-card').insertBefore(alert, document.querySelector('.profile-form'));
    setTimeout(() => alert.remove(), 3000);
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

// Thêm sự kiện cho nút Đăng xuất
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

