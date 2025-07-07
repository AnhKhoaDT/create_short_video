// Cấu hình script để đáp ứng nhu cầu bên: chỉ hiển thị 1 video preview (lấy từ sessionStorage), không render danh sách nhiều video mẫu

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy thông tin video từ sessionStorage
    const videoInfo = JSON.parse(sessionStorage.getItem('currentVideo') || '{}');
    const videoListContainer = document.getElementById('homepageVideoList');

    // Nếu đang loading video (tạo video mới)
    if (sessionStorage.getItem('videoLoading') === 'true') {
        // Tạo card preview
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card w-full';
        videoCard.style.marginTop = '50px';

        // Tiêu đề card
        const cardTitle = document.createElement('h2');
        cardTitle.className = 'video-card-title';
        cardTitle.textContent = 'Xem trước video';
        videoCard.appendChild(cardTitle);

        // Khu vực video: loading spinner
        const videoArea = document.createElement('div');
        videoArea.className = 'flex flex-col items-center justify-center py-12 min-h-[320px]';
        videoArea.innerHTML = `
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span class="text-lg text-gray-600">Đang tạo video...</span>
        `;
        videoCard.appendChild(videoArea);

        // Tiêu đề, mô tả
        const titleDiv = document.createElement('div');
        titleDiv.className = 'video-title font-bold text-lg mt-4';
        titleDiv.id = 'previewTitle';
        titleDiv.textContent = videoInfo?.title || 'Video Preview';
        videoCard.appendChild(titleDiv);

        const descDiv = document.createElement('div');
        descDiv.className = 'video-desc text-gray-600 mt-2';
        descDiv.id = 'previewDesc';
        descDiv.textContent = videoInfo?.description || '';
        videoCard.appendChild(descDiv);

        // Hiển thị ra ngoài
        videoListContainer.innerHTML = '';
        videoListContainer.appendChild(videoCard);

        // Gọi API tạo video nếu có scriptId
        const scriptId = sessionStorage.getItem('videoScriptId');
        if (scriptId) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:8080/create-video-service/videos/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ scriptId: Number(scriptId) })
                });
                if (!res.ok) throw new Error('Tạo video thất bại');
                const videoData = await res.json();

                // Lưu thông tin video vào sessionStorage
                sessionStorage.setItem('currentVideo', JSON.stringify({
                    id: videoData.id,
                    url: videoData.videoUrl,
                    title: videoData.title || '',
                    description: videoData.description || ''
                }));
                sessionStorage.removeItem('videoLoading');
                sessionStorage.removeItem('videoScriptId');
                // Reload lại trang để render video
                window.location.reload();
            } catch (err) {
                videoArea.innerHTML = `<span class="text-red-500">Lỗi khi tạo video: ${err.message}</span>`;
            }
        }
        return;
    }

    // Nếu không có videoInfo hoặc không có url, hiển thị thông báo
    if (!videoInfo || !videoInfo.url) {
        videoListContainer.innerHTML = '<p style="text-align: center; margin-top: 50px;">Không tìm thấy video để xem trước.</p>';
        return;
    }

    // Tạo card hiển thị video preview
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card w-full';
    videoCard.style.marginTop = '50px';

    // Tạo tiêu đề card
    const cardTitle = document.createElement('h2');
    cardTitle.className = 'video-card-title';
    cardTitle.textContent = 'Xem trước video';
    videoCard.appendChild(cardTitle);

    // Tạo phần tử video
    const videoElem = document.createElement('video');
    videoElem.className = 'video-thumb w-full rounded-lg';
    videoElem.src = videoInfo.url;
    videoElem.controls = true;
    videoElem.id = 'previewVideo';

    // Thêm track phụ đề nếu có
    if (videoInfo.subtitleUrl) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'Tiếng Việt';
        track.srclang = 'vi';
        track.src = videoInfo.subtitleUrl;
        track.default = true;
        videoElem.appendChild(track);
    }

    // Tiêu đề, mô tả, lượt xem
    const titleDiv = document.createElement('div');
    titleDiv.className = 'video-title font-bold text-lg mt-4';
    titleDiv.id = 'previewTitle';
    titleDiv.textContent = videoInfo.title || 'Video Preview';
    titleDiv.style.marginBottom = '0px';

    const descDiv = document.createElement('div');
    descDiv.className = 'video-desc text-gray-600 mt-2';
    descDiv.id = 'previewDesc';
    descDiv.textContent = videoInfo.description || '';

    const statsDiv = document.createElement('div');
    statsDiv.className = 'video-stats mt-2';
    statsDiv.innerHTML = `
        <span class="view-count text-gray-500" id="previewViewCount">
            <iconify-icon icon="mdi:eye"></iconify-icon> ${videoInfo.views ? videoInfo.views + ' lượt xem' : ''}
        </span>
    `;
    statsDiv.style.marginTop = '0px';

    // Nút phụ đề
    const subtitleBtn = document.createElement('button');
    subtitleBtn.className = 'subtitle-btn ml-2';
    subtitleBtn.id = 'subtitleBtn';
    subtitleBtn.innerHTML = '<iconify-icon icon="mdi:subtitles"></iconify-icon>';
    subtitleBtn.style.display = videoInfo.subtitleUrl ? 'inline-flex' : 'none';

    // Nút Edit, Download
    const actionDiv = document.createElement('div');
    actionDiv.className = 'action-buttons-preview flex justify-center gap-2 mt-4';
    actionDiv.style.marginTop = '0px';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn-compact px-3 py-1 rounded bg-blue-500 text-white flex items-center gap-1';
    editBtn.innerHTML = '<iconify-icon icon="mdi:pencil"></iconify-icon> Sửa';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn-compact px-3 py-1 rounded bg-green-500 text-white flex items-center gap-1';
    downloadBtn.innerHTML = '<iconify-icon icon="mdi:download"></iconify-icon> Tải xuống';

    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(downloadBtn);

    // Khu vực chia sẻ (dưới cùng card)
    const shareSection = document.createElement('div');
    shareSection.className = 'video-share-section';
    shareSection.style.marginTop = '0px';
    // Tạo một container cho icon và chữ chia sẻ nằm cùng hàng và nhỏ lại
    const shareLabelRow = document.createElement('div');
    shareLabelRow.style.display = 'flex';
    shareLabelRow.style.alignItems = 'center';
    shareLabelRow.style.gap = '6px';
    shareLabelRow.style.fontSize = '0.98rem';

    // Icon chia sẻ nhỏ
    const shareIcon = document.createElement('span');
    shareIcon.innerHTML = '<iconify-icon icon="mdi:share-variant" width="18" height="18"></iconify-icon>';
    shareIcon.style.display = 'inline-flex';
    shareIcon.style.verticalAlign = 'middle';

    // Chữ chia sẻ nhỏ lại
    const shareLabel = document.createElement('span');
    shareLabel.className = 'video-share-label';
    shareLabel.textContent = 'Chia sẻ video:';
    shareLabel.style.fontSize = '0.98rem';
    shareLabel.style.margin = '0';

    shareLabelRow.appendChild(shareIcon);
    shareLabelRow.appendChild(shareLabel);
    shareSection.appendChild(shareLabelRow);

    const shareRow = document.createElement('div');
    shareRow.className = 'video-share-row';
    shareRow.style.gap = '20px'; // nhỏ lại một xíu
    const platforms = [
        { name: 'youtube', label: 'YouTube', icon: 'mdi:youtube', color: 'text-red-600' },
        { name: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok', color: 'text-black' },
        { name: 'facebook', label: 'Facebook', icon: 'mdi:facebook', color: 'text-blue-600' }
    ];

    platforms.forEach(platform => {
        const shareItem = document.createElement('div');
        shareItem.className = `share-item-preview`;
        const btn = document.createElement('button');
        btn.className = `share-btn ${platform.name}`;
        btn.innerHTML = `<iconify-icon icon="${platform.icon}" width="32" height="32"></iconify-icon>`;
        btn.type = 'button';
        const statusSpan = document.createElement('span');
        statusSpan.className = `share-status-preview ${platform.name}-status`;
        statusSpan.textContent = 'Chưa chia sẻ';
        shareItem.appendChild(btn);
        shareItem.appendChild(statusSpan);
        shareRow.appendChild(shareItem);
    });
    shareSection.appendChild(shareRow);

    // Gắn các phần tử vào videoCard theo layout mới
    videoCard.appendChild(videoElem);
    videoCard.appendChild(titleDiv);
    videoCard.appendChild(descDiv);
    videoCard.appendChild(statsDiv);
    videoCard.appendChild(actionDiv);
    videoCard.appendChild(shareSection);

    // Hiển thị videoCard ra ngoài
    videoListContainer.appendChild(videoCard);

    // Xử lý phụ đề (ẩn/hiện)
    if (videoInfo.subtitleUrl) {
        subtitleBtn.addEventListener('click', () => {
            const tracks = videoElem.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].kind === 'subtitles') {
                    if (tracks[i].mode === 'showing') {
                        tracks[i].mode = 'hidden';
                        subtitleBtn.classList.remove('active');
                    } else {
                        tracks[i].mode = 'showing';
                        subtitleBtn.classList.add('active');
                    }
                }
            }
        });
    }

    // Xử lý nút Edit
    editBtn.addEventListener('click', () => {
        alert('Chuyển đến trang chỉnh sửa video');
        // window.location.href = 'edit-video.html'; // Tùy chỉnh nếu có trang chỉnh sửa
    });

    // Xử lý nút Download
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = videoInfo.url;
        link.download = `video-${videoInfo.title ? videoInfo.title.replace(/\s+/g, '_') : 'preview'}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Hàm cập nhật trạng thái chia sẻ trên giao diện
    function updateShareStatusUI(platform, isShared) {
        const statusSpan = videoListContainer.querySelector(`.share-status-preview.${platform}-status`);
        const shareItem = statusSpan ? statusSpan.closest('.share-item-preview') : null;
        if (shareItem && statusSpan) {
            if (isShared) {
                shareItem.classList.add('shared');
                statusSpan.textContent = 'Đã chia sẻ';
            } else {
                shareItem.classList.remove('shared');
                statusSpan.textContent = 'Chưa chia sẻ';
            }
        }
    }

    // Hàm xử lý chia sẻ
    function handleShare(platform, url) {
        let shareUrl = '';
        if (platform === 'youtube') {
            shareUrl = `https://www.youtube.com/share?url=${encodeURIComponent(url)}`;
        } else if (platform === 'tiktok') {
            shareUrl = `https://www.tiktok.com/share/video/${encodeURIComponent(url)}`;
        } else if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        }
        window.open(shareUrl, '_blank');

        // Simulate share success and update state after a short delay
        setTimeout(() => {
            const sharedState = JSON.parse(localStorage.getItem('videoPreviewSharedState') || '{}');
            if (!sharedState[url]) sharedState[url] = {};
            sharedState[url][platform] = true;
            localStorage.setItem('videoPreviewSharedState', JSON.stringify(sharedState));
            updateShareStatusUI(platform, true);
        }, 1000);
    }

    // Load trạng thái chia sẻ ban đầu từ localStorage
    const sharedState = JSON.parse(localStorage.getItem('videoPreviewSharedState') || '{}');
    const videoSharedPlatforms = sharedState[videoInfo.url] || {};
    platforms.forEach(p => updateShareStatusUI(p.name, videoSharedPlatforms[p.name]));

    // Gắn event cho các nút chia sẻ
    platforms.forEach(p => {
        const btn = videoListContainer.querySelector(`.share-btn.${p.name}`);
        if (btn) {
            btn.addEventListener('click', () => handleShare(p.name, videoInfo.url));
        }
    });

    // Xóa tiêu đề ngoài card nếu có
    const outerTitle = document.querySelector('.container h2.text-2xl');
    if (outerTitle) outerTitle.remove();
});

// Không còn hàm loadHomepageVideos vì chỉ hiển thị 1 video preview
