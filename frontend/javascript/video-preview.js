// Cấu hình script để đáp ứng nhu cầu bên: chỉ hiển thị 1 video preview (lấy từ sessionStorage), không render danh sách nhiều video mẫu

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy thông tin video từ sessionStorage
    const videoInfo = JSON.parse(sessionStorage.getItem('currentVideo') || '{}');
    const videoListContainer = document.getElementById('homepageVideoList');

    // Nếu đang loading video (tạo video mới)
    if (sessionStorage.getItem('videoLoading') === 'true') {
        // Tạo card preview
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card w-full';
        videoCard.style.marginTop = '50px';

        // Tiêu đề card
        const cardTitle = document.createElement('h2');
        cardTitle.className = 'video-card-title';
        cardTitle.textContent = 'Xem trước video';
        videoCard.appendChild(cardTitle);

        // Khu vực video: loading spinner
        const videoArea = document.createElement('div');
        videoArea.className = 'flex flex-col items-center justify-center py-12 min-h-[320px]';
        videoArea.innerHTML = `
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span class="text-lg text-gray-600">Đang tạo video...</span>
        `;
        videoCard.appendChild(videoArea);

        // Tiêu đề, mô tả
        const titleDiv = document.createElement('div');
        titleDiv.className = 'video-title font-bold text-lg mt-4';
        titleDiv.id = 'previewTitle';
        titleDiv.textContent = videoInfo?.title || 'Video Preview';
        videoCard.appendChild(titleDiv);

        const descDiv = document.createElement('div');
        descDiv.className = 'video-desc text-gray-600 mt-2';
        descDiv.id = 'previewDesc';
        descDiv.textContent = videoInfo?.description || '';
        videoCard.appendChild(descDiv);

        // Hiển thị ra ngoài
        videoListContainer.innerHTML = '';
        videoListContainer.appendChild(videoCard);

        // Gọi API tạo video nếu có scriptId
        const scriptId = sessionStorage.getItem('videoScriptId');
        if (scriptId) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:8080/create-video-service/videos/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ scriptId: Number(scriptId) })
                });
                if (!res.ok) throw new Error('Tạo video thất bại');
                const videoData = await res.json();

                // --- TÁCH TIÊU ĐỀ VÀ MÔ TẢ TỪ KỊCH BẢN ---
                let title = '';
                let description = '';
                try {
                    const scriptContent = JSON.parse(sessionStorage.getItem('createdScriptContent') || '{}');
                    let text = '';
                    if (scriptContent && scriptContent.content) {
                        text = scriptContent.content;
                    } else if (scriptContent && scriptContent.input) {
                        text = scriptContent.input;
                    }
                    if (text) {
                        // Tách câu dựa vào dấu chấm hoặc xuống dòng
                        const sentences = text.split(/[\.!?\n]/).map(s => s.trim()).filter(Boolean);
                        title = sentences[0] || '';
                        description = sentences[1] || '';
                    }
                } catch (e) { /* ignore */ }

                // --- GỌI API CẬP NHẬT TIÊU ĐỀ VÀ MÔ TẢ ---
                if (videoData.id && (title || description)) {
                    await fetch(`http://localhost:8080/create-video-service/videos/${videoData.id}/meta`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title, description })
                    });
                }

                // Lưu thông tin video vào sessionStorage
                sessionStorage.setItem('currentVideo', JSON.stringify({
                    id: videoData.id,
                    url: videoData.videoUrl,
                    title: title || videoData.title || '',
                    description: description || videoData.description || '',
                    subtitleVttUrl: videoData.subtitleVttUrl || ''
                }));
                sessionStorage.removeItem('videoLoading');
                sessionStorage.removeItem('videoScriptId');
                // Reload lại trang để render video
                window.location.reload();
            } catch (err) {
                videoArea.innerHTML = `<span class="text-red-500">Lỗi khi tạo video: ${err.message}</span>`;
            }
        }
        return;
    }

    // Nếu không có videoInfo hoặc không có url, hiển thị thông báo
    if (!videoInfo || !videoInfo.url) {
        videoListContainer.innerHTML = '<p style="text-align: center; margin-top: 50px;">Không tìm thấy video để xem trước.</p>';
        return;
    }

    // Tạo card hiển thị video preview
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card w-full';
    videoCard.style.marginTop = '50px';

    // Tạo tiêu đề card
    const cardTitle = document.createElement('h2');
    cardTitle.className = 'video-card-title';
    cardTitle.textContent = 'Xem trước video';
    videoCard.appendChild(cardTitle);

    // Render video
    const videoElem = document.createElement('video');
    videoElem.controls = true;
    videoElem.src = videoInfo.url;
    videoElem.style.width = '100%';
    videoElem.style.maxHeight = '480px';
    videoElem.style.borderRadius = '12px';
    videoElem.style.background = '#000';
    // Nếu có phụ đề vtt thì gắn vào video
    // (XÓA ĐOẠN TẠO TRACK PHỤ ĐỀ VTT VÀ NÚT PHỤ ĐỀ)

    videoCard.appendChild(videoElem);

    // Tiêu đề, mô tả, lượt xem
    const titleDiv = document.createElement('div');
    titleDiv.className = 'video-title font-bold text-lg mt-4';
    titleDiv.id = 'previewTitle';
    titleDiv.textContent = videoInfo.title || 'Video Preview';
    titleDiv.style.marginBottom = '0px';

    const descDiv = document.createElement('div');
    descDiv.className = 'video-desc text-gray-600 mt-2';
    descDiv.id = 'previewDesc';
    descDiv.textContent = videoInfo.description || '';

    const statsDiv = document.createElement('div');
    statsDiv.className = 'video-stats mt-2';
    statsDiv.innerHTML = `
        <span class="view-count text-gray-500" id="previewViewCount">
            <iconify-icon icon="mdi:eye"></iconify-icon> ${videoInfo.views ? videoInfo.views + ' lượt xem' : ''}
        </span>
    `;
    statsDiv.style.marginTop = '0px';

    // Nút Edit, Download
    const actionDiv = document.createElement('div');
    actionDiv.className = 'action-buttons-preview flex justify-center gap-2 mt-4';
    actionDiv.style.marginTop = '0px';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn-compact px-3 py-1 rounded bg-blue-500 text-white flex items-center gap-1';
    editBtn.innerHTML = '<iconify-icon icon="mdi:pencil"></iconify-icon> Sửa';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn-compact px-3 py-1 rounded bg-green-500 text-white flex items-center gap-1';
    downloadBtn.innerHTML = '<iconify-icon icon="mdi:download"></iconify-icon> Tải xuống';

    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(downloadBtn);
    // Thêm nút phụ đề vào actionDiv
    // if (videoInfo.subtitleVttUrl) {
    //     actionDiv.appendChild(subtitleBtn);
    // }

    // Khu vực chia sẻ (dưới cùng card)
    const shareSection = document.createElement('div');
    shareSection.className = 'video-share-section';
    shareSection.style.marginTop = '0px';
    // Tạo một container cho icon và chữ chia sẻ nằm cùng hàng và nhỏ lại
    const shareLabelRow = document.createElement('div');
    shareLabelRow.style.display = 'flex';
    shareLabelRow.style.alignItems = 'center';
    shareLabelRow.style.gap = '6px';
    shareLabelRow.style.fontSize = '0.98rem';

    // Icon chia sẻ nhỏ
    const shareIcon = document.createElement('span');
    shareIcon.innerHTML = '<iconify-icon icon="mdi:share-variant" width="18" height="18"></iconify-icon>';
    shareIcon.style.display = 'inline-flex';
    shareIcon.style.verticalAlign = 'middle';

    // Chữ chia sẻ nhỏ lại
    const shareLabel = document.createElement('span');
    shareLabel.className = 'video-share-label';
    shareLabel.textContent = 'Chia sẻ video:';
    shareLabel.style.fontSize = '0.98rem';
    shareLabel.style.margin = '0';

    shareLabelRow.appendChild(shareIcon);
    shareLabelRow.appendChild(shareLabel);
    shareSection.appendChild(shareLabelRow);

    const shareRow = document.createElement('div');
    shareRow.className = 'video-share-row';
    shareRow.style.gap = '20px'; // nhỏ lại một xíu
    const platforms = [
        { name: 'youtube', label: 'YouTube', icon: 'mdi:youtube', color: 'text-red-600' },
        { name: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok', color: 'text-black' },
        { name: 'facebook', label: 'Facebook', icon: 'mdi:facebook', color: 'text-blue-600' }
    ];

    platforms.forEach(platform => {
        const shareItem = document.createElement('div');
        shareItem.className = `share-item-preview`;
        const btn = document.createElement('button');
        btn.className = `share-btn ${platform.name}`;
        btn.innerHTML = `<iconify-icon icon="${platform.icon}" width="32" height="32"></iconify-icon>`;
        btn.type = 'button';
        const statusSpan = document.createElement('span');
        statusSpan.className = `share-status-preview ${platform.name}-status`;
        statusSpan.textContent = 'Chưa chia sẻ';
        shareItem.appendChild(btn);
        shareItem.appendChild(statusSpan);
        shareRow.appendChild(shareItem);
    });
    shareSection.appendChild(shareRow);

    // Sau khi tạo videoElem (thẻ <video>), chèn nút bật/tắt phụ đề vào thanh điều khiển video
    // if (videoInfo.subtitleVttUrl) {
    //     // Tạo div overlay chứa nút
    //     const videoControlOverlay = document.createElement('div');
    //     videoControlOverlay.style.position = 'absolute';
    //     videoControlOverlay.style.bottom = '16px';
    //     videoControlOverlay.style.right = '120px'; // Điều chỉnh vị trí cho phù hợp
    //     videoControlOverlay.style.zIndex = '20';
    //     videoControlOverlay.style.display = 'flex';
    //     videoControlOverlay.style.alignItems = 'center';


    //     // Đảm bảo videoCard có position: relative
    //     videoCard.style.position = 'relative';
    //     videoCard.appendChild(videoControlOverlay);

    // }

    // Gắn các phần tử vào videoCard theo layout mới
    videoCard.appendChild(videoElem);
    videoCard.appendChild(titleDiv);
    videoCard.appendChild(descDiv);
    videoCard.appendChild(statsDiv);
    videoCard.appendChild(actionDiv);
    videoCard.appendChild(shareSection);

    // Hiển thị videoCard ra ngoài
    videoListContainer.appendChild(videoCard);

    // Xử lý phụ đề (ẩn/hiện)
    // if (videoInfo.subtitleVttUrl) {
    //     subtitleBtn.addEventListener('click', () => {
    //         const tracks = videoElem.textTracks;
    //         console.log('All textTracks:', tracks);
    //         for (let i = 0; i < tracks.length; i++) {
    //             if (tracks[i].kind === 'subtitles') {
    //                 console.log('Track before toggle:', tracks[i].mode);
    //                 if (tracks[i].mode === 'showing') {
    //                     tracks[i].mode = 'hidden';
    //                     subtitleBtn.classList.remove('active');
    //                 } else {
    //                     tracks[i].mode = 'showing';
    //                     subtitleBtn.classList.add('active');
    //                 }
    //                 console.log('Track after toggle:', tracks[i].mode);
    //             }
    //         }
    //     });
    // }

    // Xử lý nút Edit
    editBtn.addEventListener('click', () => {
        alert('Chuyển đến trang chỉnh sửa video');
        // window.location.href = 'edit-video.html'; // Tùy chỉnh nếu có trang chỉnh sửa
    });

    // Xử lý nút Download
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = videoInfo.url;
        link.download = `video-${videoInfo.title ? videoInfo.title.replace(/\s+/g, '_') : 'preview'}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Hàm cập nhật trạng thái chia sẻ trên giao diện
    function updateShareStatusUI(platform, isShared) {
        const statusSpan = videoListContainer.querySelector(`.share-status-preview.${platform}-status`);
        const shareItem = statusSpan ? statusSpan.closest('.share-item-preview') : null;
        if (shareItem && statusSpan) {
            if (isShared) {
                shareItem.classList.add('shared');
                statusSpan.textContent = 'Đã chia sẻ';
            } else {
                shareItem.classList.remove('shared');
                statusSpan.textContent = 'Chưa chia sẻ';
            }
        }
    }

    // Hàm xử lý chia sẻ
    function handleShare(platform, url) {
        let shareUrl = '';
        if (platform === 'youtube') {
            shareUrl = `https://www.youtube.com/share?url=${encodeURIComponent(url)}`;
        } else if (platform === 'tiktok') {
            shareUrl = `https://www.tiktok.com/share/video/${encodeURIComponent(url)}`;
        } else if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        }
        window.open(shareUrl, '_blank');

        // Simulate share success and update state after a short delay
        setTimeout(() => {
            const sharedState = JSON.parse(localStorage.getItem('videoPreviewSharedState') || '{}');
            if (!sharedState[url]) sharedState[url] = {};
            sharedState[url][platform] = true;
            localStorage.setItem('videoPreviewSharedState', JSON.stringify(sharedState));
            updateShareStatusUI(platform, true);
        }, 1000);
    }

    // Load trạng thái chia sẻ ban đầu từ localStorage
    const sharedState = JSON.parse(localStorage.getItem('videoPreviewSharedState') || '{}');
    const videoSharedPlatforms = sharedState[videoInfo.url] || {};
    platforms.forEach(p => updateShareStatusUI(p.name, videoSharedPlatforms[p.name]));

    // Sau khi render videoCard, fetch trạng thái chia sẻ từ backend nếu có videoInfo.id
    if (videoInfo.id) {
        try {
            const token = localStorage.getItem('token');
            fetch(`http://localhost:8080/create-video-service/videos/${videoInfo.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    // Cập nhật lại videoInfo với dữ liệu mới nhất từ backend
                    Object.assign(videoInfo, data);
                    sessionStorage.setItem('currentVideo', JSON.stringify(videoInfo));
                    updateShareStatusUI('youtube', !!data.youtubeUploaded);
                } else {
                    updateShareStatusUI('youtube', false);
                }
            })
            .catch(() => updateShareStatusUI('youtube', false));
        } catch (e) {
            updateShareStatusUI('youtube', false);
        }
    }

    // Gắn event cho các nút chia sẻ
    platforms.forEach(p => {
        const btn = videoListContainer.querySelector(`.share-btn.${p.name}`);
        if (btn) {
            if (p.name === 'youtube') {
                btn.addEventListener('click', async () => {
                    // Nếu đã chia sẻ YouTube thì không cho chia sẻ lại
                    if (videoInfo.youtubeUploaded) {
                        alert('Video này đã được chia sẻ lên YouTube!');
                        return;
                    }
                    const googleAuthenticated = localStorage.getItem('google_authenticated') === 'true';
                    async function uploadYouTube() {
                        console.log('[YouTube] Bắt đầu upload video lên YouTube...');
                        let googleAccessToken = localStorage.getItem('google_access_token');
                        const refreshToken = localStorage.getItem('google_refresh_token');
                        const clientId = '21243969772-0qv6o63d8nbmbqddsnvc6ldmor7s9pc3.apps.googleusercontent.com'; // Thay bằng client_id thật
                        const clientSecret = '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'; // Thay bằng client_secret thật

                        // Nếu không có access token, thử refresh
                        if (!googleAccessToken && refreshToken) {
                            try {
                                googleAccessToken = await refreshGoogleAccessToken(refreshToken, clientId, clientSecret);
                            } catch (e) {
                                // Nếu refresh thất bại, mở popup xác thực Google
                                window._pendingYouTubeUpload = uploadYouTube;
                                window.open('http://localhost:8080/create-video-service/auth/google?redirect=preview', '_blank', 'width=500,height=600');
                                return;
                            }
                        }

                        const headers = {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        };
                        if (googleAccessToken) {
                            headers['X-Google-Access-Token'] = googleAccessToken;
                        }
                        console.log('[YouTube] Headers gửi đi:', headers);
                        const res = await fetch('http://localhost:8080/create-video-service/youtube/upload', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                videoUrl: videoInfo.url,
                                title: videoInfo.title,
                                description: videoInfo.description
                            })
                        });
                        console.log('[YouTube] Response status:', res.status);
                        let responseBody = null;
                        try {
                            responseBody = await res.json();
                            console.log('[YouTube] Response body:', responseBody);
                        } catch (e) {
                            // Nếu không phải JSON, thử đọc text
                            try {
                                responseBody = await res.text();
                                console.error('[YouTube] Response error text:', responseBody);
                            } catch (e2) {
                                console.error('[YouTube] Không đọc được body response:', e2);
                            }
                        }
                        if (res.ok) {
                            console.log('[YouTube] Upload thành công:', responseBody);
                            alert('Đã upload lên YouTube: ' + (responseBody.youtubeUrl || ''));
                            if (responseBody.youtubeUrl) window.open(responseBody.youtubeUrl, '_blank');
                            updateShareStatusUI('youtube', true);
                            videoInfo.youtubeUploaded = true;
                            sessionStorage.setItem('currentVideo', JSON.stringify(videoInfo));
                            // Gọi API cập nhật trạng thái video đã upload lên YouTube
                            if (videoInfo.id) {
                                try {
                                    await fetch(`http://localhost:8080/create-video-service/videos/${videoInfo.id}/youtube-status`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                                        },
                                        body: JSON.stringify({ youtubeUploaded: true, youtubeUrl: responseBody.youtubeUrl })
                                    });
                                    console.log('[YouTube] Đã cập nhật trạng thái upload YouTube cho video');
                                    if (responseBody.youtubeUrl) {
                                        videoInfo.youtubeUrl = responseBody.youtubeUrl;
                                        sessionStorage.setItem('currentVideo', JSON.stringify(videoInfo));
                                    }
                                } catch (err) {
                                    console.error('[YouTube] Lỗi khi cập nhật trạng thái upload YouTube:', err);
                                }
                            }
                        } else if (res.status === 401) {
                            // Nếu gặp lỗi 401, thử refresh token nếu có
                            if (refreshToken) {
                                try {
                                    googleAccessToken = await refreshGoogleAccessToken(refreshToken, clientId, clientSecret);
                                    // Thử lại upload
                                    return await uploadYouTube();
                                } catch (e) {
                                    // Nếu vẫn lỗi, mở popup xác thực Google
                                    window._pendingYouTubeUpload = uploadYouTube;
                                    window.open('http://localhost:8080/create-video-service/auth/google?redirect=preview', '_blank', 'width=500,height=600');
                                    return;
                                }
                            } else {
                                // Không có refresh token, mở popup xác thực Google
                                window._pendingYouTubeUpload = uploadYouTube;
                                window.open('http://localhost:8080/create-video-service/auth/google?redirect=preview', '_blank', 'width=500,height=600');
                                return;
                            }
                        } else {
                            console.error('[YouTube] Lỗi upload:', responseBody);
                            alert('Lỗi upload YouTube: ' + (responseBody && responseBody.message ? responseBody.message : responseBody));
                        }
                    }
                    if (googleAuthenticated) {
                        await uploadYouTube();
                    } else {
                        await uploadYouTube();
                    }
                });
            } else {
                // TikTok, Facebook: vẫn mở link chia sẻ như cũ
                btn.addEventListener('click', () => handleShare(p.name, videoInfo.url));
            }
        }
    });

    // Xóa tiêu đề ngoài card nếu có
    const outerTitle = document.querySelector('.container h2.text-2xl');
    if (outerTitle) outerTitle.remove();

    // Hàm fetch và render phụ đề text đồng bộ với video
    async function setupDynamicSubtitle(videoElem, subtitleTxtUrl) {
        try {
            const res = await fetch(subtitleTxtUrl);
            const txt = await res.text();
            const lines = txt.split(/\r?\n/).filter(line => line.trim());
            if (lines.length === 0) return;
            // Tạo container phụ đề
            let subtitleContainer = document.getElementById('dynamicSubtitleContainer');
            if (!subtitleContainer) {
                subtitleContainer = document.createElement('div');
                subtitleContainer.id = 'dynamicSubtitleContainer';
                subtitleContainer.style.position = 'absolute';
                subtitleContainer.style.bottom = '60px';
                subtitleContainer.style.left = '50%';
                subtitleContainer.style.transform = 'translateX(-50%)';
                subtitleContainer.style.background = 'rgba(0,0,0,0.7)';
                subtitleContainer.style.color = '#fff';
                subtitleContainer.style.padding = '8px 24px';
                subtitleContainer.style.borderRadius = '8px';
                subtitleContainer.style.fontSize = '1.1rem';
                subtitleContainer.style.textAlign = 'center';
                subtitleContainer.style.zIndex = '30';
                subtitleContainer.style.maxWidth = '90%';
                subtitleContainer.style.display = 'none';
                videoElem.parentNode.appendChild(subtitleContainer);
            }
            // Tính thời lượng mỗi dòng (chia đều)
            const duration = videoElem.duration || 1;
            const perLine = duration / lines.length;
            // Theo dõi thời gian video
            videoElem.ontimeupdate = function() {
                if (subtitleContainer.style.display === 'none') return;
                const t = videoElem.currentTime;
                const idx = Math.floor(t / perLine);
                if (lines[idx]) {
                    subtitleContainer.innerHTML = '';
                    lines.forEach((line, i) => {
                        if (i === idx) {
                            subtitleContainer.innerHTML += `<span style="color:#ffd700;font-weight:bold;">${line}</span><br/>`;
                        } else {
                            subtitleContainer.innerHTML += `<span style="opacity:0.5;">${line}</span><br/>`;
                        }
                    });
                }
            };
            // Nút bật/tắt phụ đề
            let toggleBtn = document.getElementById('toggleDynamicSubtitleBtn');
            if (!toggleBtn) {
                toggleBtn = document.createElement('button');
                toggleBtn.id = 'toggleDynamicSubtitleBtn';
                toggleBtn.innerHTML = '<iconify-icon icon="mdi:subtitles-outline" style="font-size:1.5rem;"></iconify-icon>';
                toggleBtn.title = 'Bật/Tắt phụ đề động';
                toggleBtn.style.margin = '0 8px';
                // Tìm thanh điều khiển video
                const controls = videoElem.parentNode.querySelector('.video-controls') || videoElem.parentNode;
                // Chèn vào giữa loa và fullscreen nếu có
                const btns = controls.querySelectorAll('button');
                if (btns.length >= 2 && controls.contains(btns[btns.length-1])) {
                    controls.insertBefore(toggleBtn, btns[btns.length-1]);
                } else {
                    controls.appendChild(toggleBtn);
                }
                toggleBtn.onclick = () => {
                    subtitleContainer.style.display = subtitleContainer.style.display === 'none' ? 'block' : 'none';
                };
            }
        } catch (e) {
            console.error('Không thể tải phụ đề:', e);
        }
    }

    // Khi render video preview, nếu có subtitleVttUrl thì gọi setupDynamicSubtitle với endpoint backend
    if (videoInfo.subtitleVttUrl) {
        setupDynamicSubtitle(videoElem, `http://localhost:8080/create-video-service/videos/${videoInfo.id}/subtitle-vtt`);
    }

    // Hàm lấy view thực tế từ YouTube
    async function fetchYouTubeViewCount(youtubeUrl) {
        try {
            // Lấy videoId từ url
            const match = youtubeUrl.match(/[?&]v=([\w-]+)/);
            if (!match) return null;
            const videoId = match[1];
            const apiKey = 'AIzaSyChfJLX7tJsS2bFfP03axS_ty6jJnZN8JM'; // Lấy từ application.yaml
            const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
            const data = await res.json();
            if (data.items && data.items[0] && data.items[0].statistics) {
                return data.items[0].statistics.viewCount;
            }
        } catch (e) {
            console.error('Không lấy được view YouTube:', e);
        }
        return null;
    }

    // Hàm render view lên UI (chỉ hiển thị view YouTube từ backend)
    function renderViewCount(data) {
        const viewCountElem = document.getElementById('previewViewCount');
        if (!viewCountElem) return;
        
        if (data && data.viewCountYoutube && data.viewCountYoutube > 0) {
            console.log('[YouTubeView][Frontend] Render view:', data.viewCountYoutube);
            viewCountElem.innerHTML = `<iconify-icon icon="mdi:eye"></iconify-icon> ${data.viewCountYoutube} lượt xem (YouTube)`;
        } else if (videoInfo.youtubeUploaded && videoInfo.youtubeUrl) {
            // Nếu video đã upload YouTube nhưng chưa có view count
            console.log('[YouTubeView][Frontend] Video đã upload YouTube nhưng chưa có view count');
            viewCountElem.innerHTML = `<iconify-icon icon="mdi:eye"></iconify-icon> 0 lượt xem (YouTube)`;
        } else {
            console.log('[YouTubeView][Frontend] Không có view YouTube');
            viewCountElem.innerHTML = `<iconify-icon icon="mdi:eye"></iconify-icon> 0 lượt xem`;
        }
    }

    // Hàm fetch view từ backend
    async function fetchBackendYouTubeView() {
        if (!videoInfo.id) return;
        const token = localStorage.getItem('token');
        try {
            console.log('[YouTubeView][Frontend] Bắt đầu gọi API backend lấy view cho videoId:', videoInfo.id);
            const res = await fetch(`http://localhost:8080/create-video-service/videos/${videoInfo.id}/youtube-view`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('[YouTubeView][Frontend] Kết quả HTTP status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('[YouTubeView][Frontend] Dữ liệu trả về từ backend:', data);
                renderViewCount(data);
            } else {
                console.error('[YouTubeView][Frontend] Backend response not ok:', res.status);
                if (videoInfo.youtubeUploaded && videoInfo.youtubeUrl) {
                    renderViewCount({ viewCountYoutube: 0 });
                }
            }
        } catch (e) {
            console.error('[YouTubeView][Frontend] Lỗi khi fetch view:', e);
            if (videoInfo.youtubeUploaded && videoInfo.youtubeUrl) {
                renderViewCount({ viewCountYoutube: 0 });
            }
        }
    }

    // Gọi lần đầu khi load trang
    fetchBackendYouTubeView();
    // Sửa lại: Cứ 2 phút gọi lại 1 lần
    setInterval(fetchBackendYouTubeView, 120000);
});

// Lắng nghe token Google OAuth2 từ popup
window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('[OAuth2] Nhận token từ popup:', event.data.token);
        localStorage.setItem('token', event.data.token);
        if (event.data.googleAccessToken) {
            localStorage.setItem('google_access_token', event.data.googleAccessToken);
        }
        localStorage.setItem('google_authenticated', 'true'); // Đánh dấu đã xác thực Google
        if (window._pendingYouTubeUpload) {
            console.log('[OAuth2] Đang chờ upload lại YouTube, thực hiện lại...');
            await window._pendingYouTubeUpload();
            window._pendingYouTubeUpload = null;
        }
    }
});

// Không còn hàm loadHomepageVideos vì chỉ hiển thị 1 video preview

// Thêm hàm refreshGoogleAccessToken
async function refreshGoogleAccessToken(refreshToken, clientId, clientSecret) {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    const data = await res.json();
    if (data.access_token) {
        localStorage.setItem('google_access_token', data.access_token);
        return data.access_token;
    }
    throw new Error('Không refresh được access token');
}
