document.addEventListener('DOMContentLoaded', () => {
    // Get video info from sessionStorage
    const videoInfo = JSON.parse(sessionStorage.getItem('currentVideo'));

    const previewVideo = document.getElementById('previewVideo');
    const previewTitle = document.getElementById('previewTitle');
    const previewDesc = document.getElementById('previewDesc');
    const previewViewCount = document.getElementById('previewViewCount');
    const subtitleBtn = document.getElementById('subtitleBtn');

    // Get share buttons and status elements
    const youtubeShareBtn = document.querySelector('.share-btn.youtube');
    const tiktokShareBtn = document.querySelector('.share-btn.tiktok');
    const facebookShareBtn = document.querySelector('.share-btn.facebook');
    const youtubeStatusSpan = document.querySelector('.share-status-preview.youtube-status');
    const tiktokStatusSpan = document.querySelector('.share-status-preview.tiktok-status');
    const facebookStatusSpan = document.querySelector('.share-status-preview.facebook-status');

    // Hàm cập nhật trạng thái chia sẻ trên giao diện
    const updateShareStatusUI = (platform, isShared) => {
        const shareItem = document.querySelector(`.share-item-preview .share-btn.${platform}`).closest('.share-item-preview');
        const statusSpan = shareItem.querySelector('.share-status-preview');
        if (isShared) {
            shareItem.classList.add('shared');
            statusSpan.textContent = 'Đã chia sẻ';
        } else {
            shareItem.classList.remove('shared');
            statusSpan.textContent = 'Chưa chia sẻ';
        }
    };

    // Hàm xử lý chia sẻ
    const handleShare = (platform, url, buttonElement) => {
        let shareUrl = '';
        if (platform === 'youtube') {
            shareUrl = `https://www.youtube.com/share?url=${encodeURIComponent(url)}`;
        } else if (platform === 'tiktok') {
            shareUrl = `https://www.tiktok.com/share/video/${encodeURIComponent(url)}`; // Example
        } else if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        }

        window.open(shareUrl, '_blank');

        // Simulate share success and update state after a short delay
        setTimeout(() => {
            const sharedState = JSON.parse(localStorage.getItem('videoPreviewSharedState') || '{}');

            if (!sharedState[url]) {
                sharedState[url] = {};
            }

            sharedState[url][platform] = true; // Mark as shared for this platform

            localStorage.setItem('videoPreviewSharedState', JSON.stringify(sharedState));

            // Update UI for the specific platform
            updateShareStatusUI(platform, true);

        }, 1000); // Delay to allow share window to open
    };

    if (videoInfo) {
        // Set video source, title, description, and view count
        previewVideo.src = videoInfo.url;
        previewTitle.textContent = videoInfo.title;
        previewDesc.textContent = videoInfo.description;
        previewViewCount.innerHTML = `<iconify-icon icon="mdi:eye"></iconify-icon> ${videoInfo.views || 'N/A'} lượt xem`; // Display view count

        // Handle subtitle track if available
        if (videoInfo.subtitleUrl) {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = 'Tiếng Việt'; // Or dynamic label
            track.srclang = 'vi'; // Or dynamic language code
            track.src = videoInfo.subtitleUrl;
            track.default = true; // Optional: make it default
            previewVideo.appendChild(track);
            subtitleBtn.style.display = 'flex'; // Show subtitle button

            // Add event listener for subtitle button
            subtitleBtn.addEventListener('click', () => {
                // Find the subtitle track
                for (let i = 0; i < previewVideo.textTracks.length; i++) {
                    const track = previewVideo.textTracks[i];
                    if (track.kind === 'subtitles') {
                        if (track.mode === 'showing') {
                            track.mode = 'hidden'; // Hide subtitles
                            subtitleBtn.classList.remove('active');
                        } else {
                            track.mode = 'showing'; // Show subtitles
                            subtitleBtn.classList.add('active');
                        }
                    }
                }
            });

        } else {
            subtitleBtn.style.display = 'none'; // Hide subtitle button if no track
        }

        // Load and update initial share status from localStorage
        const sharedState = JSON.parse(localStorage.getItem('videoPreviewSharedState') || '{}');
        const videoSharedPlatforms = sharedState[videoInfo.url] || {};

        updateShareStatusUI('youtube', videoSharedPlatforms.youtube);
        updateShareStatusUI('tiktok', videoSharedPlatforms.tiktok);
        updateShareStatusUI('facebook', videoSharedPlatforms.facebook);

        // Add event listeners for share buttons
        youtubeShareBtn.addEventListener('click', () => handleShare('youtube', videoInfo.url, youtubeShareBtn));
        tiktokShareBtn.addEventListener('click', () => handleShare('tiktok', videoInfo.url, tiktokShareBtn));
        facebookShareBtn.addEventListener('click', () => handleShare('facebook', videoInfo.url, facebookShareBtn));

    } else {
        // Handle case where no video info is found (e.g., direct access)
        console.error('No video info found in sessionStorage.');
        previewTitle.textContent = 'Không tìm thấy thông tin video';
        previewDesc.textContent = 'Vui lòng chọn video từ trang quản lý.';
        previewViewCount.style.display = 'none'; // Hide view count
        document.querySelector('.share-section-preview').style.display = 'none'; // Hide share section
        previewVideo.style.display = 'none'; // Hide video element
        document.querySelector('.action-buttons-preview').style.display = 'none'; // Hide action buttons
    }

    // TODO: Add logic for Edit, Download, Delete buttons if needed
    // Example:
    // document.getElementById('editBtn').addEventListener('click', () => {
    //     // Use videoInfo.id or other details for editing
    //     alert('Edit video: ' + videoInfo.title);
    // });

    // Note: Your HTML for video controls seems to be default browser controls (<video controls>).
    // If you plan to build custom controls, you'll need to add JS logic here
    // for play/pause, seek, volume, fullscreen, etc.

    const playPauseBtn = document.getElementById('playPauseBtn');
    const seekBar = document.getElementById('seekBar');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const editBtn = document.getElementById('editBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Hàm định dạng thời gian (phút:giây)
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };

    // Khi metadata video tải xong, cập nhật thời lượng
    previewVideo.addEventListener('loadedmetadata', () => {
        seekBar.max = previewVideo.duration;
        duration.textContent = formatTime(previewVideo.duration);
    });

    // Cập nhật thanh tiến trình và thời gian hiện tại
    previewVideo.addEventListener('timeupdate', () => {
        seekBar.value = previewVideo.currentTime;
        currentTime.textContent = formatTime(previewVideo.currentTime);
    });

    // Phát/Tạm dừng video
    playPauseBtn.addEventListener('click', () => {
        if (previewVideo.paused) {
            previewVideo.play();
            playPauseBtn.innerHTML = '<iconify-icon icon="mdi:pause" width="24" height="24"></iconify-icon>';
        } else {
            previewVideo.pause();
            playPauseBtn.innerHTML = '<iconify-icon icon="mdi:play" width="24" height="24"></iconify-icon>';
        }
    });

    // Điều khiển video bằng thanh tiến trình
    seekBar.addEventListener('input', () => {
        previewVideo.currentTime = seekBar.value;
    });

    // Xử lý nút Edit
    editBtn.addEventListener('click', () => {
        alert('Chuyển đến trang chỉnh sửa video');
        // Thêm logic chuyển hướng (ví dụ: window.location.href = 'edit-video.html')
    });

    // Xử lý nút Download
    downloadBtn.addEventListener('click', () => {
        alert('Tải video xuống');
        const link = document.createElement('a');
        link.href = previewVideo.src; // Use the actual video source for download
        link.download = `video-${videoInfo.title || 'preview'}.mp4`; // Suggest filename
        link.click();
    });

    // Điều khiển âm lượng
    volumeSlider.addEventListener('input', () => {
        previewVideo.volume = volumeSlider.value;
        updateVolumeIcon();
    });

    // Chuyển đổi Mute/Unmute khi nhấn nút âm lượng
    volumeBtn.addEventListener('click', () => {
        if (previewVideo.muted) {
            previewVideo.muted = false;
            // Restore previous volume if it was 0 when muted
            if (previewVideo.volume === 0) {
                previewVideo.volume = 1; // Or restore from a saved value
                volumeSlider.value = 1;
            }
        } else {
            previewVideo.muted = true;
            volumeSlider.value = 0;
        }
        updateVolumeIcon();
    });

    // Cập nhật icon âm lượng dựa trên trạng thái và mức âm lượng
    const updateVolumeIcon = () => {
        if (previewVideo.muted || previewVideo.volume === 0) {
            volumeBtn.innerHTML = '<iconify-icon icon="mdi:volume-mute"></iconify-icon>';
        } else if (previewVideo.volume > 0 && previewVideo.volume < 0.5) {
            volumeBtn.innerHTML = '<iconify-icon icon="mdi:volume-low"></iconify-icon>';
        } else {
            volumeBtn.innerHTML = '<iconify-icon icon="mdi:volume-high"></iconify-icon>';
        }
    };

    // Initial volume slider and icon state
    // volumeSlider.value = previewVideo.volume; // Sync slider with initial video volume - causes error if video not loaded
    updateVolumeIcon(); // Set initial icon

    // Listen for volume changes outside of slider (e.g., browser controls if they were enabled)
    previewVideo.addEventListener('volumechange', () => {
        volumeSlider.value = previewVideo.volume;
        updateVolumeIcon();
    });

    // Phóng to toàn màn hình
    fullscreenBtn.addEventListener('click', () => {
        const playerContainer = document.querySelector('.video-player-container');
        if (!document.fullscreenElement) {
            if (playerContainer.requestFullscreen) {
                playerContainer.requestFullscreen();
            } else if (playerContainer.webkitRequestFullscreen) { // Safari
                playerContainer.webkitRequestFullscreen();
            } else if (playerContainer.msRequestFullscreen) { // IE11
                playerContainer.msRequestFullscreen();
            }
            fullscreenBtn.innerHTML = '<iconify-icon icon="mdi:fullscreen-exit" width="24" height="24"></iconify-icon>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE11
                document.msExitFullscreen();
            }
            fullscreenBtn.innerHTML = '<iconify-icon icon="mdi:fullscreen" width="24" height="24"></iconify-icon>';
        }
    });

    // Thoát toàn màn hình thì cập nhật giao diện
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<iconify-icon icon="mdi:fullscreen" width="24" height="24"></iconify-icon>';
        } else {
            fullscreenBtn.innerHTML = '<iconify-icon icon="mdi:fullscreen-exit" width="24" height="24"></iconify-icon>';
        }
    });
});