// بدء تشغيل الكاميرا الأمامية
async function startCamera() {
    const video = document.getElementById("video");
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" } // استخدام الكاميرا الأمامية
    });
    video.srcObject = stream;
}
startCamera();

// تحميل نموذج التعرف على ملامح الوجه
async function loadFaceMesh() {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detector = await faceLandmarksDetection.createDetector(model);
    return detector;
}

let faceDetector;
loadFaceMesh().then(detector => faceDetector = detector);

// تحديث موضع النظارات بناءً على الوجه
async function detectFace() {
    if (!faceDetector) return;

    const video = document.getElementById("video");
    const faces = await faceDetector.estimateFaces(video);

    if (faces.length > 0) {
        const nose = faces[0].keypoints.find(k => k.name === "nose");

        if (nose) {
            const glasses = document.getElementById("glasses");
            glasses.setAttribute("position", `${nose.x / 100} ${nose.y / 100} -2`);
        }
    }
}
setInterval(detectFace, 100);

// تغيير النظارات عند الضغط على الزر
let glassesIndex = 1;
function changeGlasses() {
    glassesIndex = glassesIndex === 1 ? 2 : 1;
    document.getElementById("glasses").setAttribute("gltf-model", `glasses${glassesIndex}.glb`);
}
