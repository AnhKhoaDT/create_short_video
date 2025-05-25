document.addEventListener('DOMContentLoaded', () => {
    const scriptInput = document.getElementById('scriptInput');
    const generateImageBtn = document.getElementById('generateImageBtn');
    const imagePreviewArea = document.getElementById('imagePreviewArea');

    // Function to simulate image generation (replace with actual API call)
    const generateImage = async (script) => {
        console.log('Generating image for script:', script);
        // In a real application, you would call your backend API here.
        // Example: fetch('/api/generate-image', { method: 'POST', body: JSON.stringify({ script }) });

        // Simulate an API call delay and return a dummy image URL
        return new Promise(resolve => {
            setTimeout(() => {
                // Generate a slightly different placeholder image each time
                const timestamp = new Date().getTime();
                const imageUrl = `https://via.placeholder.com/400/007bff/FFFFFF?text=Generated+Image+${timestamp}`; // Blue placeholder
                resolve(imageUrl);
            }, 1500); // Simulate 1.5 seconds delay
        });
    };

    // Event listener for the generate button
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', async () => {
            const script = scriptInput.value.trim();

            if (script) {
                // Disable button and show loading indicator if needed
                generateImageBtn.disabled = true;
                generateImageBtn.innerHTML = '<iconify-icon icon="mdi:loading"></iconify-icon> Đang tạo...';

                // Clear previous preview
                imagePreviewArea.innerHTML = '';

                try {
                    const imageUrl = await generateImage(script);
                    
                    // Display the generated image
                    const imgElement = document.createElement('img');
                    imgElement.src = imageUrl;
                    imgElement.alt = 'Generated Image';
                    imagePreviewArea.appendChild(imgElement);

                } catch (error) {
                    console.error('Error generating image:', error);
                    imagePreviewArea.innerHTML = '<p class="text-red-500">Đã xảy ra lỗi khi tạo hình ảnh.</p>';
                } finally {
                    // Re-enable button
                    generateImageBtn.disabled = false;
                    generateImageBtn.innerHTML = '<iconify-icon icon="mdi:image-plus"></iconify-icon> Tạo Hình ảnh';
                }

            } else {
                alert('Vui lòng nhập script hoặc mô tả để tạo hình ảnh.');
            }
        });
    }
}); 