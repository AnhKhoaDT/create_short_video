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
   
    let selectedCategory = null;
    let selectedAI = null;

    const selectedCategoryText = document.getElementById('selectedCategoryText');
    function updateSelectedCategoryText() {
        const activeBtn = document.querySelector('.category-btn.active');
        if (activeBtn) {
            const categoryText = activeBtn.textContent.trim();
            selectedCategoryText.textContent = `Đã chọn: ${categoryText}`;
            console.log('Updated category text:', categoryText);
        } else {
            selectedCategoryText.textContent = 'Chưa chọn loại kịch bản';
            console.log('Reset category text');
        }
    }

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

  

    // Event delegation cho category
    const categoriesGrid = document.querySelector('.categories-grid');
    categoriesGrid.addEventListener('click', function(e) {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;

        e.preventDefault();
        const category = btn.getAttribute('data-category');
        console.log('Category button clicked:', category);

        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            selectedCategory = null;
            console.log('Category deselected');
        } else {
            categoriesGrid.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = category;
            console.log('Category selected:', selectedCategory);
        }
        updateSelectedCategoryText();
    });

    // Event delegation cho AI
    const aiGrid = document.querySelector('.flex.items-center.gap-4.flex-wrap');
    aiGrid.addEventListener('click', function(e) {
        const btn = e.target.closest('.ai-btn');
        if (!btn) return;

        e.preventDefault();
        const ai = btn.getAttribute('data-ai');
        console.log('AI button clicked:', ai);

        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            selectedAI = null;
            console.log('AI deselected');
        } else {
            aiGrid.querySelectorAll('.ai-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAI = ai;
            console.log('AI selected:', selectedAI);

        }
    });

    // Ensure correct text on page load
    updateSelectedCategoryText();

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

    // Gọi hàm này khi trang load
    loadHomepageVideos();
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
    const selectedCategory = document.querySelector('.category-btn.active')?.getAttribute('data-category');

    console.log('Đã nhấn nút gửi kịch bản');
    console.log('Nội dung kịch bản:', script);
    console.log('Loại kịch bản đã chọn:', selectedCategory);

    if (!selectedCategory) {
        showError('Vui lòng chọn loại kịch bản!');
        return;
    }

    if (!script) {
        showError('Vui lòng nhập nội dung kịch bản!');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/create-video-service/scripts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: script,
                category: selectedCategory
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create script');
        }

        const data = await response.json();
        showSuccess('Tạo kịch bản thành công!');
        
        // Clear input and reset category
        inputScript.value = '';
        document.getElementById('charCount').textContent = '0/3000';
        document.querySelector('.category-btn.active')?.classList.remove('active');
        // Update selected category text
        updateSelectedCategoryText();
        
        // Redirect to script manager or handle the response as needed
        if (data.scriptId) {
            localStorage.setItem('currentScriptId', data.scriptId);
            window.location.href = 'script-manager.html';
        }
    } catch (error) {
        console.error('Error creating script:', error);
        showError('Không thể tạo kịch bản. Vui lòng thử lại sau.');
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

function loadHomepageVideos() {
    const videoListContainer = document.getElementById('homepageVideoList');
    // Dữ liệu mẫu, bạn có thể thay bằng API nếu có
    // Thêm url và id cho dữ liệu mẫu để hiển thị video thumbnail và nhận diện video
    const videos = [
        { id: '1', title: "Video A", views: 1500, description: "Mô tả video A", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
        { id: '2', title: "Video B", views: 900, description: "Mô tả video B", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
        { id: '3', title: "Video C", views: 2100, description: "Mô tả video C", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" }
    ];

    // Xóa nội dung hiện tại
    videoListContainer.innerHTML = '';

    if (videos && videos.length > 0) {
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            // Sử dụng class 'video-card' từ video-manager.css để áp dụng style
            videoCard.className = 'video-card';
            // Thêm data-id để dễ dàng thao tác sau này nếu cần
            videoCard.setAttribute('data-video-id', video.id);

            videoCard.innerHTML = `
                <video class="video-thumb" src="${video.url}" controls></video>
                <div class="video-title">${video.title}</div>
                <div class="video-desc">${video.description}</div>
                <div class="video-stats">
                    <span class="view-count"><iconify-icon icon="mdi:eye"></iconify-icon> ${video.views} lượt xem</span>
                </div>
                
                <!-- Action buttons -->
                <div class="video-actions-compact flex justify-center gap-2">
                    <button class="edit-btn-compact" data-id="${video.id}"><iconify-icon icon="mdi:pencil"></iconify-icon> Sửa</button>
                    <button class="download-btn-compact" data-id="${video.id}"><iconify-icon icon="mdi:download"></iconify-icon> Tải xuống</button>
                    <button class="delete-btn-compact" data-id="${video.id}"><iconify-icon icon="mdi:delete"></iconify-icon> Xóa</button>
                </div>
            `;

            videoListContainer.appendChild(videoCard);

            // TODO: Thêm xử lý sự kiện cho các nút Sửa, Tải xuống, Xóa nếu cần
        });
    } else {
        // Hiển thị thông báo nếu không có video yêu thích nào
        videoListContainer.innerHTML = '<p>Không tìm thấy video yêu thích nào.</p>';
    }
} 