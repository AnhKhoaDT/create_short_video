fetch('./component/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;

        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        const userInitial = document.getElementById("userInitial");
        const loginText = document.getElementById("loginText");
        let username = null;

        // Hàm giải mã Base64
        function decodeBase64(base64) {
            try {
                return atob(base64);
            } catch (e) {
                console.error('Lỗi giải mã Base64:', e);
                return null;
            }
        }

        // Hàm giải mã JWT để lấy payload
        function decodeJWT(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) {
                    throw new Error('Token không hợp lệ');
                }
                const payload = decodeBase64(parts[1]);
                return JSON.parse(payload);
            } catch (e) {
                console.error('Lỗi giải mã JWT:', e);
                return null;
            }
        }

        // Hàm hiển thị user mặc định (khi chưa đăng nhập)
        const displayDefaultUser = () => {
            userInitial.innerHTML = `
                <iconify-icon 
                    icon="mdi:account" 
                    style="color: white;" 
                    width="24" 
                    height="24"
                ></iconify-icon>
            `;
            if (loginText) {
                loginText.textContent = 'Đăng nhập';
                loginText.classList.remove('text-white');
                loginText.classList.add('text-blue-400', 'hover:underline', 'cursor-pointer');
                loginText.onclick = () => {
                    window.location.href = 'login.html';
                };
            }
        };

        // Nếu không có token, hiển thị mặc định
        if (!token) {
            displayDefaultUser();
            setupHeaderEvents(null);
            return;
        }

        // Giải mã token để lấy thông tin user
        const payload = decodeJWT(token);
        if (payload) {
            console.log('Decoded token payload:', payload);
            username = payload.sub || payload.username || payload.email?.split('@')[0] || '';
            console.log('Extracted username:', username);

            // Kiểm tra thời gian hết hạn của token
            const currentTime = Math.floor(Date.now() / 1000); // Thời gian hiện tại (Unix timestamp)
            if (payload.exp && payload.exp < currentTime) {
                console.warn('Token đã hết hạn');
                localStorage.removeItem('token');
                displayDefaultUser();
                setupHeaderEvents(null);
                if (window.location.pathname !== '/login.html') {
                    window.location.href = 'login.html';
                }
                return;
            }

            if (username) {
                // Cập nhật userInitial (chữ cái đầu của username)
                userInitial.textContent = username.charAt(0).toUpperCase();

                // Cập nhật loginText thành username
                if (loginText) {
                    loginText.textContent = username; // Thay "Đăng nhập" bằng username
                    loginText.classList.remove('text-blue-400', 'hover:underline');
                    loginText.classList.add('text-white', 'cursor-pointer');
                    // Thêm sự kiện click để chuyển hướng đến profile.html
                    loginText.onclick = () => {
                        window.location.href = 'profile.html';
                    };
                }

                // Lưu thông tin user vào localStorage nếu cần
                localStorage.setItem('user', JSON.stringify({
                    username: username,
                    scope: payload.scope
                }));
            } else {
                console.warn('Không tìm thấy username trong token');
                displayDefaultUser();
            }
        } else {
            console.error('Không thể giải mã token');
            localStorage.removeItem('token');
            displayDefaultUser();
        }

        setupHeaderEvents(username);

        // Hàm setup các sự kiện cho header
        function setupHeaderEvents(username) {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');

            if (menuToggle && sidebar && overlay) {
                menuToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                });

                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                });

                const homeItem = document.querySelector('.sidebar-item iconify-icon[icon="mdi:home"]');
                if (homeItem) {
                    homeItem.closest('.sidebar-item').addEventListener('click', () => {
                        window.location.href = 'homepage.html';
                    });
                }

                const videoItem = document.querySelector('.sidebar-item iconify-icon[icon="mdi:video"]');
                if (videoItem) {
                    videoItem.closest('.sidebar-item').addEventListener('click', () => {
                        window.location.href = 'video-manager.html';
                    });
                }

                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.addEventListener('click', () => {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                    });
                });
            }

            const videoButton = document.querySelector('.nav-button[onclick*="video-manager.html"]') || 
                               Array.from(document.querySelectorAll('.nav-button')).find(button => button.textContent === 'Video');
            if (videoButton) {
                videoButton.addEventListener('click', () => {
                    window.location.href = 'video-manager.html';
                });
            }

            if (userInitial && username) {
                userInitial.addEventListener('click', () => {
                    window.location.href = 'profile.html';
                });
            }

            // Add event listeners for the navigation buttons
            const videoNavBtn = document.getElementById('videoNavBtn');
            const scriptNavBtn = document.getElementById('scriptNavBtn');
            const imageNavBtn = document.getElementById('imageNavBtn');

            if (videoNavBtn) {
                videoNavBtn.addEventListener('click', () => {
                    window.location.href = './video-manager.html';
                });
            }

            if (scriptNavBtn) {
                scriptNavBtn.addEventListener('click', () => {
                    window.location.href = './script-manager.html';
                });
            }

            if (imageNavBtn) {
                imageNavBtn.addEventListener('click', () => {
                    window.location.href = './image-manager.html';
                });
            }
        }
    })
    .catch(error => console.error('Lỗi khi tải header:', error));

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const loginText = document.getElementById('loginText');
    const userInitial = document.getElementById('userInitial');

    // Get the navigation buttons by their new IDs
    // const videoNavBtn = document.getElementById('videoNavBtn'); // Removed
    // const scriptNavBtn = document.getElementById('scriptNavBtn'); // Removed
    // const imageNavBtn = document.getElementById('imageNavBtn'); // Removed

    // Function to toggle sidebar visibility
    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    };

    // Event listener for menu toggle button
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // Event listener for overlay to close sidebar
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    // Event listener for login text
    if (loginText) {
        loginText.addEventListener('click', () => {
            // TODO: Add login functionality or redirect
            alert('Chuyển đến trang đăng nhập');
        });
    }

     // TODO: Implement actual user login state handling
     // For now, just show a placeholder initial if user is conceptually logged in
    const userName = localStorage.getItem('userName'); // Example: get from localStorage
    if (userName) {
        userInitial.textContent = userName.charAt(0).toUpperCase();
        userInitial.style.display = 'flex'; // Show the initial
        loginText.textContent = userName; // Show the username
        loginText.style.cursor = 'default';
        loginText.style.textDecoration = 'none';
    } else {
         userInitial.style.display = 'none'; // Hide the initial if not logged in
    }

    // Add event listeners for the sidebar navigation items
    const sidebarItems = document.querySelectorAll('.sidebar-item a'); // Select links within sidebar items
    sidebarItems.forEach(item => {
        item.addEventListener('click', (event) => {
            // Prevent default link behavior if you want to handle routing via JS framework
            // event.preventDefault();
            // Example: Navigate using JS framework or simply let the link work
            console.log('Navigating to:', item.href);
            // If not using a JS framework for routing, the default link behavior is fine
            // If using JS framework, add your routing logic here.
        });
    });

});