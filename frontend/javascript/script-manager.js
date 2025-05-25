document.addEventListener('DOMContentLoaded', () => {
    const scriptListDiv = document.getElementById('script-list');

    // Function to create a script entry HTML element
    const createScriptEntry = (script) => {
        const entry = document.createElement('div');
        entry.classList.add('script-entry');

        entry.innerHTML = `
            <div class="script-details">
                <h3 class="script-title">${script.title}</h3>
                <p class="script-summary">${script.summary}</p>
            </div>
            <div class="script-actions">
                <button class="action-button edit-button" data-id="${script.id}">
                    <iconify-icon icon="mdi:pencil"></iconify-icon>
                    Sửa
                </button>
                <button class="action-button generate-video-button" data-id="${script.id}">
                    <iconify-icon icon="mdi:video-plus"></iconify-icon>
                    Tạo Video
                </button>
                <button class="action-button delete-button" data-id="${script.id}">
                    <iconify-icon icon="mdi:delete"></iconify-icon>
                    Xóa
                </button>
            </div>
        `;

        // Add event listeners to buttons
        entry.querySelector('.edit-button').addEventListener('click', () => {
            // TODO: Implement edit logic
            alert('Chỉnh sửa kịch bản: ' + script.title);
            // Example: Redirect to an edit page
            // window.location.href = `script-edit.html?id=${script.id}`;
        });

        entry.querySelector('.generate-video-button').addEventListener('click', () => {
            // TODO: Implement generate video logic
            alert('Tạo video từ kịch bản: ' + script.title);
            // Example: Redirect to video creation page with script data
            // window.location.href = `video-create.html?scriptId=${script.id}`; // Assuming a video creation page
        });

        entry.querySelector('.delete-button').addEventListener('click', () => {
            // TODO: Implement delete logic
            if (confirm(`Bạn có chắc chắn muốn xóa kịch bản "${script.title}"?`)) {
                alert('Xóa kịch bản: ' + script.title);
                // Example: Call API to delete script
                // deleteScript(script.id);
            }
        });

        return entry;
    };

    // Function to load and display scripts
    const loadScripts = () => {
        // TODO: Fetch script data from backend API
        // For now, use dummy data
        const dummyScripts = [
            {
                id: 1,
                title: 'Kịch bản Video Quảng cáo Sản phẩm X',
                summary: 'Kịch bản chi tiết cho video quảng cáo sản phẩm X, tập trung vào tính năng nổi bật...'
            },
            {
                id: 2,
                title: 'Kịch bản Video Giới thiệu Công ty',
                summary: 'Kịch bản video giới thiệu về lịch sử, giá trị cốt lõi và tầm nhìn của công ty...'
            },
            {
                id: 3,
                title: 'Kịch bản Video Hướng dẫn Sử dụng Tính năng Y',
                summary: 'Kịch bản từng bước hướng dẫn người dùng cách sử dụng hiệu quả tính năng Y...'
            },
        ];

        // Clear current list
        scriptListDiv.innerHTML = '';

        // Add each script to the list
        dummyScripts.forEach(script => {
            const entry = createScriptEntry(script);
            scriptListDiv.appendChild(entry);
        });
    };

    // Load scripts when the page loads
    loadScripts();
}); 