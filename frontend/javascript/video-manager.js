document.addEventListener('DOMContentLoaded', () => {
    // Lấy thời lượng video và hiển thị
    document.querySelectorAll('video').forEach(video => {
        video.addEventListener('loadedmetadata', () => {
            const duration = video.duration; // Thời lượng tính bằng giây
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
            const durationSpan = video.parentElement.querySelector('span');
            if (durationSpan) {
                durationSpan.textContent = `${minutes}:${seconds}`;
            }
        });
    });

    // Xử lý các nút hành động
    const downloadButtons = document.querySelectorAll('.text-blue-500');
    const editButtons = document.querySelectorAll('.text-yellow-500');
    const deleteButtons = document.querySelectorAll('.text-red-500');

    // Xử lý nút Tải xuống
    downloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const videoName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
            alert(`Tải xuống: ${videoName}`);
            const link = document.createElement('a');
            link.href = '#'; // Thay bằng URL video thực tế
            link.download = `${videoName}.mp4`;
            link.click();
        });
    });

    // Xử lý nút Chỉnh sửa
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const videoName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
            alert(`Chỉnh sửa: ${videoName}`);
            window.location.href = `edit-video.html?video=${encodeURIComponent(videoName)}`;
        });
    });

    // Xử lý nút Xóa
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn xóa video này?')) {
                const videoName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
                button.closest('tr').remove();
                alert(`Đã xóa: ${videoName}`);
            }
        });
    });
});