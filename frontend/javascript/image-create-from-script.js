document.addEventListener('DOMContentLoaded', () => {
    const scriptInput = document.getElementById('scriptInput');
    const generateImagesBtn = document.getElementById('generateImagesBtn');
    const imageGrid = document.getElementById('imageGrid');
    const scriptEditor = document.getElementById('scriptEditor');
    const saveScriptBtn = document.getElementById('saveScriptBtn');
    const editScriptBtn = document.getElementById('editScriptBtn');

    // Handle sample image selection
    const sampleImages = document.querySelectorAll('.group');
    sampleImages.forEach(image => {
        const selectButton = image.querySelector('button');
        selectButton.addEventListener('click', (e) => {
            e.preventDefault();
            const imgSrc = image.querySelector('img').src;
            
            // Clear previous selections
            sampleImages.forEach(img => img.classList.remove('ring-2', 'ring-blue-500'));
            
            // Mark selected image
            image.classList.add('ring-2', 'ring-blue-500');
        });
    });

    // Function to create an image card
    const createImageCard = (imageUrl) => {
        const card = document.createElement('div');
        card.classList.add('relative', 'group');
        card.innerHTML = `
            <img src="${imageUrl}" alt="Generated Image" class="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <button class="btn-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    <iconify-icon icon="mdi:check" class="mr-1"></iconify-icon>
                    Chọn
                </button>
            </div>
        `;

        // Add click handler for selection
        const selectButton = card.querySelector('button');
        selectButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear previous selections
            document.querySelectorAll('.group').forEach(img => img.classList.remove('ring-2', 'ring-blue-500'));
            
            // Mark selected image
            card.classList.add('ring-2', 'ring-blue-500');
        });

        return card;
    };

    // Function to simulate image generation (replace with actual API call)
    const generateImages = async (script) => {
        console.log('Generating images for script:', script);
        // In a real application, you would call your backend API here.
        // Example: fetch('/api/generate-images', { method: 'POST', body: JSON.stringify({ script }) });

        // Simulate an API call delay and return dummy image URLs
        return new Promise(resolve => {
            setTimeout(() => {
                // Generate 4 slightly different placeholder images
                const images = Array.from({ length: 4 }, (_, i) => {
                    const timestamp = new Date().getTime();
                    return `https://via.placeholder.com/400/007bff/FFFFFF?text=Generated+Image+${i + 1}+${timestamp}`;
                });
                resolve(images);
            }, 1500); // Simulate 1.5 seconds delay
        });
    };

    // Load script from localStorage
    const createdScript = localStorage.getItem('createdScriptContent');
    if (createdScript && scriptEditor) {
        try {
            const data = JSON.parse(createdScript);
            if (data && typeof data === 'object' && data.content !== undefined) {
                scriptEditor.value = data.content.trim();
            } else if (data && typeof data === 'object' && data.title !== undefined && Array.isArray(data.scenes)) {
                // Nếu là định dạng cũ (có 'title' và 'scenes')
                let content = `Tiêu đề: ${data.title}\n\n`;
                data.scenes.forEach(scene => {
                    content += `Cảnh ${scene.sceneNumber}:\n`;
                    content += `Mô tả: ${scene.description}\n`;
                    content += `Gợi ý hình ảnh: ${scene.imagePrompt}\n\n`;
                });
                scriptEditor.value = content.trim();
            } else {
                scriptEditor.value = createdScript.trim();
            }
        } catch (e) {
            scriptEditor.value = createdScript.trim();
        }
    }

    // Save script to localStorage
    if (saveScriptBtn) {
        saveScriptBtn.addEventListener('click', () => {
            localStorage.setItem('createdScriptContent', JSON.stringify({
                content: scriptEditor.value
            }));
            alert('Đã lưu kịch bản!');
        });
    }

    // Event listener for the generate button
    if (generateImagesBtn) {
        generateImagesBtn.addEventListener('click', async () => {
            const script = document.getElementById('scriptPreview').textContent.trim();

            if (script && script !== 'Đang tải kịch bản...') {
                // Show loading state
                imageGrid.innerHTML = `
                    <div class="col-span-full flex justify-center items-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="ml-3 text-gray-600">Đang tạo hình ảnh...</span>
                    </div>
                `;

                try {
                    const imageUrls = await generateImages(script);
                    
                    // Clear loading state and display generated images
                    imageGrid.innerHTML = '';
                    imageUrls.forEach(url => {
                        const card = createImageCard(url);
                        imageGrid.appendChild(card);
                    });

                } catch (error) {
                    console.error('Error generating images:', error);
                    imageGrid.innerHTML = `
                        <div class="col-span-full text-center py-4">
                            <p class="text-red-500">Đã xảy ra lỗi khi tạo hình ảnh.</p>
                        </div>
                    `;
                }
            } else {
                alert('Vui lòng đảm bảo kịch bản đã được tải.');
            }
        });
    }

    if (editScriptBtn && scriptEditor) {
        editScriptBtn.addEventListener('click', () => {
            if (scriptEditor.hasAttribute('readonly')) {
                // Chuyển sang cho phép sửa
                scriptEditor.removeAttribute('readonly');
                editScriptBtn.innerHTML = `<iconify-icon icon="mdi:content-save" class="mr-1"></iconify-icon>Lưu kịch bản`;
                scriptEditor.focus();
            } else {
                // Lưu lại và chuyển về readonly
                scriptEditor.setAttribute('readonly', true);
                editScriptBtn.innerHTML = `<iconify-icon icon="mdi:refresh" class="mr-1"></iconify-icon>Chỉnh sửa kịch bản`;
                localStorage.setItem('createdScriptContent', JSON.stringify({
                    content: scriptEditor.value
                }));
                alert('Đã lưu kịch bản!');
            }
        });
    }
}); 