function updateSelectedCategoryText() {
    const selectedCategoryText = document.getElementById('selectedCategoryText');
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
// tạo spinner và overlay loading
function showLoadingOverlay(message = 'Đang tạo kịch bản...') {
let overlay = document.getElementById('loadingOverlay');
if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.3)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;
    overlay.innerHTML = `
        <span style="
            background: white;
            padding: 32px 48px;
            border-radius: 16px;
            font-size: 1.3rem;
            color: #2563eb;
            box-shadow: 0 2px 16px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
        ">
            <span class="spinner" style="
                width: 28px; height: 28px; border: 4px solid #e0e7ef; border-top: 4px solid #2563eb;
                border-radius: 50%; display: inline-block; animation: spin 1s linear infinite;
            "></span>
            ${message}
        </span>
    `;
    document.body.appendChild(overlay);

    // Spinner animation
    const style = document.createElement('style');
    style.innerHTML = `@keyframes spin { 0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);} }`;
    document.head.appendChild(style);
} else {
    overlay.style.display = 'flex';
}
}

function hideLoadingOverlay() {
const overlay = document.getElementById('loadingOverlay');
if (overlay) overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
// Kiểm tra xác thực
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
    return;
}

// Kiểm tra tham số URL để scroll tự động
const urlParams = new URLSearchParams(window.location.search);
const scrollTo = urlParams.get('scroll');
if (scrollTo === 'script') {
    // Scroll xuống phần Script Input Section sau khi trang load xong
    setTimeout(() => {
        const scriptSection = document.querySelector('.script-section');
        if (scriptSection) {
            scriptSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 500); // Delay 500ms để đảm bảo trang đã load hoàn toàn
}

// Load trending topics
loadTrendingTopics();

// Xử lý input script
const inputScript = document.getElementById('inputScript');
const charCount = document.getElementById('charCount');
const maxLength = 3000;

let selectedCategory = null;
let selectedAI = null;



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
    // Scroll xuống phần Script Input Section
    const scriptSection = document.querySelector('.script-section');
    if (scriptSection) {
        scriptSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
});

// Xử lý nút xem mẫu
const browseTemplatesBtn = document.querySelector('.browse-templates-btn');
browseTemplatesBtn.addEventListener('click', () => {
    // Chuyển đến trang quản lý video
    window.location.href = 'video-manager.html';
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
        localStorage.removeItem('selectedCategory');
        console.log('Category deselected');
    } else {
        categoriesGrid.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = category;
        localStorage.setItem('selectedCategory', category);
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

// Load trending topics từ Wikipedia API
async function loadTrendingTopics() {
const trendingContainer = document.getElementById('trendingTopics');
const token = localStorage.getItem('token');

try {
    const response = await fetch('http://localhost:8080/create-video-service/trends/suggestions', {
        method:'GET',
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
useButton.addEventListener('click', () => useTrend(trend.title, trend.description));

return card;
}

// Xử lý khi người dùng chọn một trend
function useTrend(title, description) {
    // Scroll xuống phần tạo video
    const scriptSection = document.querySelector('.script-section');
    if (scriptSection) {
        scriptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Điền nội dung vào ô nhập
    const inputScript = document.getElementById('inputScript');
    if (inputScript) {
        inputScript.value = `${title}\n${description}`;
        // Cập nhật bộ đếm ký tự
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = `${inputScript.value.length}/3000`;
        }
        // Focus vào ô nhập
        inputScript.focus();
    }
}

async function handleSendScript() {
const inputScript = document.getElementById('inputScript');
const script = inputScript.value.trim();
const selectedCategoryBtn = document.querySelector('.category-btn.active');
const selectedCategory = selectedCategoryBtn?.getAttribute('data-category');
const selectedAIbtn = document.querySelector('.ai-btn.active');
const selectedAI = selectedAIbtn?.getAttribute('data-ai');
const sendButton = document.querySelector('.send-button');

// Kiểm tra đủ điều kiện mới cho gửi
if (!selectedAI) {
    showError('Vui lòng chọn mô hình AI!');
    return;
}
if (!selectedCategory) {
    showError('Vui lòng chọn loại kịch bản!');
    return;
}
if (!script) {
    showError('Vui lòng nhập nội dung kịch bản!');
    return;
}

showLoadingOverlay('Đang tạo kịch bản...');

try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8080/create-video-service/scripts/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            input: script,
            category: selectedCategory,
            aiModel: selectedAI
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create script');
    }

    // Lưu nội dung kịch bản trả về từ API vào localStorage
    const result = await response.json();
    localStorage.setItem('createdScriptContent',JSON.stringify(result.data));
    console.log('Script created successfully:', result.data);
    // Xóa nội dung input sau khi tạo thành công
    inputScript.value = '';
    const charCount = document.getElementById('charCount');
    if (charCount) charCount.textContent = `0/3000`;

    showSuccess('Tạo kịch bản thành công!');
    setTimeout(() => {
        hideLoadingOverlay();
       
        window.location.href = 'script-create.html';
    }, 2000);

} catch (error) {
    console.error('Error creating script:', error);
    showError('Không thể tạo kịch bản. Vui lòng thử lại sau.');
} finally {
    sendButton.disabled = false;
    sendButton.innerHTML = `<iconify-icon icon="mdi:send"></iconify-icon> Gửi`;
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
    
    fetch('http://localhost:8080/create-video-service/videos', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch videos');
        return response.json();
    })
    .then(videos => {
        videoListContainer.innerHTML = '';
        if (videos && videos.length > 0) {
            videos.forEach(video => {
                const videoCard = document.createElement('div');
                videoCard.className = 'video-card';
                videoCard.setAttribute('data-video-id', video.id);
                videoCard.setAttribute('data-video-url', video.videoUrl);
                videoCard.innerHTML = `
                    <video class="video-thumb" src="${video.videoUrl}" controls></video>
                    <div class="video-title">${video.title || 'Video ' + video.id}</div>
                    <div class="video-desc">${video.description || 'Mô tả video'}</div>
                    <div class="video-stats">
                        <span class="view-count"><iconify-icon icon="mdi:eye"></iconify-icon> 0 lượt xem</span>
                    </div>
                    <div class="video-actions-compact flex justify-center gap-2">
                        <button class="download-btn-compact" data-id="${video.id}"><iconify-icon icon="mdi:download"></iconify-icon> Tải xuống</button>
                        <button class="edit-btn-compact" data-id="${video.id}"><iconify-icon icon="mdi:pencil"></iconify-icon> Sửa</button>
                        <button class="delete-btn-compact" data-id="${video.id}"><iconify-icon icon="mdi:delete"></iconify-icon> Xóa</button>
                    </div>
                `;
                videoListContainer.appendChild(videoCard);
            });
        } else {
            videoListContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="max-w-md mx-auto">
                        <iconify-icon icon="mdi:video-off" class="text-6xl text-gray-300 mb-4"></iconify-icon>
                        <h3 class="text-xl font-semibold text-gray-600 mb-2">Chưa có video nào</h3>
                        <p class="text-gray-500 mb-6">Bạn chưa tạo video nào. Hãy bắt đầu tạo video đầu tiên của bạn!</p>
                        <button class="create-video-btn" onclick="window.location.href='./homepage.html?scroll=script'">
                            <iconify-icon icon="mdi:video-plus" class="mr-2"></iconify-icon>
                            Tạo video đầu tiên
                        </button>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error loading videos:', error);
        videoListContainer.innerHTML = '<p class="text-red-500 text-center py-8">Không thể tải danh sách video.</p>';
    });

    // Event delegation cho các nút action
    videoListContainer.onclick = function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        const videoCard = target.closest('.video-card');
        if (!videoCard) return;
        const videoId = videoCard.getAttribute('data-video-id');
        const videoUrl = videoCard.getAttribute('data-video-url');
        const videoTitle = videoCard.querySelector('.video-title')?.textContent || 'Video';
        const videoDesc = videoCard.querySelector('.video-desc')?.textContent || '';
        // Download
        if (target.classList.contains('download-btn-compact')) {
            e.preventDefault();
            const link = document.createElement('a');
            link.href = videoUrl;
            link.download = `${videoTitle}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        // Edit
        if (target.classList.contains('edit-btn-compact')) {
            e.preventDefault();
            sessionStorage.setItem('currentVideo', JSON.stringify({
                id: videoId,
                url: videoUrl,
                title: videoTitle,
                description: videoDesc
            }));
            alert('Chức năng chỉnh sửa video đang được phát triển!');
        }
        // Delete
        if (target.classList.contains('delete-btn-compact')) {
            e.preventDefault();
            if (confirm(`Bạn có chắc muốn xóa video "${videoTitle}"?`)) {
                deleteVideo(videoId, videoCard);
            }
        }
    };
    // Click vào card để xem preview
    videoListContainer.addEventListener('click', function(e) {
        const card = e.target.closest('.video-card');
        if (!card) return;
        if (e.target.closest('button')) return;
        const videoId = card.getAttribute('data-video-id');
        const videoUrl = card.getAttribute('data-video-url');
        const videoTitle = card.querySelector('.video-title')?.textContent || '';
        const videoDesc = card.querySelector('.video-desc')?.textContent || '';
        sessionStorage.setItem('currentVideo', JSON.stringify({
            id: videoId,
            url: videoUrl,
            title: videoTitle,
            description: videoDesc
        }));
        window.location.href = 'video-preview.html';
    });
}

// Hàm xóa video
async function deleteVideo(videoId, videoCard) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/create-video-service/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            videoCard.remove();
            alert('Đã xóa video thành công!');
        } else {
            throw new Error('Failed to delete video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Không thể xóa video. Vui lòng thử lại sau.');
    }
} 