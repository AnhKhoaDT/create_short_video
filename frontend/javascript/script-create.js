document.addEventListener('DOMContentLoaded', () => {
    const scriptContentInput = document.getElementById('scriptContent');
    const createScriptBtn = document.getElementById('createScriptBtn');

    // Function to simulate script creation (replace with actual API call)
    const createScript = async (content) => {
        console.log('Creating script with content:', content);
        // In a real application, you would call your backend API here.
        // Example: fetch('/api/scripts', { method: 'POST', body: JSON.stringify({ content }) });

        // Simulate an API call delay
        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate a successful creation
                resolve({ success: true, message: 'Kịch bản đã được tạo thành công!' });
            }, 1000); // Simulate 1 second delay
        });
    };

    // Event listener for the create button
    if (createScriptBtn) {
        createScriptBtn.addEventListener('click', async () => {
            const content = scriptContentInput.value.trim();

            if (content) {
                // Disable button and show loading indicator if needed
                createScriptBtn.disabled = true;
                createScriptBtn.innerHTML = '<iconify-icon icon="mdi:plus-circle"></iconify-icon> Đang tạo...';

                try {
                    const result = await createScript(content);
                    
                    if (result.success) {
                        alert(result.message);
                        scriptContentInput.value = '';
                    } else {
                        alert('Tạo kịch bản thất bại.');
                    }

                } catch (error) {
                    console.error('Error creating script:', error);
                    alert('Đã xảy ra lỗi khi tạo kịch bản.');
                } finally {
                    // Re-enable button
                    createScriptBtn.disabled = false;
                    createScriptBtn.innerHTML = '<iconify-icon icon="mdi:plus-circle"></iconify-icon> Tạo Kịch bản';
                }

            } else {
                alert('Vui lòng nhập nội dung kịch bản.');
            }
        });
    }
}); 