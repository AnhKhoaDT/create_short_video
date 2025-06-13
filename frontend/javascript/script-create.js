document.addEventListener('DOMContentLoaded', () => {
    const scriptContentInput = document.getElementById('scriptContent');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const charCount = document.getElementById('charCount');

    // Ban đầu: không cho sửa
    scriptContentInput.setAttribute('readonly', true);

    // Hiển thị nội dung kịch bản và cập nhật số ký tự
    const createdScript = localStorage.getItem('createdScriptContent');
    if (createdScript && scriptContentInput) {
        try {
            const data = JSON.parse(createdScript);
            let content = `Tiêu đề: ${data.title}\n\n`;
            if (Array.isArray(data.scenes)) {
                data.scenes.forEach(scene => {
                    content += `Cảnh ${scene.sceneNumber}:\n`;
                    content += `Mô tả: ${scene.description}\n`;
                    content += `Hội thoại: ${scene.dialogue}\n`;
                    content += `Gợi ý hình ảnh: ${scene.imagePrompt}\n\n`;
                });
            }
            scriptContentInput.value = content.trim();
        } catch (e) {
            scriptContentInput.value = '';
        }
        // Cập nhật số ký tự khi load
        if (charCount) {
            charCount.textContent = `${scriptContentInput.value.length} ký tự`;
        }
        // localStorage.removeItem('createdScriptContent');
    }

    // Cập nhật số ký tự khi nhập
    scriptContentInput.addEventListener('input', function() {
        if (charCount) {
            charCount.textContent = `${this.value.length} ký tự`;
        }
    });

    // Xử lý nút chỉnh sửa/lưu
    regenerateBtn.addEventListener('click', function() {
        if (scriptContentInput.hasAttribute('readonly')) {
            // Đổi sang cho phép sửa
            scriptContentInput.removeAttribute('readonly');
            regenerateBtn.innerHTML = `<iconify-icon icon="mdi:content-save" class="mr-1"></iconify-icon>Lưu kịch bản`;
            scriptContentInput.focus();
        } else {
            // Đổi sang không cho sửa và lưu lại nếu muốn
            scriptContentInput.setAttribute('readonly', true);
            regenerateBtn.innerHTML = `<iconify-icon icon="mdi:refresh" class="mr-1"></iconify-icon>Chỉnh sửa kịch bản`;
            // Lưu lại nội dung mới vào localStorage
            localStorage.setItem('createdScriptContent', JSON.stringify({
                content: scriptContentInput.value
            }));
        }
    });
});