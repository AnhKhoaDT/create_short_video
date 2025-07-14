document.addEventListener('DOMContentLoaded', async () => {
    // Load videos từ API
    await loadHomepageVideos();
    
    // Lấy thời lượng video và hiển thị
    // document.querySelectorAll('video').forEach(video => {
    //     video.addEventListener('loadedmetadata', () => {
    //         const duration = video.duration; // Thời lượng tính bằng giây
    //         const minutes = Math.floor(duration / 60);
    //         const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
    //         const durationSpan = video.parentElement.querySelector('span');
    //         if (durationSpan) {
    //             durationSpan.textContent = `${minutes}:${seconds}`;
    //         }
    //     });
    // });

    // Xử lý các nút hành động
    const downloadButtons = document.querySelectorAll('.text-blue-500');
    const editButtons = document.querySelectorAll('.text-yellow-500');
    const deleteButtons = document.querySelectorAll('.text-red-500');

    // Xử lý sự kiện cho các nút action (sử dụng event delegation)
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const videoCard = target.closest('.video-card');
        if (!videoCard) return;

        const videoId = videoCard.getAttribute('data-video-id');
        const videoUrl = videoCard.getAttribute('data-video-url');
        const videoTitle = videoCard.querySelector('.video-title')?.textContent || 'Video';
        const videoDesc = videoCard.querySelector('.video-desc')?.textContent || '';

        // Xử lý nút Tải xuống
        if (target.classList.contains('download-btn-compact')) {
            e.preventDefault();
            const link = document.createElement('a');
            link.href = videoUrl;
            link.download = `${videoTitle}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Xử lý nút Chỉnh sửa
        if (target.classList.contains('edit-btn-compact')) {
            e.preventDefault();
            // Lưu thông tin video vào sessionStorage để chuyển đến trang edit
            sessionStorage.setItem('currentVideo', JSON.stringify({
                id: videoId,
                url: videoUrl,
                title: videoTitle,
                description: videoDesc
            }));
            alert('Chức năng chỉnh sửa video đang được phát triển!');
            // window.location.href = 'edit-video.html';
        }

        // Xử lý nút Xóa
        if (target.classList.contains('delete-btn-compact')) {
            e.preventDefault();
            if (confirm(`Bạn có chắc muốn xóa video "${videoTitle}"?`)) {
                deleteVideo(videoId, videoCard);
            }
        }
    });

    // Xử lý click vào video-card để xem preview
    document.addEventListener('click', function(e) {
        const card = e.target.closest('.video-card');
        if (!card) return;
        // Tránh click vào nút action bên trong card
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
});

async function loadHomepageVideos() {
    const videoListContainer = document.getElementById('videoList');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/create-video-service/videos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }

        const videos = await response.json();
        
        // Xóa nội dung hiện tại
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
                        <span class="view-count"><iconify-icon icon="mdi:eye"></iconify-icon> ${video.viewCountYoutube || 0} lượt xem</span>
                    </div>
                    <!-- Action buttons -->
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
    } catch (error) {
        console.error('Error loading videos:', error);
        videoListContainer.innerHTML = '<p class="text-red-500 text-center py-8">Không thể tải danh sách video.</p>';
    }
}

// Hàm refresh danh sách video
async function refreshVideos() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.innerHTML;
    
    // Hiển thị loading state
    refreshBtn.innerHTML = `
        <iconify-icon icon="mdi:refresh" class="mr-2 animate-spin"></iconify-icon>
        Đang tải...
    `;
    refreshBtn.disabled = true;
    
    try {
        await loadHomepageVideos();
    } catch (error) {
        console.error('Error refreshing videos:', error);
    } finally {
        // Khôi phục trạng thái ban đầu
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
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
            // Xóa card khỏi UI
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