// بدء تشغيل الكاميرا
async function startCamera() {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}
startCamera();

// تحميل نموذج الذكاء الاصطناعي للتعرف على الوجه
const faceDetector = await faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh);

// تحديد موقع الأنف لوضع النظارات عليه
async function detectFace() {
  const video = document.getElementById("video");
  const faces = await faceDetector.estimateFaces(video);

  if (faces.length > 0) {
      const nose = faces[0].keypoints.find(k => k.name === "nose");
      if (nose) {
          document.getElementById("glasses").setAttribute("position", `${nose.x / 100} ${nose.y / 100} -2`);
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
