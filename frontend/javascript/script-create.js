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
            
            // Lưu lại nội dung mới vào localStorage nhưng giữ nguyên cấu trúc scenes
            const currentScriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
            currentScriptData.content = scriptContentInput.value;
            localStorage.setItem('createdScriptContent', JSON.stringify(currentScriptData));
        }
    });

    // Hàm kiểm tra token hết hạn
    function checkTokenExpiration() {
        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.removeItem('selectedVoice');
            return;
        }

        try {
            // Giải mã token để lấy thời gian hết hạn
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Chuyển sang milliseconds

            if (Date.now() >= expirationTime) {
                localStorage.removeItem('selectedVoice');
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra token:', error);
            localStorage.removeItem('selectedVoice');
            localStorage.removeItem('token');
        }
    }

    // Kiểm tra token khi tải trang
    checkTokenExpiration();

    // Kiểm tra token mỗi phút
    setInterval(checkTokenExpiration, 60000);

    // Render voice options
    function renderVoiceOptions() {
        voiceGrid.innerHTML = '';
        FPT_AI_VOICES.forEach(voice => {
            const voiceCard = document.createElement('div');
            voiceCard.classList.add('voice-card', 'p-4', 'border', 'border-gray-200', 'rounded-lg', 'text-center', 'cursor-pointer', 'hover:border-blue-500', 'transition-colors');
            voiceCard.setAttribute('data-voice-id', voice.id);
            voiceCard.innerHTML = `
                <iconify-icon icon="mdi:account-voice" class="text-4xl text-gray-600 mb-2"></iconify-icon>
                <p class="font-semibold text-gray-800">${voice.name}</p>
            `;
            if (voice.id === selectedVoice) {
                voiceCard.classList.add('border-blue-600', 'bg-blue-50');
            }
            voiceCard.addEventListener('click', () => {
                const currentActive = voiceGrid.querySelector('.voice-card.border-blue-600');
                if (currentActive) {
                    currentActive.classList.remove('border-blue-600', 'bg-blue-50');
                }
                voiceCard.classList.add('border-blue-600', 'bg-blue-50');
                selectedVoice = voice.id;
                localStorage.setItem('selectedVoice', voice.id);
            });
            voiceGrid.appendChild(voiceCard);
        });
    }

    // Hàm phát audio mẫu từ backend (thêm token vào request)
    function playSampleAudioFromBackend(voiceId) {
        const token = localStorage.getItem('token');
        const audioUrl = `http://localhost:8080/create-video-service/sample-voices/${voiceId}.mp3`;
        fetch(audioUrl, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể lấy file audio mẫu');
            }
            return response.blob();
        })
        .then(blob => {
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play().then(() => {
                console.log('Audio mẫu playback started successfully from backend.');
            }).catch(playError => {
                console.error('Lỗi khi phát audio mẫu:', playError);
                alert('Không thể phát audio mẫu. Vui lòng thử lại.');
            });
        })
        .catch(playError => {
            console.error('Lỗi khi phát audio mẫu:', playError);
            alert('Không thể phát audio mẫu. Vui lòng thử lại.');
        });
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
            playSampleAudioFromBackend(selectedVoice);
        });
    }

    // Handle Continue Button click to go to image selection screen
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            const selectedVoice = localStorage.getItem('selectedVoice');
            const scriptDataRaw = localStorage.getItem('createdScriptContent');
            let scriptData;
            try {
                scriptData = JSON.parse(scriptDataRaw);
            } catch (e) {
                alert('Không tìm thấy dữ liệu kịch bản hợp lệ!');
                return;
            }
            const scriptId = scriptData ? scriptData.id : null;
            if (!scriptId) {
                alert('Không tìm thấy scriptId. Vui lòng tạo kịch bản trước!');
                return;
            }
            if (!scriptData.scenes || !Array.isArray(scriptData.scenes) || scriptData.scenes.length === 0) {
                alert('Kịch bản không có scene nào!');
                return;
            }
            loadingOverlay.classList.remove('hidden');
            // Gọi API tạo audio cho từng scene
            for (let i = 0; i < scriptData.scenes.length; i++) {
                const scene = scriptData.scenes[i];
                if (!scene.description) continue;
                try {
                    const response = await fetch('http://localhost:8080/create-video-service/tts/synthesize', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            text: scene.description,
                            voice: selectedVoice
                        })
                    });
                    if (response.ok) {
                        const audioUrl = await response.text();
                        if (audioUrl && audioUrl.startsWith('http')) {
                            scene.audioUrl = audioUrl;
                        }
                    } else {
                        console.error('Tạo audio cho scene thất bại:', await response.text());
                    }
                } catch (err) {
                    console.error('Lỗi khi tạo audio cho scene:', err);
                }
            }
            // Gửi audio URLs cho từng scene
            try {
                const token = localStorage.getItem('token');
                console.log('Script data for audio update:', scriptData);
                
                const audioUpdateRequests = scriptData.scenes
                    .filter(scene => scene.audioUrl && scene.id)
                    .map(scene => ({
                        sceneId: scene.id,
                        audioUrl: scene.audioUrl
                    }));
                
                console.log('Audio update requests:', audioUpdateRequests);
                
                if (audioUpdateRequests.length > 0) {
                    const response = await fetch('http://localhost:8080/create-video-service/scripts/scenes/audio', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(audioUpdateRequests)
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Server error:', errorText);
                        throw new Error(`Server error: ${response.status} - ${errorText}`);
                    }
                    
                    console.log('Audio update successful');
                } else {
                    console.log('No audio URLs to update');
                }
            } catch (err) {
                console.error('Lỗi khi cập nhật audio cho các scene:', err);
                alert('Lỗi khi cập nhật audio cho các scene: ' + err.message);
                loadingOverlay.classList.add('hidden');
                return;
            }
            loadingOverlay.classList.add('hidden');
            // Chuyển sang bước tiếp theo...
            window.location.href = 'image-create-from-script.html';
        });
    }
});