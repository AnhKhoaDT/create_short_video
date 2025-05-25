document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xác thực
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load trending topics
    loadTrendingTopics();

    // Xử lý input script
    const inputScript = document.getElementById('inputScript');
    const charCount = document.getElementById('charCount');
    const maxLength = 3000;

    inputScript.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength) {
            this.value = this.value.substring(0, maxLength);
            charCount.textContent = `${maxLength}/${maxLength}`;
        }
    });

    // Xử lý nút gửi
    const sendButton = document.querySelector('.send-button');
    sendButton.addEventListener('click', handleSendScript);

    // Xử lý nút tạo video mới
    const createVideoBtn = document.querySelector('.create-video-btn');
    createVideoBtn.addEventListener('click', () => {
        window.location.href = 'video-manager.html';
    });

    // Xử lý nút xem mẫu
    const browseTemplatesBtn = document.querySelector('.browse-templates-btn');
    browseTemplatesBtn.addEventListener('click', () => {
        // TODO: Implement template browsing
        alert('Tính năng đang được phát triển!');
    });

    // Xử lý nút tạo kịch bản
    const createScriptBtn = document.querySelector('.create-script');
    createScriptBtn.addEventListener('click', () => {
        inputScript.focus();
    });

    // Xử lý nút tạo video từ kịch bản (chỉ toggle, không gửi)
    // Đã bỏ sự kiện gửi ở đây

    // Toggle action buttons (only one active)
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            actionBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Load trending topics từ API
async function loadTrendingTopics() {
    const trendingContainer = document.getElementById('trendingTopics');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:8080/create-video-service/trends/suggestions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch trending topics');
        }

        const responseData = await response.json();
        const trends = responseData.data; // Access the 'data' field
        
        // Xóa loading spinner
        trendingContainer.innerHTML = '';

        // Thêm các trend vào container
        if (trends && trends.length > 0) {
             trends.forEach(trend => {
                // Pass keyword as title and description as description
                const trendCard = createTrendCard({ 
                    id: trend.id,
                    title: trend.keyword, // Use keyword as title
                    description: trend.description // Use description
                });
                trendingContainer.appendChild(trendCard);
            });
        } else {
            // Hiển thị thông báo không có dữ liệu hoặc xu hướng mẫu nếu cần
            trendingContainer.innerHTML = '<p>Không tìm thấy xu hướng nào.</p>';
        }
       
    } catch (error) {
        console.error('Error loading trending topics:', error);
        

        trendingContainer.innerHTML = '';
        exampleTrends.forEach(trend => {
            const trendCard = createTrendCard(trend);
            trendingContainer.appendChild(trendCard);
        });
    }
}

// Tạo card cho mỗi trend
function createTrendCard(trend) {
    const card = document.createElement('div');
    card.className = 'trend-card';
    card.innerHTML = `
        <h3>${trend.title}</h3>
        <p>${trend.description}</p>
        <button class="use-trend-btn" data-trend-id="${trend.id}">
            <iconify-icon icon="mdi:video-plus" class="mr-2"></iconify-icon>
            Sử dụng
        </button>
    `;

    // Thêm sự kiện click cho nút sử dụng
    const useButton = card.querySelector('.use-trend-btn');
    useButton.addEventListener('click', () => useTrend(trend.id));

    return card;
}

// Xử lý khi người dùng chọn một trend
function useTrend(trendId) {
    localStorage.setItem('selectedTrendId', trendId);
    window.location.href = 'video-manager.html';
}

// Xử lý gửi kịch bản
async function handleSendScript() {
    const inputScript = document.getElementById('inputScript');
    const script = inputScript.value.trim();

    if (!script) {
        showError('Vui lòng nhập nội dung kịch bản!');
        return;
    }

    try {
        // TODO: Implement script processing
        showSuccess('Đang xử lý kịch bản...');
    } catch (error) {
        console.error('Error processing script:', error);
        showError('Không thể xử lý kịch bản. Vui lòng thử lại sau.');
    }
}

// Hiển thị thông báo lỗi
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Hiển thị thông báo thành công
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
} 