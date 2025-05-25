document.addEventListener('DOMContentLoaded', () => {
    const imageListDiv = document.getElementById('image-list');

    // Function to create an image card HTML element
    const createImageCard = (image) => {
        const card = document.createElement('div');
        card.classList.add('image-card');

        card.innerHTML = `
            <img src="${image.url}" alt="${image.title}" class="image-thumbnail">
            <div class="image-details">
                <h3 class="image-title">${image.title}</h3>
                <p class="image-description">${image.description}</p>
            </div>
            <div class="image-actions">
                <button class="action-button view-button" data-id="${image.id}">
                    <iconify-icon icon="mdi:eye"></iconify-icon>
                    Xem
                </button>
                <button class="action-button download-button" data-id="${image.id}">
                    <iconify-icon icon="mdi:download"></iconify-icon>
                    Tải xuống
                </button>
                <button class="action-button delete-button" data-id="${image.id}">
                    <iconify-icon icon="mdi:delete"></iconify-icon>
                    Xóa
                </button>
            </div>
        `;

        // Add event listeners to buttons
        card.querySelector('.view-button').addEventListener('click', () => {
            // TODO: Implement view logic
            alert('Xem hình ảnh: ' + image.title);
            // Example: Redirect to a view page or open a modal
            // window.location.href = `image-preview.html?id=${image.id}`;
        });

        card.querySelector('.download-button').addEventListener('click', () => {
            // TODO: Implement download logic
            alert('Tải xuống hình ảnh: ' + image.title);
            // Example: Trigger file download
            // window.open(image.url, '_blank');
        });

        card.querySelector('.delete-button').addEventListener('click', () => {
            // TODO: Implement delete logic
            if (confirm(`Bạn có chắc chắn muốn xóa hình ảnh "${image.title}"?`)) {
                alert('Xóa hình ảnh: ' + image.title);
                // Example: Call API to delete image
                // deleteImage(image.id);
            }
        });

        return card;
    };

    // Function to load and display images
    const loadImages = () => {
        // TODO: Fetch image data from backend API
        // For now, use dummy data
        const dummyImages = [
            {
                id: 1,
                url: 'https://via.placeholder.com/300/FF5733/FFFFFF?text=Image+1',
                title: 'Hình ảnh Mẫu 1',
                description: 'Mô tả ngắn gọn cho hình ảnh mẫu 1.'
            },
            {
                id: 2,
                url: 'https://via.placeholder.com/300/33FF57/FFFFFF?text=Image+2',
                title: 'Hình ảnh Mẫu 2',
                description: 'Mô tả ngắn gọn cho hình ảnh mẫu 2.'
            },
            {
                id: 3,
                url: 'https://via.placeholder.com/300/3357FF/FFFFFF?text=Image+3',
                title: 'Hình ảnh Mẫu 3',
                description: 'Mô tả ngắn gọn cho hình ảnh mẫu 3.'
            },
            {
                id: 4,
                url: 'https://via.placeholder.com/300/FF33A1/FFFFFF?text=Image+4',
                title: 'Hình ảnh Mẫu 4',
                description: 'Mô tả ngắn gọn cho hình ảnh mẫu 4.'
            },
             {
                id: 5,
                url: 'https://via.placeholder.com/300/A133FF/FFFFFF?text=Image+5',
                title: 'Hình ảnh Mẫu 5',
                description: 'Mô tả ngắn gọn cho hình ảnh mẫu 5.'
            },
        ];

        // Clear current list
        imageListDiv.innerHTML = '';

        // Add each image to the list
        dummyImages.forEach(image => {
            const card = createImageCard(image);
            imageListDiv.appendChild(card);
        });
    };

    // Load images when the page loads
    loadImages();
}); 