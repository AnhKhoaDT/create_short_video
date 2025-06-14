console.log('script-create.js: Bắt đầu tải script.');

document.addEventListener('DOMContentLoaded', () => {
    console.log('script-create.js: DOMContentLoaded đã kích hoạt.');

    const scriptContentInput = document.getElementById('scriptContent');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const charCount = document.getElementById('charCount');
    const voiceGrid = document.getElementById('voiceGrid');
    const previewBtn = document.getElementById('previewBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    console.log('script-create.js: previewBtn element:', previewBtn);

    const FPT_AI_VOICES = [
        { id: "banmai", name: "Giọng đọc 1" },
        { id: "thuminh", name: "Giọng đọc 2" },
        { id: "leminh", name: "Giọng đọc 3" },
        { id: "giahuy", name: "Giọng đọc 4" },
        { id: "minhquang", name: "Giọng đọc 5" },
        { id: "ngochuyen", name: "Giọng đọc 6" }
    ];

    let selectedVoice = null;

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

    // Render voice options
    function renderVoiceOptions() {
        voiceGrid.innerHTML = ''; // Clear loading spinner
        FPT_AI_VOICES.forEach(voice => {
            const voiceCard = document.createElement('div');
            voiceCard.classList.add('voice-card', 'p-4', 'border', 'border-gray-200', 'rounded-lg', 'text-center', 'cursor-pointer', 'hover:border-blue-500', 'transition-colors');
            voiceCard.setAttribute('data-voice-id', voice.id);
            voiceCard.innerHTML = `
                <iconify-icon icon="mdi:account-voice" class="text-4xl text-gray-600 mb-2"></iconify-icon>
                <p class="font-semibold text-gray-800">${voice.name}</p>
                <button class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                    <iconify-icon icon="mdi:volume-high" class="mr-1"></iconify-icon>
                    Nghe thử
                </button>
            `;

            // Add click handler for voice selection
            voiceCard.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const currentActive = voiceGrid.querySelector('.voice-card.border-blue-600');
                if (currentActive) {
                    currentActive.classList.remove('border-blue-600', 'bg-blue-50');
                }
                voiceCard.classList.add('border-blue-600', 'bg-blue-50');
                selectedVoice = voice.id;
            });

            // Add click handler for preview button
            const previewButton = voiceCard.querySelector('button');
            previewButton.addEventListener('click', (e) => {
                e.stopPropagation();
                previewVoice(voice.id);
            });

            voiceGrid.appendChild(voiceCard);
        });
    }

    // Function to preview voice
    async function previewVoice(voiceId) {
        if (!scriptContentInput.value.trim()) {
            alert('Vui lòng nhập nội dung kịch bản để nghe thử.');
            return;
        }

        loadingOverlay.classList.remove('hidden');

        try {
            const response = await fetch('http://localhost:8080/create-video-service/tts/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    text: scriptContentInput.value,
                    voice: voiceId
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                if (audioBlob.size > 0 && (audioBlob.type === 'audio/mpeg' || audioBlob.type === 'audio/mp3')) {
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    
                    audio.play().then(() => {
                        console.log('Audio playback started successfully.');
                    }).catch(playError => {
                        console.error('Lỗi khi phát âm thanh:', playError);
                        alert('Không thể phát âm âm thanh. Vui lòng thử lại.');
                    });
                } else {
                    alert('Không nhận được dữ liệu âm thanh hợp lệ từ máy chủ.');
                }
            } else {
                const errorText = await response.text();
                alert(`Lỗi khi nghe thử: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API TTS:', error);
            alert('Có lỗi xảy ra khi kết nối đến dịch vụ TTS. Vui lòng thử lại.');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    renderVoiceOptions();

    // Handle Preview Button click for selected voice
    if (previewBtn) {
        previewBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (!selectedVoice) {
                alert('Vui lòng chọn một giọng đọc AI.');
                return;
            }
            previewVoice(selectedVoice);
        });
    }
});