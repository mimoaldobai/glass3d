// تشغيل الكاميرا
async function startCamera() {
    const video = document.getElementById("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}
startCamera();

// تحميل نموذج الذكاء الاصطناعي
async function initFaceDetector() {
    await tf.setBackend("webgl");
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
        runtime: "mediapipe",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh"
    };
    return await faceLandmarksDetection.createDetector(model, detectorConfig);
}

let faceDetector;
(async () => {
    faceDetector = await initFaceDetector();
})();

// تحديث موقع النظارات بناءً على وجه المستخدم
async function detectFace() {
    if (!faceDetector) return;

    const video = document.getElementById("video");
    const faces = await faceDetector.estimateFaces(video, { flipHorizontal: false });

    if (faces.length > 0) {
        const nose = faces[0].keypoints.find(k => k.name === "nose_tip");
        if (nose) {
            const glasses = document.getElementById("glasses");
            const x = (nose.x - 320) / 200; // ضبط الموضع بناءً على عرض الكاميرا
            const y = (nose.y - 240) / 200;
            glasses.setAttribute("position", `${x} ${y + 1.5} -2`);
        }
    }
}
setInterval(detectFace, 100);

// تغيير النظارات
let glassesIndex = 1;
function changeGlasses() {
    glassesIndex = glassesIndex === 1 ? 2 : 1;
document.getElementById("glasses").setAttribute("gltf-model", `glasses${glassesIndex}.glb`);
}
