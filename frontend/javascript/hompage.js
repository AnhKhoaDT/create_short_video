document.addEventListener('DOMContentLoaded', () => {
   
    let activeButton = null;

    const createScript = document.querySelector(".create-script");
    const createVideo = document.querySelector(".create-video");

    if (createScript && createVideo) {
        createScript.addEventListener("click", () => {
            if (activeButton === createScript) {
                createScript.classList.remove("bg-blue-500");
                createScript.classList.add("bg-white");
                activeButton = null;
            } else {
                if (activeButton) {
                    activeButton.classList.remove("bg-blue-500");
                    activeButton.classList.add("bg-white");
                }
                createScript.classList.remove("bg-white");
                createScript.classList.add("bg-blue-500");
                activeButton = createScript;
                if (createVideo.classList.contains("bg-blue-500")) {
                    createVideo.classList.remove("bg-blue-500");
                    createVideo.classList.add("bg-white");
                }
            }
        });

        createVideo.addEventListener("click", () => {
            if (activeButton === createVideo) {
                createVideo.classList.remove("bg-blue-500");
                createVideo.classList.add("bg-white");
                activeButton = null;
            } else {
                if (activeButton) {
                    activeButton.classList.remove("bg-blue-500");
                    activeButton.classList.add("bg-white");
                }
                createVideo.classList.remove("bg-white");
                createVideo.classList.add("bg-blue-500");
                activeButton = createVideo;
                if (createScript.classList.contains("bg-blue-500")) {
                    createScript.classList.remove("bg-blue-500");
                    createScript.classList.add("bg-white");
                }
            }
        });
    } else {
        console.log('Could not find createScript or createVideo elements');
    }

    // Theo dõi và hiển thị số ký tự của input
    const inputScript = document.getElementById("inputScript");
    const charCount = document.getElementById("charCount");
    const maxLength = 3000;

    if (inputScript && charCount) {
        console.log('Found inputScript and charCount elements');
        inputScript.addEventListener("input", () => {
            const currentLength = inputScript.value.length;
            if (currentLength > maxLength) {
                inputScript.value = inputScript.value.substring(0, maxLength);
                alert("Bạn đã nhập vượt quá giới hạn 3000 ký tự!");
            }
            charCount.textContent = `${currentLength}/3000`;
        });
    } else {
        console.log('Could not find inputScript or charCount elements');
    }
});