document.addEventListener('DOMContentLoaded', async () => {
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

                    // Lấy tiêu đề và mô tả từ kịch bản
                    let scriptTitle = '';
                    let scriptDescription = '';

                    // Giả sử script có dạng: "Tiêu đề: ...\n\nCảnh 1:\nMô tả: ...\nGợi ý hình ảnh: ..."
                    // Lấy dòng tiêu đề
                    const titleMatch = script.match(/^Tiêu đề:\s*(.*)$/m);
                    if (titleMatch) {
                        scriptTitle = titleMatch[1].trim();
                    }

                    // Lấy mô tả đầu tiên (nếu có nhiều cảnh thì lấy mô tả cảnh 1)
                    const descMatch = script.match(/Cảnh\s*\d+:\s*\nMô tả:\s*([^\n]+)/m);
                    if (descMatch) {
                        scriptDescription = descMatch[1].trim();
                    } else {
                        // Nếu không có mô tả cảnh, lấy 200 ký tự đầu của script làm mô tả
                        scriptDescription = script.substring(0, 200);
                    }

                    for (const url of imageUrls) {
                        await fetch('http://localhost:8080/create-image-service/images/save', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                url: url,
                                title: scriptTitle,
                                description: scriptDescription
                            })
                        });
                    }

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

    // Hàm hiển thị kịch bản dạng JSON với các trường in đậm
    function renderScriptEditor(scriptData) {
        const container = document.getElementById('scriptEditor');
        if (!container) return;

        // Ẩn textarea, chỉ hiển thị form JSON editor
        container.style.display = 'none';

        // Xóa form cũ nếu có
        let oldEditor = document.querySelector('.script-json-editor');
        if (oldEditor) oldEditor.remove();

        // Tạo div chứa form chỉnh sửa
        const editorDiv = document.createElement('div');
        editorDiv.className = 'script-json-editor';
        editorDiv.style.padding = '20px';
        editorDiv.style.border = '1px solid #e5e7eb';
        editorDiv.style.borderRadius = '8px';
        editorDiv.style.backgroundColor = '#f9fafb';

        // Tiêu đề
        const titleDiv = document.createElement('div');
        titleDiv.className = 'title-edit-block mb-4';
        titleDiv.innerHTML = `
            <div class="flex items-center mb-2">
                <b style="color:#374151; min-width:80px;">Tiêu đề:</b>
                <input type="text" class="title-input w-full border rounded px-3 py-2 ml-2" 
                       value="${scriptData.title || ''}" placeholder="Nhập tiêu đề kịch bản">
            </div>
        `;
        editorDiv.appendChild(titleDiv);

        // Các scene
        if (scriptData.scenes && Array.isArray(scriptData.scenes)) {
            scriptData.scenes.forEach((scene, idx) => {
                const sceneDiv = document.createElement('div');
                sceneDiv.className = 'scene-edit-block mb-6 p-4 border border-gray-200 rounded-lg bg-white';

                sceneDiv.innerHTML = `
                    <div class="flex items-center mb-3">
                        <b style="color:#374151; min-width:80px;">Cảnh ${scene.sceneNumber}:</b>
                        <input type="number" value="${scene.sceneNumber}" readonly 
                               class="w-20 border rounded px-2 py-1 ml-2 bg-gray-100" style="width:60px;">
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex items-start mb-2">
                            <b style="color:#374151; min-width:80px;">Mô tả:</b>
                            <textarea class="desc-input w-full border rounded px-3 py-2 ml-2" rows="3" 
                                      data-idx="${idx}" placeholder="Nhập mô tả cảnh">${scene.description || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex items-start mb-2">
                            <b style="color:#374151; min-width:80px;">Gợi ý hình ảnh:</b>
                            <textarea class="img-input w-full border rounded px-3 py-2 ml-2" rows="2" 
                                      data-idx="${idx}" placeholder="Nhập gợi ý hình ảnh">${scene.imagePrompt || ''}</textarea>
                        </div>
                    </div>
                `;

                editorDiv.appendChild(sceneDiv);
            });
        }

        // Gắn form vào DOM ngay sau textarea
        container.parentNode.insertBefore(editorDiv, container.nextSibling);
    }

    // Hàm lưu chỉnh sửa kịch bản
    function saveScriptEdits(scriptData) {
        // Cập nhật title
        const titleInput = document.querySelector('.title-input');
        if (titleInput) {
            scriptData.title = titleInput.value;
        }
        
        // Cập nhật các scene
        document.querySelectorAll('.desc-input').forEach(input => {
            const idx = parseInt(input.dataset.idx);
            if (scriptData.scenes && scriptData.scenes[idx]) {
                scriptData.scenes[idx].description = input.value;
            }
        });
        
        document.querySelectorAll('.img-input').forEach(input => {
            const idx = parseInt(input.dataset.idx);
            if (scriptData.scenes && scriptData.scenes[idx]) {
                scriptData.scenes[idx].imagePrompt = input.value;
            }
        });
        
        // Lưu lại vào localStorage
        localStorage.setItem('createdScriptContent', JSON.stringify(scriptData));
        
        // Gọi API cập nhật backend
        updateScriptOnBackend(scriptData);
    }

    // Hàm gọi API cập nhật backend
    async function updateScriptOnBackend(scriptData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Vui lòng đăng nhập lại!');
                return;
            }

            const response = await fetch(`http://localhost:8080/create-video-service/scripts/${scriptData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: scriptData.title,
                    scenes: scriptData.scenes.map(scene => ({
                        id: scene.id,
                        sceneNumber: scene.sceneNumber,
                        description: scene.description,
                        imagePrompt: scene.imagePrompt
                    }))
                })
            });

            if (response.ok) {
                alert('Đã lưu kịch bản thành công!');
            } else {
                const errorText = await response.text();
                alert('Lỗi khi lưu kịch bản: ' + errorText);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật kịch bản:', error);
            alert('Lỗi khi lưu kịch bản: ' + error.message);
        }
    }

    if (editScriptBtn && scriptEditor) {
        editScriptBtn.addEventListener('click', () => {
            const scriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
            
            // Kiểm tra xem có form JSON editor đang hiển thị không
            const jsonEditor = document.querySelector('.script-json-editor');
            
            if (!jsonEditor) {
                // Chuyển sang hiển thị form chỉnh sửa JSON
                scriptEditor.style.display = 'none';
                renderScriptEditor(scriptData);
                editScriptBtn.innerHTML = `<iconify-icon icon="mdi:content-save" class="mr-1"></iconify-icon>Lưu kịch bản`;
            } else {
                // Lưu lại và chuyển về hiển thị text
                saveScriptEdits(scriptData);
                
                // Xóa form JSON editor
                jsonEditor.remove();
                
                // Hiển thị lại textarea và đảm bảo nó hiển thị đúng
                scriptEditor.style.display = 'block';
                scriptEditor.style.visibility = 'visible';
                scriptEditor.style.position = 'static';
                scriptEditor.setAttribute('readonly', 'readonly');
                editScriptBtn.innerHTML = `<iconify-icon icon="mdi:refresh" class="mr-1"></iconify-icon>Chỉnh sửa kịch bản`;
                
                // Cập nhật lại nội dung textarea
                let content = `Tiêu đề: ${scriptData.title || ''}\n\n`;
                if (scriptData.scenes) {
                    scriptData.scenes.forEach(scene => {
                        content += `Cảnh ${scene.sceneNumber}:\n`;
                        content += `Mô tả: ${scene.description || ''}\n`;
                        content += `Gợi ý hình ảnh: ${scene.imagePrompt || ''}\n\n`;
                    });
                }
                scriptEditor.value = content.trim();
                
                // Debug: kiểm tra xem textarea có hiển thị không
                console.log('ScriptEditor display style:', scriptEditor.style.display);
                console.log('ScriptEditor visibility:', scriptEditor.offsetParent !== null);
            }
        });
    }

    // --- Scene image selection logic ---
    const scriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
    const scenes = scriptData.scenes || [];
    let scriptTitle = scriptData.title || '';

    // Mỗi scene sẽ có: {sceneNumber, description, imagePrompt, images: [], selectedImage: null, lastPrompt: '', loading: false, error: null}
    scenes.forEach(scene => {
        scene.images = scene.images || [];
        scene.selectedImage = scene.selectedImage || null;
        scene.lastPrompt = scene.lastPrompt || scene.imagePrompt;
        scene.loading = false;
        scene.error = null;
    });

    const container = document.getElementById('sceneImageContainer');
    const generateVideoBtn = document.getElementById('generateVideoBtn');

    // Nút chọn tất cả (lấy từ HTML)
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectAllIcon = document.getElementById('selectAllIcon');
    const selectAllText = document.getElementById('selectAllText');
    let allSelected = false;
    
    function updateSelectAllBtn() {
        if (allSelected) {
            selectAllIcon.setAttribute('icon', 'mdi:close');
            selectAllText.textContent = 'Bỏ chọn tất cả ảnh';
        } else {
            selectAllIcon.setAttribute('icon', 'mdi:check');
            selectAllText.textContent = 'Chọn tất cả ảnh';
        }
    }

    selectAllBtn.onclick = () => {
        const shouldSelectAll = !scenes.every(scene => scene.selectedImage);
        if (shouldSelectAll) {
            scenes.forEach(scene => {
                if (scene.images.length > 0) {
                    scene.selectedImage = scene.images[0];
                    localStorage.setItem('imgScene' + scene.sceneNumber, scene.selectedImage);
                }
            });
        } else {
            scenes.forEach(scene => {
                scene.selectedImage = null;
                localStorage.removeItem('imgScene' + scene.sceneNumber);
            });
        }
        saveScenesToLocalStorage();
        renderScenes();
    };

    function renderScenes() {
        container.innerHTML = '';
        if (!scenes || scenes.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500 text-lg">
                    Không tải được hình ảnh
                </div>
            `;
            return;
        }
        scenes.forEach((scene, idx) => {
            const card = document.createElement('div');
            card.className = 'border rounded-xl shadow p-4 bg-white flex flex-col';

            // Tiêu đề và prompt
            card.innerHTML = `
                <h3 class="font-semibold text-lg mb-3">Cảnh ${scene.sceneNumber}</h3>
                <label class="text-sm text-gray-600">Prompt ảnh:</label>
                <textarea class="w-full border rounded px-3 py-2 mb-3 scene-prompt" rows="2">${scene.imagePrompt}</textarea>
                <div class="scene-images mb-3"></div>
                <div class="flex gap-4 mb-3">
                    <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 generate-image-btn flex items-center justify-center flex-1">
                        <iconify-icon icon="mdi:image" class="mr-1"></iconify-icon>
                        Tạo lại ảnh
                    </button>
                    <button class="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 select-existing-image-btn flex items-center justify-center flex-1">
                        <iconify-icon icon="mdi:image-search-outline" class="mr-1"></iconify-icon>
                        Chọn ảnh có sẵn
                    </button>
                </div>
            `;

            // Render ảnh (hoặc loading/error) vào đúng vị trí
            const imagesDiv = card.querySelector('.scene-images');
            imagesDiv.innerHTML = '';

            // Render ảnh đã chọn từ thư viện (nếu có và không nằm trong scene.images)
            if (scene.selectedImage) {
                const selectedImg = document.createElement('img');
                selectedImg.src = scene.selectedImage;
                selectedImg.alt = 'Ảnh đã chọn';
                selectedImg.className = `w-full h-48 object-cover rounded mb-3 cursor-pointer border-4 transition border-green-500`;
                selectedImg.style.boxSizing = 'border-box';
                selectedImg.onclick = () => {
                    // Bỏ chọn ảnh, KHÔNG xóa scene.images
                    scene.selectedImage = null;
                    localStorage.removeItem('imgScene' + scene.sceneNumber);
                    saveScenesToLocalStorage();
                    renderScenes();
                };
                imagesDiv.appendChild(selectedImg);
            }

            // Render loading nếu đang tạo ảnh
            if (scene.loading) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'flex items-center justify-center py-4';
                loadingDiv.innerHTML = `
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    <span class="text-gray-600">Đang tạo ảnh...</span>
                `;
                imagesDiv.appendChild(loadingDiv);
            }

            // Render tất cả ảnh trong scene.images (chỉ hiển thị nếu chưa có selectedImage và không loading)
            if (!scene.selectedImage && scene.images.length > 0 && !scene.loading) {
                const imgUrl = scene.images[0];
                const imgEl = document.createElement('img');
                imgEl.src = imgUrl;
                imgEl.alt = `Generated Image`;
                imgEl.className = `w-full h-48 object-cover rounded mb-3 cursor-pointer border-4 transition border-gray-200`;
                imgEl.style.boxSizing = 'border-box';
                imgEl.onclick = () => {
                    scene.selectedImage = imgUrl;
                    localStorage.setItem('imgScene' + scene.sceneNumber, imgUrl);
                    saveScenesToLocalStorage();
                    renderScenes();
                };
                imagesDiv.appendChild(imgEl);
            }

            // Hiển thị lỗi nếu có
            if (scene.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-red-500 mb-2';
                errorDiv.textContent = scene.error;
                imagesDiv.appendChild(errorDiv);
            }

            // Sự kiện tạo ảnh (chỉ gọi API khi nhấn nút)
            card.querySelector('.generate-image-btn').onclick = async () => {
                const promptInput = card.querySelector('.scene-prompt');
                const newPrompt = promptInput.value.trim();
                scene.loading = true;
                scene.error = null;
                renderScenes();
                const scriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
                const title = scriptData.title || '';
                const category = localStorage.getItem('selectedCategory') || '';
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('http://localhost:8080/create-video-service/images/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: title,
                            scriptContent: newPrompt,
                            scriptCategory: category
                        })
                    });
                    if (!response.ok) throw new Error('Tạo ảnh thất bại');
                    const data = await response.json();
                    // Chỉ giữ 1 ảnh duy nhất
                    const imgUrl = Array.isArray(data) ? data[0] : (data.imageUrls ? data.imageUrls[0] : null);
                    scene.images = imgUrl ? [imgUrl] : [];
                    scene.selectedImage = imgUrl;
                    if (imgUrl) {
                        localStorage.setItem('imgScene' + scene.sceneNumber, imgUrl);
                    } else {
                        scene.selectedImage = null;
                        localStorage.removeItem('imgScene' + scene.sceneNumber);
                    }
                    scene.error = null;
                } catch (err) {
                    scene.images = [];
                    scene.selectedImage = null;
                    localStorage.removeItem('imgScene' + scene.sceneNumber);
                    scene.error = 'Lỗi khi tạo ảnh: ' + err.message;
                }
                scene.loading = false;
                scene.lastPrompt = newPrompt;
                scene.imagePrompt = newPrompt;
                saveScenesToLocalStorage();
                renderScenes();
            };
            // Sự kiện chọn ảnh có sẵn (mở modal chọn ảnh)
            card.querySelector('.select-existing-image-btn').onclick = () => {
                openImageSelectModal(function(selectedUrl) {
                    // Chỉ giữ 1 ảnh duy nhất
                    scene.images = [selectedUrl];
                    scene.selectedImage = selectedUrl;
                    localStorage.setItem('imgScene' + scene.sceneNumber, selectedUrl);
                    scene.error = null;
                    saveScenesToLocalStorage();
                    renderScenes();
                });
            };
            card.querySelector('.scene-prompt').oninput = () => {
                scene.selectedImage = null;
                localStorage.removeItem('imgScene' + scene.sceneNumber);
            };
            container.appendChild(card);
        });
        allSelected = scenes.every(scene => scene.selectedImage);
        updateSelectAllBtn();
    }

    generateVideoBtn.onclick = async () => {
        // Lấy thông tin scene từ createdScriptContent
        const scriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
        const scenesData = scriptData.scenes || [];
        // Chuẩn bị dữ liệu gửi lên backend
        const sceneImages = scenesData.map(scene => ({
            sceneId: scene.id || scene.sceneId || scene.sceneNumber,
            imageUrl: localStorage.getItem(`imgScene${scene.sceneNumber}`) || null,
        }));
        // Kiểm tra cảnh nào chưa chọn ảnh
        const notSelected = sceneImages.find(scene => !scene.imageUrl);
        if (notSelected) {
            alert(`Vui lòng chọn ảnh nền cho cảnh ${notSelected.sceneId || notSelected.sceneNumber}!`);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            // 1. Lưu ảnh vào database
            const response = await fetch('http://localhost:8080/create-video-service/scripts/scenes/images', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sceneImages)
            });
            if (!response.ok) throw new Error('Lưu ảnh thất bại');

            // 2. Chỉ chuyển sang trang preview, KHÔNG gọi API tạo video ở đây
            const scriptId = scriptData.id || scriptData.scriptId;
            if (!scriptId) {
                alert('Không tìm thấy id kịch bản!');
                return;
            }
            sessionStorage.setItem('videoLoading', 'true');
            sessionStorage.setItem('videoScriptId', scriptId);
            window.location.href = 'video-preview.html';
        } catch (err) {
            alert('Lỗi khi lưu ảnh: ' + err.message);
            sessionStorage.removeItem('videoLoading');
        }
    };

    // Sự kiện cho nút tạo ảnh nền từ kịch bản
    const generateAllImagesBtn = document.getElementById('generateAllImagesBtn');
    if (generateAllImagesBtn) {
        generateAllImagesBtn.onclick = async () => {
            for (const scene of scenes) {
                scene.loading = true;
                scene.error = null;
                renderScenes();
                const scriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
                const title = scriptData.title || '';
                const category = localStorage.getItem('selectedCategory') || '';
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('http://localhost:8080/create-video-service/images/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: title,
                            scriptContent: scene.imagePrompt,
                            scriptCategory: category
                        })
                    });
                    if (!response.ok) throw new Error('Tạo ảnh thất bại');
                    const data = await response.json();
                    scene.images = Array.isArray(data) ? data : (data.imageUrls || []);
                    scene.error = null;
                } catch (err) {
                    scene.images = [];
                    scene.error = 'Lỗi khi tạo ảnh: ' + err.message;
                }
                scene.loading = false;
                scene.selectedImage = null;
                scene.lastPrompt = scene.imagePrompt;
                renderScenes();
            }
        };
    }

    // Không tự động gọi API khi tải lại trang nữa
    renderScenes();

    function chooseImageForScene(sceneIndex) {
        openImageSelectModal(function(selectedUrl) {
            // Nếu ảnh chưa có trong scenes[sceneIndex].images thì thêm vào
            if (!scenes[sceneIndex].images.includes(selectedUrl)) {
                scenes[sceneIndex].images.push(selectedUrl);
            }
            scenes[sceneIndex].selectedImage = selectedUrl;
            renderScenes(); // hoặc cập nhật lại UI scene
        });
    }

    // Thêm hàm openImageSelectModal nếu chưa có
    function openImageSelectModal(onSelect) {
        let modal = document.getElementById('imageSelectModal');
        let modalImageList = document.getElementById('modalImageList');
        if (!modal) {
            // Tạo modal nếu chưa có trong DOM
            modal = document.createElement('div');
            modal.id = 'imageSelectModal';
            modal.className = 'modal';
            modal.style = 'display:block; position:fixed; z-index:1000; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5);';
            modal.innerHTML = `
              <div class="modal-content" style="background:#fff; margin:5% auto; padding:20px; border-radius:8px; width:80%; max-width:800px; max-height:80vh; display:flex; flex-direction:column;">
                <span id="closeImageModal" class="close" style="float:right; font-size:24px; cursor:pointer;">&times;</span>
                <h2>Chọn ảnh từ thư viện</h2>
                <div id="modalImageList" class="image-grid" style="flex:1 1 auto; overflow-y:auto; min-height:120px; max-height:50vh; display:flex; flex-wrap:wrap; gap:10px;"></div>
                <div style="margin-top:20px; text-align:right;">
                    <button id="okSelectImageBtn" class="bg-blue-500 text-white px-4 py-2 rounded mr-2" disabled>OK</button>
                    <button id="closeImageModalBtn" class="bg-gray-400 text-white px-4 py-2 rounded">Đóng</button>
                </div>
              </div>
            `;
            document.body.appendChild(modal);
            modalImageList = document.getElementById('modalImageList');
        } else {
            modal.style.display = 'block';
            modalImageList.innerHTML = '';
        }
        modalImageList.innerHTML = '<p>Đang tải ảnh...</p>';
        let selectedUrl = null;
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
                imgEl.style = 'width:120px;height:120px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid #eee;margin:5px;transition:border 0.2s;';
                imgEl.onclick = () => {
                    // Bỏ highlight các ảnh khác
                    modalImageList.querySelectorAll('img').forEach(img => img.style.border = '2px solid #eee');
                    imgEl.style.border = '2px solid #007bff';
                    selectedUrl = image.url;
                    document.getElementById('okSelectImageBtn').disabled = false;
                };
                modalImageList.appendChild(imgEl);
            });
        });
        // Đóng modal khi nhấn nút đóng hoặc dấu x
        document.getElementById('closeImageModal').onclick = () => {
            modal.style.display = 'none';
        };
        document.getElementById('closeImageModalBtn').onclick = () => {
            modal.style.display = 'none';
        };
        // OK: chọn ảnh
        document.getElementById('okSelectImageBtn').onclick = () => {
            if (selectedUrl) {
                modal.style.display = 'none';
                onSelect(selectedUrl);
            }
        };
    }

    // Hàm lưu scenes vào localStorage
    function saveScenesToLocalStorage() {
        const scriptData = JSON.parse(localStorage.getItem('createdScriptContent') || '{}');
        scriptData.scenes = scenes;
        localStorage.setItem('createdScriptContent', JSON.stringify(scriptData));
    }
}); 