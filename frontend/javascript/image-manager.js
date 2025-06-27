document.addEventListener('DOMContentLoaded', () => {
    const imageListDiv = document.getElementById('image-list');

    // Function to create an image card HTML element
    const createImageCard = (image) => {
        const card = document.createElement('div');
        card.classList.add('image-card');

        card.innerHTML = `
            <img src="${image.url}" alt="${image.title || ''}" class="image-thumbnail">
            <div class="image-details">
                <h3 class="image-title">${image.title || ''}</h3>
                <p class="image-description">${image.description || ''}</p>
            </div>
            <div class="image-actions">
                <button class="action-button view-button" data-id="${image.id || ''}">
                    <iconify-icon icon="mdi:eye"></iconify-icon>
                    Xem
                </button>
                <button class="action-button download-button" data-id="${image.id || ''}">
                    <iconify-icon icon="mdi:download"></iconify-icon>
                    Tải xuống
                </button>
                <button class="action-button delete-button" data-id="${image.id || ''}">
                    <iconify-icon icon="mdi:delete"></iconify-icon>
                    Xóa
                </button>
            </div>
        `;

        // Add event listeners to buttons
        card.querySelector('.view-button').addEventListener('click', () => {
            alert('Xem hình ảnh: ' + (image.title || image.url));
        });

        card.querySelector('.download-button').addEventListener('click', () => {
            window.open(image.url, '_blank');
        });

        card.querySelector('.delete-button').addEventListener('click', async () => {
            if (confirm(`Bạn có chắc chắn muốn xóa hình ảnh "${image.title || image.url}"?`)) {
                // Nếu có id (ảnh đã lưu DB), xóa qua API xóa DB và Cloudinary
                if (image.id) {
                    await fetch(`http://localhost:8080/create-video-service/images/${image.id}`, { method: 'DELETE' });
                } else {
                    // Nếu chỉ có url (chỉ trên Cloudinary)
                    await fetch('http://localhost:8080/create-video-service/images/delete-by-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: image.url })
                    });
                }
                loadImages();
            }
        });

        return card;
    };

    // Function to load and display images
    const loadImages = async () => {
        try {
            // Lấy ảnh từ DB
            const dbRes = await fetch('http://localhost:8080/create-video-service/images');
            const dbImages = await dbRes.json();
            // Lấy ảnh từ Cloudinary
            const cloudRes = await fetch('http://localhost:8080/create-video-service/images/cloudinary');
            const cloudImages = await cloudRes.json();

            // Gộp hai nguồn, ưu tiên ảnh DB (có id)
            const dbUrls = dbImages.map(img => img.url);
            const allImages = [
                ...dbImages,
                ...cloudImages.filter(url => !dbUrls.includes(url)).map(url => ({ url }))
            ];

            imageListDiv.innerHTML = '';
            allImages.forEach(image => {
                const card = createImageCard(image);
                imageListDiv.appendChild(card);
            });
        } catch (err) {
            imageListDiv.innerHTML = '<p class="text-red-500">Không thể tải danh sách ảnh.</p>';
        }
    };

    // Load images when the page loads
    loadImages();
});

// Hàm mở modal chọn ảnh
function openImageSelectModal(onSelect) {
    const modal = document.getElementById('imageSelectModal');
    const modalImageList = document.getElementById('modalImageList');
    modal.style.display = 'block';
    modalImageList.innerHTML = '<p>Đang tải ảnh...</p>';

    // Lấy ảnh từ backend
    Promise.all([
        fetch('http://localhost:8080/create-video-service/images').then(res => res.json()),
        fetch('http://localhost:8080/create-video-service/images/cloudinary').then(res => res.json())
    ]).then(([dbImages, cloudImages]) => {
        const dbUrls = dbImages.map(img => img.url);
        const allImages = [
            ...dbImages,
            ...cloudImages.filter(url => !dbUrls.includes(url)).map(url => ({ url }))
        ];
        modalImageList.innerHTML = '';
        allImages.forEach(image => {
            const imgEl = document.createElement('img');
            imgEl.src = image.url;
            imgEl.className = 'modal-image-thumb';
            imgEl.onclick = () => {
                modal.style.display = 'none';
                onSelect(image.url); // callback khi chọn ảnh
            };
            modalImageList.appendChild(imgEl);
        });
    });

    // Đóng modal khi nhấn nút đóng
    document.getElementById('closeImageModal').onclick = () => {
        modal.style.display = 'none';
    };
} 