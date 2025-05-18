fetch('./component/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;

        // Kiểm tra trạng thái đăng nhập
        const username = "anhkhoa"; // Thay bằng "" để giả lập chưa đăng nhập
        const userInitial = document.getElementById("userInitial");

        if (username) {
            userInitial.textContent = username.charAt(0).toUpperCase();
        } else {
            userInitial.innerHTML = `
                <iconify-icon 
                    icon="mdi:account" 
                    style="color: white;" 
                    width="24" 
                    height="24"
                ></iconify-icon>
            `;
        }

        // Gắn sự kiện cho menu-toggle
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

            // Gắn sự kiện quay lại trang chủ
            const homeItem = document.querySelector('.sidebar-item iconify-icon[icon="mdi:home"]');
            if(homeItem){
                homeItem.closest('.sidebar-item').addEventListener('click', ()=>{
                    window.location.href ='homepage.html';
                });
            }

            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                });
            });
        }

        if(userInitial && username){
            userInitial.addEventListener('click',() =>{
                window.location.href = 'profile.html';
            });
        }
    })
    .catch(error => console.error('Lỗi khi tải header:', error));