import os
import io
import json
import base64
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from google import genai
from gtts import gTTS

# Import Phase 5 public predict interface
from inference import predict

app = FastAPI(
    title="Livestock Guardian AI API",
    description="Disease Detection with EfficientNetB0 & Gemini Dual-Language Vet Guidance"
)

# Allow Express proxy and local dev to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Gemini API key from environment; create a .env file in this folder to set GEMINI_API_KEY.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def generate_vet_data(disease_name: str, confidence: float):
    """
    Generates structured veterinary guidance in English and Urdu.
    Uses Gemini LLM if key is valid, else gracefully falls back to pre-formatted templates.
    """
    
    # Pre-formatted Local Fallback Guidance
    def get_fallback_data(disease: str, conf: float):
        if disease.lower() == "healthy":
            return {
                "description_en": f"The livestock animal is evaluated as HEALTHY ({conf*100:.1f}% confidence).",
                "treatment_en": "Ensure continuous access to fresh water and a nutritionally balanced diet. Follow routine vaccination schedules and control parasites.",
                "description_ur": f"جانور بالکل صحت مند ہے ({conf*100:.1f}% اعتماد)۔",
                "treatment_ur": "جانوروں کو صاف ستھرا پانی اور غذائیت سے بھرپور چارہ فراہم کریں۔ پیٹ کے کیڑوں کی دوا (Deworming) اور وقت پر ویکسینیشن یقینی بنائیں۔ باڑے کی روزانہ صفائی کا خاص خیال رکھیں۔"
            }
        else:
            return {
                "description_en": f"Animal is diagnosed with {disease.upper()} ({conf*100:.1f}% confidence).",
                "treatment_en": "Separate the affected animal immediately from the herd. Look for lesions in mouth/hooves, fever, or lethargy. Immediately consult a qualified veterinarian.",
                "description_ur": f"جانور میں {disease.upper()} بیماری کی تصدیق ہوئی ہے ({conf*100:.1f}% اعتماد)۔",
                "treatment_ur": "متاثرہ جانور کو فوری طور پر باڑے کے باقی تمام جانوروں سے الگ کریں۔ منہ یا کھروں پر چھالے، شدید بخار، اور چارہ نہ کھانے کی علامات دیکھیں۔ قریبی ویٹرنری ڈاکٹر سے رجوع کریں۔"
            }

    # Attempt calling real Gemini API
    try:
        if not GEMINI_API_KEY or "YOUR_ACTUAL_API_KEY" in GEMINI_API_KEY:
            return get_fallback_data(disease_name, confidence)

        ai_client = genai.Client(api_key=GEMINI_API_KEY)
        
        prompt = (
            f"A livestock animal has been evaluated with diagnosis '{disease_name}' at {confidence*100:.1f}% confidence.\n"
            "Generate a JSON object containing the veterinary diagnosis and recommendations with these keys:\n"
            "- description_en: Concise clinical description of the disease/health state in English.\n"
            "- treatment_en: Treatment instructions and precautions in English.\n"
            "- description_ur: Concise clinical description of the disease/health state in Urdu script (Authentic Urdu, no Hindi transliterations).\n"
            "- treatment_ur: Treatment instructions and precautions in Urdu script (Authentic Urdu, no Hindi transliterations).\n\n"
            "Respond ONLY with valid JSON. Do not include markdown code block formatting."
        )

        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text = "\n".join(lines[1:-1])
        
        data = json.loads(text)
        return {
            "description_en": data.get("description_en", f"Status: {disease_name}"),
            "treatment_en": data.get("treatment_en", "Provide fresh clean water and seek veterinary advice."),
            "description_ur": data.get("description_ur", f"تشخیص: {disease_name}"),
            "treatment_ur": data.get("treatment_ur", "جانور کو الگ رکھیں اور ویٹرنری ڈاکٹر سے رجوع کریں۔")
        }

    except Exception:
        # Fallback executed on API limits/invalid key error or parsing issues
        return get_fallback_data(disease_name, confidence)


