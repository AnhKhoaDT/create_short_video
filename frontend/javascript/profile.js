  // Handle Edit/Save functionality
        const saveEditBtn = document.getElementById('saveEditBtn');
        const inputs = [
            document.getElementById('username'),
            document.getElementById('email'),
            document.getElementById('phone'),
            document.getElementById('dob')
        ];

        saveEditBtn.addEventListener('click', () => {
            if (saveEditBtn.textContent === 'Chỉnh sửa') {
                // Enable editing
                inputs.forEach(input => input.removeAttribute('readonly'));
                saveEditBtn.textContent = 'Lưu thông tin';
            } else {
                // Save and disable editing
                inputs.forEach(input => input.setAttribute('readonly', 'true'));
                saveEditBtn.textContent = 'Chỉnh sửa';
                alert('Thông tin đã được lưu!');
            }
        });

        // Handle Change Password (placeholder)
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            alert('Chức năng đổi mật khẩu đang được phát triển!');
        });

        // Handle Logout (placeholder)
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                alert('Đăng xuất thành công!');
                window.location.href = '/login'; // Redirect to login page (placeholder)
            }
        });

