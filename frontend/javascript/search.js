document.addEventListener('DOMContentLoaded', () => {
    const inputScript = document.getElementById('inputScript');
    const scriptInputContainer = inputScript.parentElement; // Get the parent div with relative positioning
    const searchSuggestions = document.createElement('div'); // Create the suggestions div dynamically
    searchSuggestions.id = 'searchSuggestions';
    searchSuggestions.className = 'absolute z-50 hidden w-full mt-1 bg-white border rounded-lg shadow-lg';
    // Insert the suggestions div right after the inputScript
    inputScript.insertAdjacentElement('afterend', searchSuggestions);

    // Lưu trữ lịch sử tìm kiếm
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const MAX_HISTORY_ITEMS = 5;

    // Removed hardcoded trendingTopics

    // Hiển thị gợi ý khi nhập
    inputScript.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length > 0) {
            showSuggestions(query);
        } else {
            showDefaultSuggestions();
        }
    });

    // Xử lý khi click vào gợi ý
    searchSuggestions.addEventListener('click', (e) => {
        const suggestion = e.target.closest('.suggestion-item');
        if (suggestion) {
            const searchText = suggestion.dataset.text;
            inputScript.value = searchText;
            addToHistory(searchText);
            searchSuggestions.classList.add('hidden');
            performSearch(searchText); // Call perform search with the selected suggestion
        }
    });

    // Ẩn gợi ý khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!inputScript.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.add('hidden');
        }
    });

    // Hiển thị gợi ý dựa trên từ khóa (lấy từ API)
    async function showSuggestions(query) {
        let suggestionsHTML = '';

        // Hiển thị lịch sử tìm kiếm phù hợp
        const filteredHistory = searchHistory.filter(item =>
            item.toLowerCase().includes(query.toLowerCase())
        );
        if (filteredHistory.length > 0) {
            suggestionsHTML += `
                <div class="mb-2">
                    <h3 class="px-2 py-1 text-sm font-medium text-gray-500">Tìm kiếm gần đây</h3>
                    <div id="recentSearches" class="space-y-1">
                    ${filteredHistory.map(item => `
                        <div class="suggestion-item px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center" data-text="${item}">
                            <iconify-icon icon="mdi:history" class="text-gray-400 mr-2"></iconify-icon>
                            <span>${item}</span>
                        </div>
                    `).join('')}
                    </div>
                </div>
            `;
        }

        // Hiển thị xu hướng tìm kiếm từ API
        try {
            // Get the token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Authentication token not found.');
                // Optionally display a message to the user
                 suggestionsHTML += `<div class="p-2 text-red-500">Vui lòng đăng nhập để xem gợi ý.</div>`;
                 searchSuggestions.innerHTML = suggestionsHTML;
                 searchSuggestions.classList.remove('hidden');
                return; // Stop if token is not available
            }

            // Call the backend API with Authorization header
            const response = await fetch(`http://localhost:8080/create-video-service/suggest?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Add the Authorization header
                }
            });

            if (!response.ok) {
                 console.error('Failed to fetch suggestions from API:', response.statusText);
                 // Optionally display an error message in the suggestions dropdown
                 // suggestionsHTML += `<div class="p-2 text-red-500">Không thể tải gợi ý.</div>`;
            } else {
                const apiSuggestions = await response.json(); // API is expected to return a list of strings

                if (apiSuggestions && apiSuggestions.length > 0) {
                     suggestionsHTML += `
                        <div>
                            <h3 class="px-2 py-1 text-sm font-medium text-gray-500">Xu hướng tìm kiếm</h3>
                             <div id="trendingSearches" class="space-y-1">
                            ${apiSuggestions.map(item => `
                                <div class="suggestion-item px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between" data-text="${item}">
                                    <div class="flex items-center">
                                        <iconify-icon icon="mdi:trending-up" class="text-blue-500 mr-2"></iconify-icon>
                                        <span>${item}</span>
                                    </div>
                                </div>
                            `).join('')}
                            </div>
                        </div>
                    `;
                }
            }

        } catch (error) {
            console.error('Error calling suggest API:', error);
             // Optionally display an error message in the suggestions dropdown
            // suggestionsHTML += `<div class="p-2 text-red-500">Đã xảy ra lỗi khi lấy gợi ý.</div>`;
        }


        searchSuggestions.innerHTML = suggestionsHTML;
         if (suggestionsHTML.trim().length > 0) {
             searchSuggestions.classList.remove('hidden');
         } else {
             searchSuggestions.classList.add('hidden');
         }
    }

    // Hiển thị gợi ý mặc định (chỉ lịch sử tìm kiếm)
    function showDefaultSuggestions() {
        let suggestionsHTML = '';

        // Hiển thị lịch sử tìm kiếm gần đây
        if (searchHistory.length > 0) {
            suggestionsHTML += `
                <div class="mb-2">
                    <h3 class="px-2 py-1 text-sm font-medium text-gray-500">Tìm kiếm gần đây</h3>
                    <div id="recentSearches" class="space-y-1">
                    ${searchHistory.map(item => `
                        <div class="suggestion-item px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center" data-text="${item}">
                            <iconify-icon icon="mdi:history" class="text-gray-400 mr-2"></iconify-icon>
                            <span>${item}</span>
                        </div>
                    `).join('')}
                    </div>
                </div>
            `;
        }
         // Don't show "Xu hướng tìm kiếm" section if input is empty
         // Add a placeholder if no history and no trends loaded (input empty)
         if(suggestionsHTML.trim().length === 0){
             suggestionsHTML = `<div class="p-2 text-gray-500">Bắt đầu gõ để xem gợi ý...</div>`;
         }


        searchSuggestions.innerHTML = suggestionsHTML;
         if (suggestionsHTML.trim().length > 0 && !suggestionsHTML.includes("Bắt đầu gõ để xem gợi ý...")) {
              searchSuggestions.classList.remove('hidden');
         } else {
              searchSuggestions.classList.add('hidden');
         }
    }


    // Thêm vào lịch sử tìm kiếm
    function addToHistory(searchText) {
        // Xóa nếu đã tồn tại
        searchHistory = searchHistory.filter(item => item !== searchText);
        // Thêm vào đầu mảng
        searchHistory.unshift(searchText);
        // Giới hạn số lượng
        if (searchHistory.length > MAX_HISTORY_ITEMS) {
            searchHistory.pop();
        }
        // Lưu vào localStorage
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    // Thực hiện tìm kiếm - This might need further implementation
    function performSearch(query) {
        console.log('Performing search for:', query);
        // TODO: Add actual search logic here (e.g., navigate to a search results page or filter content on the current page)
    }

    // Hiển thị gợi ý mặc định khi focus vào ô nhập kịch bản
    inputScript.addEventListener('focus', () => {
        if (inputScript.value.trim().length === 0) {
            showDefaultSuggestions();
        } else {
            // If there's already text, show suggestions based on that text
            showSuggestions(inputScript.value.trim());
        }
    });

     // Ensure suggestions are hidden initially
     searchSuggestions.classList.add('hidden');
}); 