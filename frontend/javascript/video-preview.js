document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('previewVideo');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const seekBar = document.getElementById('seekBar');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const editBtn = document.getElementById('editBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Hàm định dạng thời gian (phút:giây)
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };

    // Khi metadata video tải xong, cập nhật thời lượng
    video.addEventListener('loadedmetadata', () => {
        seekBar.max = video.duration;
        duration.textContent = formatTime(video.duration);
    });

    // Cập nhật thanh tiến trình và thời gian hiện tại
    video.addEventListener('timeupdate', () => {
        seekBar.value = video.currentTime;
        currentTime.textContent = formatTime(video.currentTime);
    });

    // Phát/Tạm dừng video
    playPauseBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<iconify-icon icon="mdi:pause" width="24" height="24"></iconify-icon>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<iconify-icon icon="mdi:play" width="24" height="24"></iconify-icon>';
        }
    });

    // Điều khiển video bằng thanh tiến trình
    seekBar.addEventListener('input', () => {
        video.currentTime = seekBar.value;
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
        link.href = '#'; // Thay bằng URL video thực tế
        link.download = 'video.mp4';
        link.click();
    });

    // Phóng to toàn màn hình
    fullscreenBtn.addEventListener('click', () => {
        const player = document.querySelector('.video-player');
        if (!document.fullscreenElement) {
            if (player.requestFullscreen) {
                player.requestFullscreen();
            } else if (player.webkitRequestFullscreen) { // Safari
                player.webkitRequestFullscreen();
            } else if (player.msRequestFullscreen) { // IE11
                player.msRequestFullscreen();
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