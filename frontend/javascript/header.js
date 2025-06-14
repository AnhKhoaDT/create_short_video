fetch('./component/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;

        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        
        // Lấy lại tham chiếu đến các phần tử sau khi header đã được chèn vào DOM
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
        const displayDefaultUser = (userInitialElement, loginTextElement) => {
            if (userInitialElement) {
                userInitialElement.innerHTML = `
                    <iconify-icon 
                        icon="mdi:account" 
                        style="color: white;" 
                        width="24" 
                        height="24"
                    ></iconify-icon>
                `;
            }
            if (loginTextElement) {
                loginTextElement.textContent = 'Đăng nhập';
                loginTextElement.classList.remove('text-white');
                loginTextElement.classList.add('text-blue-400', 'hover:underline', 'cursor-pointer');
                loginTextElement.onclick = () => {
                    window.location.href = 'login.html';
                };
            }
        };

        // Nếu không có token, hiển thị mặc định
        if (!token) {
            displayDefaultUser(userInitial, loginText);
            setupHeaderEvents(null, userInitial, loginText);
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
                displayDefaultUser(userInitial, loginText);
                setupHeaderEvents(null, userInitial, loginText);
                if (window.location.pathname !== '/login.html') {
                    window.location.href = 'login.html';
                }
                return;
            }

            if (username) {
                // Cập nhật userInitial (chữ cái đầu của username)
                if (userInitial) {
                    userInitial.textContent = username.charAt(0).toUpperCase();
                }

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
                displayDefaultUser(userInitial, loginText);
            }
        } else {
            console.error('Không thể giải mã token');
            localStorage.removeItem('token');
            displayDefaultUser(userInitial, loginText);
        }

        setupHeaderEvents(username, userInitial, loginText);

        // Hàm setup các sự kiện cho header
        function setupHeaderEvents(username, userInitialElement, loginTextElement) {
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

            if (userInitialElement && username) {
                userInitialElement.addEventListener('click', () => {
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
            
            // Handle loginText click if it's not already handled by token logic
            if (loginTextElement && !username) {
                loginTextElement.addEventListener('click', () => {
                    window.location.href = 'login.html';
                });
            }

            // Handle user initial display from localStorage (fallback/alternative)
            const userNameFromLocalStorage = localStorage.getItem('userName');
            if (userNameFromLocalStorage && userInitialElement && !username) { // Only if no username from token
                userInitialElement.textContent = userNameFromLocalStorage.charAt(0).toUpperCase();
                userInitialElement.style.display = 'flex'; // Show the initial
                if (loginTextElement) {
                    loginTextElement.textContent = userNameFromLocalStorage; // Show the username
                    loginTextElement.style.cursor = 'default';
                    loginTextElement.style.textDecoration = 'none';
                }
            } else if (!userNameFromLocalStorage && userInitialElement && !username) {
                userInitialElement.style.display = 'none'; // Hide the initial if not logged in and no token
            }

            // Add event listeners for the sidebar navigation items (links)
            const sidebarItems = document.querySelectorAll('.sidebar-item a');
            sidebarItems.forEach(item => {
                item.addEventListener('click', (event) => {
                    // If you handle routing via JS framework, prevent default
                    // event.preventDefault();
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    // Allow default link behavior to navigate
                });
            });
        }
    })
    .catch(error => console.error('Lỗi khi tải header:', error));