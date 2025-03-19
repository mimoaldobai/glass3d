// بدء تشغيل الكاميرا الأمامية
async function startCamera() {
    const video = document.getElementById("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;

    video.onloadeddata = () => {
        detectFace();
    };
}

// تحميل نموذج الذكاء الاصطناعي للتعرف على الوجه
async function loadFaceMesh() {
    return await facemesh.load();
}

// تحديد موقع الأنف لوضع النظارات عليه
async function detectFace() {
    const video = document.getElementById("video");
    const glasses = document.getElementById("glasses");
    const faceMesh = await loadFaceMesh();

    async function updateGlassesPosition() {
        const faces = await faceMesh.estimateFaces(video);
        if (faces.length > 0) {
            const nose = faces[0].annotations.noseTip[0]; // تحديد موقع الأنف
            glasses.setAttribute("position", `${nose[0] / 100} ${nose[1] / 100} -2`);
        }
        requestAnimationFrame(updateGlassesPosition);
    }

    updateGlassesPosition();
}

// تغيير النظارات عند الضغط على الزر
let glassesIndex = 1;
document.getElementById("tryGlassesBtn").addEventListener("click", function() {
    // إظهار النظارات فقط عند الضغط على الزر
    const glasses = document.getElementById("glasses");
    glasses.setAttribute("visible", "true");

    // تغيير النظارات
    glassesIndex = glassesIndex === 1 ? 2 : 1;
    document.getElementById("glasses").setAttribute("gltf-model", `#glassesModel${glassesIndex}`);
});

// بدء الكاميرا عند تحميل الصفحة
startCamera();
