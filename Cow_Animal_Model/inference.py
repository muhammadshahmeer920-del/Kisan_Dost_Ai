import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image

MODEL_PATH = "model/livestock_model.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model = None
_class_names = []

def load_inference_model():
    """Loads model weights into memory for prediction."""
    global _model, _class_names
    
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Make sure training is complete.")

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    _class_names = checkpoint['class_names']
    num_classes = len(_class_names)

    _model = models.efficientnet_b0(weights=None)
    in_features = _model.classifier[1].in_features
    _model.classifier[1] = nn.Linear(in_features, num_classes)

    _model.load_state_dict(checkpoint['model_state_dict'])
    _model = _model.to(DEVICE)
    _model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def predict(image_input):
    """
    Public Predict Function
    """
    global _model, _class_names
    
    if _model is None:
        load_inference_model()

    if isinstance(image_input, str):
        image = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        image = image_input.convert("RGB")
    else:
        raise ValueError("Unsupported image input type.")

    img_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = _model(img_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, pred_class_idx = torch.max(probabilities, dim=1)

    predicted_disease = _class_names[pred_class_idx.item()]
    confidence_score = round(confidence.item(), 4)

    return {
        "disease": predicted_disease,
        "confidence": confidence_score
    }