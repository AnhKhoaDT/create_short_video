// Giả lập trạng thái đăng nhập
const username = ""; // Thay bằng "" để giả lập chưa đăng nhập
const userInitial = document.getElementById("userInitial");

if (username) {
    // Nếu đã đăng nhập, hiển thị chữ cái đầu của username
    userInitial.textContent = username.charAt(0).toUpperCase();
} else {
    // Nếu chưa đăng nhập, hiển thị biểu tượng người
    userInitial.innerHTML = `
        <iconify-icon 
            icon="mdi:account" 
            style="color: white;" 
            width="24" 
            height="24"
        ></iconify-icon>
    `;
}


// Xử lý sự kiện cho nút Create Script và Create Video
const createScript = document.querySelector(".create-script");
const createVideo = document.querySelector(".create-video");

let activeButton = null;

createScript.addEventListener("click", () => {
    if (activeButton === createScript) {
        // Nếu nút đã được nhấn, tắt nó
        createScript.classList.remove("bg-blue-500");
        createScript.classList.add("bg-white");
        activeButton = null;
    } else {
        // Nếu nút khác đã được nhấn, tắt nó trước
        if (activeButton) {
            activeButton.classList.remove("bg-blue-500");
            activeButton.classList.add("bg-white");
        }
        // Kích hoạt nút hiện tại
        createScript.classList.remove("bg-white");
        createScript.classList.add("bg-blue-500");
        activeButton = createScript;
        // Tắt nút còn lại nếu đang active
        if (createVideo.classList.contains("bg-blue-500")) {
            createVideo.classList.remove("bg-blue-500");
            createVideo.classList.add("bg-white");
        }
    }
});

createVideo.addEventListener("click", () => {
    if (activeButton === createVideo) {
        // Nếu nút đã được nhấn, tắt nó
        createVideo.classList.remove("bg-blue-500");
        createVideo.classList.add("bg-white");
        activeButton = null;
    } else {
        // Nếu nút khác đã được nhấn, tắt nó trước
        if (activeButton) {
            activeButton.classList.remove("bg-blue-500");
            activeButton.classList.add("bg-white");
        }
        // Kích hoạt nút hiện tại
        createVideo.classList.remove("bg-white");
        createVideo.classList.add("bg-blue-500");
        activeButton = createVideo;
        // Tắt nút còn lại nếu đang active
        if (createScript.classList.contains("bg-blue-500")) {
            createScript.classList.remove("bg-blue-500");
            createScript.classList.add("bg-white");
        }
    }
});


// Theo dõi và hiển thị số ký tự của input
const inputScript = document.getElementById("inputScript");
const charCount = document.getElementById("charCount");

inputScript.addEventListener("input", () => {
    const currentLength = inputScript.value.length;
    charCount.textContent = `${currentLength}/3000`;
});