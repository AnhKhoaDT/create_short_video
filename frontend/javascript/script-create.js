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

    // Khôi phục giọng đọc đã chọn từ localStorage
    const savedVoice = localStorage.getItem('selectedVoice');
    if (savedVoice) {
        selectedVoice = savedVoice;
    }

    // Ban đầu: không cho sửa
    scriptContentInput.setAttribute('readonly', true);

    // Hiển thị nội dung kịch bản và cập nhật số ký tự
    const createdScript = localStorage.getItem('createdScriptContent');
    if (createdScript && scriptContentInput) {
        try {
            const data = JSON.parse(createdScript);
            // Kiểm tra nếu là định dạng mới (chỉ có 'content')
            if (data && typeof data === 'object' && data.content !== undefined) {
                scriptContentInput.value = data.content.trim();
            } else if (data && typeof data === 'object' && data.title !== undefined && Array.isArray(data.scenes)) {
                // Nếu là định dạng cũ (có 'title' và 'scenes')
                let content = `Tiêu đề: ${data.title}\n\n`;
                data.scenes.forEach(scene => {
                    content += `Cảnh ${scene.sceneNumber}:\n`;
                    content += `Mô tả: ${scene.description}\n`;
                    content += `Hội thoại: ${scene.dialogue}\n`;
                    content += `Gợi ý hình ảnh: ${scene.imagePrompt}\n\n`;
                });
                scriptContentInput.value = content.trim();
            } else {
                // Trường hợp JSON không đúng định dạng mong muốn, coi như là plain text
                scriptContentInput.value = createdScript.trim();
            }
        } catch (e) {
            // Nếu JSON.parse thất bại (createdScript là plain text thuần túy)
            scriptContentInput.value = createdScript.trim();
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

            // Xóa tất cả audio cache cũ
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('audio_')) {
                    localStorage.removeItem(key);
                }
            });

            // Nếu có giọng đã chọn, fetch lại audio mới
            if (selectedVoice) {
                fetchAndCacheAudio(selectedVoice);
            }
        }
    });

    // Hàm kiểm tra token hết hạn
    function checkTokenExpiration() {
        const token = localStorage.getItem('token');
        if (!token) {
            // Xóa tất cả cache khi không có token
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('audio_')) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.removeItem('selectedVoice');
            return;
        }

        try {
            // Giải mã token để lấy thời gian hết hạn
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Chuyển sang milliseconds

            if (Date.now() >= expirationTime) {
                // Token đã hết hạn, xóa cache
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('audio_')) {
                        localStorage.removeItem(key);
                    }
                });
                localStorage.removeItem('selectedVoice');
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra token:', error);
            // Nếu có lỗi khi giải mã token, xóa cache để đảm bảo an toàn
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('audio_')) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.removeItem('selectedVoice');
            localStorage.removeItem('token');
        }
    }

    // Kiểm tra token khi tải trang
    checkTokenExpiration();

    // Kiểm tra token mỗi phút
    setInterval(checkTokenExpiration, 60000);

    // Hàm fetch và cache audio
    async function fetchAndCacheAudio(voiceId) {
        if (!scriptContentInput.value.trim()) {
            return;
        }

        const cacheKey = `audio_${voiceId}_${scriptContentInput.value}`;
        
        // Nếu đã có trong cache thì không cần fetch lại
        if (localStorage.getItem(cacheKey)) {
            console.log('Audio đã có trong cache');
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

            if (response.status === 401 || response.status === 403) {
                // Token hết hạn hoặc không hợp lệ
                checkTokenExpiration();
                return;
            }

            if (response.ok) {
                const audioBlob = await response.blob();
                if (audioBlob.size > 0 && (audioBlob.type === 'audio/mpeg' || audioBlob.type === 'audio/mp3')) {
                    // Chuyển blob thành base64 để lưu vào localStorage
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = function() {
                        const base64data = reader.result;
                        localStorage.setItem(cacheKey, base64data);
                        console.log('Đã lưu audio vào cache');
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi khi gọi API TTS:', error);
            if (error.message.includes('401') || error.message.includes('403')) {
                checkTokenExpiration();
            }
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

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
            `;

            // Highlight card nếu là giọng đã chọn
            if (voice.id === selectedVoice) {
                voiceCard.classList.add('border-blue-600', 'bg-blue-50');
            }

            // Add click handler for voice selection
            voiceCard.addEventListener('click', () => {
                const currentActive = voiceGrid.querySelector('.voice-card.border-blue-600');
                if (currentActive) {
                    currentActive.classList.remove('border-blue-600', 'bg-blue-50');
                }
                voiceCard.classList.add('border-blue-600', 'bg-blue-50');
                selectedVoice = voice.id;
                
                // Lưu giọng đã chọn vào localStorage
                localStorage.setItem('selectedVoice', voice.id);
                
                // Chỉ gọi API và lưu cache khi chọn giọng
                fetchAndCacheAudio(voice.id);
            });

            voiceGrid.appendChild(voiceCard);
        });
    }

    // Hàm phát audio từ cache
    function playAudioFromCache(voiceId) {
        if (!scriptContentInput.value.trim()) {
            alert('Vui lòng nhập nội dung kịch bản để nghe thử.');
            return;
        }

        const cacheKey = `audio_${voiceId}_${scriptContentInput.value}`;
        const cachedAudio = localStorage.getItem(cacheKey);
        
        if (cachedAudio) {
            const audio = new Audio(cachedAudio);
            audio.play().then(() => {
                console.log('Audio playback started successfully from cache.');
            }).catch(playError => {
                console.error('Lỗi khi phát âm thanh từ cache:', playError);
                alert('Không thể phát âm thanh. Vui lòng thử lại.');
            });
        } else {
            alert('Chưa có audio trong cache. Vui lòng chọn giọng đọc trước.');
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
            playAudioFromCache(selectedVoice);
        });
    }
});