def generate_urdu_speech_base64(description_ur: str, treatment_ur: str) -> str:
    """
    Generates Urdu speech audio for the Urdu diagnosis and returns it as a Base64 string.
    Combines description_ur and treatment_ur, strips markdown/special characters that
    disrupt natural speech, and keeps English medicine names for phonetic pronunciation.
    """
    try:
        # Combine full Urdu diagnosis and treatment guidance
        full_urdu_text = f"{description_ur}۔ {treatment_ur}"

        # Clean text: remove markdown symbols and normalize whitespace
        # English technical/medicine names are kept so gTTS pronounces them phonetically
        clean_urdu_text = (
            full_urdu_text
            .replace("*", "")
            .replace("#", "")
            .replace("`", "")
            .replace("|", "")
            .replace("\n", " ")
            .strip()
        )
        # Collapse multiple spaces into one
        clean_urdu_text = " ".join(clean_urdu_text.split())

        fp = io.BytesIO()
        tts = gTTS(text=clean_urdu_text, lang='ur', slow=False)
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_base64 = base64.b64encode(fp.read()).decode('utf-8')
        return audio_base64
    except Exception as e:
        print("gTTS Audio notice:", e)
        return ""


@app.get("/")
def home():
    return {
        "status": "Online",
        "service": "Livestock Guardian AI Diagnostic API",
        "version": "1.0.0"
    }


@app.post("/api/tts")
async def tts_endpoint(request: dict):
    """
    Standalone Urdu TTS endpoint: accepts arbitrary text, returns base64 MP3 audio.
    Used by the Express frontend for hybrid TTS on any Urdu content.
    """
    text = request.get("text", "").strip()
    if not text:
        return {"success": False, "error": "text is required"}

    try:
        clean_text = (
            text
            .replace("*", "")
            .replace("#", "")
            .replace("`", "")
            .replace("|", "")
            .replace("\n", " ")
            .strip()
        )
        clean_text = " ".join(clean_text.split())

        fp = io.BytesIO()
        tts = gTTS(text=clean_text, lang='ur', slow=False)
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_base64 = base64.b64encode(fp.read()).decode('utf-8')
        return {"success": True, "audio_base64": audio_base64}
    except Exception as e:
        print("TTS endpoint error:", e)
        return {"success": False, "error": str(e)}


@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    """
    Unified Endpoint: Accepts Image File -> PyTorch Model Diagnostics -> Gemini LLM Dual-Language Guidance + Urdu Voice
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPG, PNG, JPEG).")

    try:
        # Read and open image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # PyTorch Inference Call
        raw_prediction = predict(image)
        disease = raw_prediction["disease"]
        confidence = raw_prediction["confidence"]

        # Gemini / Dual-Language Report Generation Call
        vet_data = generate_vet_data(disease, confidence)
        
        # Urdu voice generation call
        audio_base64 = generate_urdu_speech_base64(vet_data["description_ur"], vet_data["treatment_ur"])

        # Create backwards-compatible guidance string for the Streamlit client
        vet_report = (
            f"### 🌐 Diagnosis / تشخیص\n"
            f"**English:** {vet_data['description_en']}\n"
            f"**اردو:** {vet_data['description_ur']}\n\n"
            f"---\n"
            f"### 💊 Recommended Actions / تجاویز\n"
            f"**English:** {vet_data['treatment_en']}\n"
            f"**اردو:** {vet_data['treatment_ur']}"
        )

        return {
            "success": True,
            "status": "success",
            "disease_name": disease,
            "confidence": confidence,
            "description_ur": vet_data["description_ur"],
            "treatment_ur": vet_data["treatment_ur"],
            "audio_base64": audio_base64,
            
            # Keep these for Streamlit app compatibility
            "prediction": {
                "disease": disease,
                "confidence": confidence,
                "confidence_percentage": f"{confidence * 100:.1f}%"
            },
            "vet_guidance": vet_report
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference Failure: {str(e)}")