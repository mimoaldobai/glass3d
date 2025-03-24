from flask import Flask, render_template, Response
import cv2
import mediapipe as mp
import numpy as np

app = Flask(__name__)

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

# Load accessory image (e.g., glasses)
accessory = cv2.imread('static/glasses.png', cv2.IMREAD_UNCHANGED)

# Check if the accessory image has an alpha channel
if accessory.shape[2] != 4:
    raise ValueError("The accessory image does not have an alpha channel. Please use a transparent PNG image.")

def overlay_image_alpha(img, img_overlay, x, y, alpha_mask):
    """Overlay img_overlay on top of img at (x, y) and blend using alpha_mask."""
    # Image ranges
    y1, y2 = max(0, y), min(img.shape[0], y + img_overlay.shape[0])
    x1, x2 = max(0, x), min(img.shape[1], x + img_overlay.shape[1])

    y1o, y2o = max(0, -y), min(img_overlay.shape[0], img.shape[0] - y)
    x1o, x2o = max(0, -x), min(img_overlay.shape[1], img.shape[1] - x)

    # Exit if nothing to do
    if y1 >= y2 or x1 >= x2 or y1o >= y2o or x1o >= x2o:
        return

    # Blend overlay within the determined ranges
    img_crop = img[y1:y2, x1:x2]
    img_overlay_crop = img_overlay[y1o:y2o, x1o:x2o]
    alpha = alpha_mask[y1o:y2o, x1o:x2o, None] / 255.0

    img_crop[:] = (1.0 - alpha) * img_crop + alpha * img_overlay_crop

@app.route('/')
def index():
    return render_template('index.html')

def generate_frames():
    cap = cv2.VideoCapture(0)

    with mp_face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5) as face_detection:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert the BGR image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # To improve performance, optionally mark the image as not writeable to pass by reference.
            image.flags.writeable = False
            results = face_detection.process(image)

            # Draw the face detection annotations on the image.
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.detections:
                for detection in results.detections:
                    # Get the bounding box and keypoints
                    bboxC = detection.location_data.relative_bounding_box
                    ih, iw, _ = image.shape
                    bbox = int(bboxC.xmin * iw), int(bboxC.ymin * ih), \
                           int(bboxC.width * iw), int(bboxC.height * ih)
                    x, y, w, h = bbox

                    # Scale factors for the accessory to reduce its size
                    width_scale_factor = 0.9  # Reduce the width
                    height_scale_factor = 0.4  # Reduce the height

                    accessory_width = int(w * width_scale_factor)
                    accessory_height = int(h * height_scale_factor)

                    # Calculate position to overlay the accessory, slightly above the eyes
                    x_centered = x + (w - accessory_width) // 2
                    y_centered = y + (h - accessory_height) // 2 - int(h * 0.1)  # Adjust this factor for position

                    # Ensure the accessory doesn't go above the top of the frame
                    y_centered = max(y_centered, 0)

                    # Resize accessory to the new dimensions
                    accessory_resized = cv2.resize(accessory, (accessory_width, accessory_height))

                    # Get the alpha mask from the accessory image
                    alpha_mask = accessory_resized[:, :, 3]

                    # Overlay the accessory on the face
                    overlay_image_alpha(image, accessory_resized[:, :, :3], x_centered, y_centered, alpha_mask)

            ret, jpeg = cv2.imencode('.jpg', image)
            frame = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)
