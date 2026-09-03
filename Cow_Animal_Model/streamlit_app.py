import streamlit as st
import requests
from PIL import Image
import io
import sys
import os
import re

# 1. Local Directory Path Fix
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Safe import for PDF Generator
try:
    from pdf_generator import generate_pdf_report
    PDF_ENABLED = True
except Exception:
    PDF_ENABLED = False


# 2. Page Configuration
st.set_page_config(
    page_title="Livestock Guardian AI | Enterprise Diagnostic Platform",
    page_icon="🐄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 3. Custom UI Styling
st.markdown("""
<style>
    .block-container { 
        padding-top: 2rem; 
        padding-bottom: 2rem; 
    }
    .main-header {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 1.8rem;
        border-radius: 12px;
        color: white;
        text-align: center;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    .main-header h1 { 
        color: white !important; 
        font-weight: 700; 
        margin-bottom: 0.3rem; 
    }
</style>
""", unsafe_allow_html=True)

# 4. Header Banner
st.markdown("""
<div class="main-header">
    <h1>🐄 Livestock Guardian AI</h1>
    <p>EfficientNetB0 Vision Diagnostics & Gemini Dual-Language Guidance</p>
</div>
""", unsafe_allow_html=True)

# 5. Sidebar Configuration
with st.sidebar:
    st.image("https://img.icons8.com/color/96/cow.png", width=80)
    st.header("⚙️ System Settings")
    api_url = st.text_input("FastAPI Endpoint URL", value="http://127.0.0.1:8000/predict")
    
    st.divider()
    st.subheader("📌 System Features")
    st.markdown("""
    - **Vision Backbone:** EfficientNet-B0
    - **LLM Engine:** Gemini 2.5 Flash
    - **Languages:** English + Urdu (اردو)
    - **Audio Playback:** Urdu gTTS Speech Only
    - **PDF Export:** Clinical Report Generation
    """)
    st.divider()
    st.caption("Automated Livestock Health Monitoring System")

# 6. Main Grid Layout
col_left, col_right = st.columns([1, 1], gap="large")

with col_left:
    st.subheader("📸 1. Image Upload & Input")
    uploaded_file = st.file_uploader(
        "Upload clinical photo of animal (Mouth, Skin, Hoof, or Teat)", 
        type=["jpg", "jpeg", "png"]
    )
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption=f"Uploaded Specimen: {uploaded_file.name}", width="stretch")
        analyze_btn = st.button("🚀 Run AI Analysis", type="primary", width="stretch")
    else:
        st.info("👆 Please upload a photo to analyze disease status.")

with col_right:
    st.subheader("📊 2. AI Diagnostics & Export Options")
    
    if uploaded_file is not None and 'analyze_btn' in locals() and analyze_btn:
        with st.spinner("Processing image tensor & querying Gemini LLM..."):
            try:
                # Convert image to payload
                img_bytes = io.BytesIO()
                image.save(img_bytes, format=image.format if image.format else "JPEG")
                img_bytes = img_bytes.getvalue()
                
                files = {"file": (uploaded_file.name, img_bytes, uploaded_file.type)}
                response = requests.post(api_url, files=files)
                
                if response.status_code == 200:
                    data = response.json()
                    pred = data.get("prediction", {})
                    disease = pred.get("disease", "Unknown").capitalize()
                    conf = pred.get("confidence", 0.0)
                    conf_pct = pred.get("confidence_percentage", "0%")
                    guidance = data.get("vet_guidance", "")
                    
                    st.session_state['result'] = {
                        "disease": disease,
                        "confidence": conf,
                        "confidence_pct": conf_pct,
                        "guidance": guidance
                    }
                else:
                    st.error(f"❌ API Error ({response.status_code}): {response.text}")
            except Exception as e:
                st.error(f"❌ Connection Failed: Ensure FastAPI backend is running on {api_url}.")

    # Render Active Analysis Results
    if 'result' in st.session_state:
        res = st.session_state['result']
        
        # Diagnostic Metric Displays
        m1, m2 = st.columns(2)
        with m1:
            if res["disease"].lower() == "healthy":
                st.success(f"**Status:** {res['disease']}")
            else:
                st.error(f"**Diagnosis:** {res['disease']}")
        with m2:
            st.info(f"**AI Confidence:** {res['confidence_pct']}")
            
        st.progress(float(res["confidence"]))
        
        # Action Bar: PDF Download & Pure Urdu Audio Guidance
        st.divider()
        b_col1, b_col2 = st.columns(2)
        
        # Column 1: PDF Export
        with b_col1:
            if PDF_ENABLED:
                try:
                    pdf_path = generate_pdf_report(res["disease"], res["confidence"], res["guidance"])
                    with open(pdf_path, "rb") as pdf_file:
                        st.download_button(
                            label="📄 Download PDF Report",
                            data=pdf_file,
                            file_name=f"vet_report_{res['disease']}.pdf",
                            mime="application/pdf",
                            width="stretch"
                        )
                except Exception as e:
                    st.warning(f"PDF Notice: {e}")
            else:
                st.info("📄 PDF Generator module initializing...")

        # Column 2: Exclusive Urdu Audio Player
        with b_col2:
            try:
                from gtts import gTTS
                
                full_text = res['guidance']
                
                # Extract Urdu block (Arabic/Urdu Script Unicode matching)
                urdu_matches = re.findall(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s۔،؟!]+', full_text)
                clean_urdu_text = " ".join([txt.strip() for txt in urdu_matches if len(txt.strip()) > 3])
                
                if not clean_urdu_text:
                    clean_urdu_text = f"تشخیص: {res['disease']}۔"

                with st.spinner("🔊 Generating full Urdu audio..."):
                    tts = gTTS(text=clean_urdu_text, lang='ur')
                    audio_io = io.BytesIO()
                    tts.write_to_fp(audio_io)
                    audio_io.seek(0)
                    st.audio(audio_io, format="audio/mp3")

            except Exception as e:
                st.warning("🔊 Audio Notice: Run `pip install gTTS` in terminal and check internet connectivity.")

        # Advisory Text Section
        st.markdown("---")
        st.markdown("### 📋 Executive Advisory Report / طبی ہدایت نامہ")
        st.markdown(res["guidance"])
    else:
        st.markdown("""
        <div style="text-align: center; padding: 3rem; border: 2px dashed rgba(128,128,128,0.3); border-radius: 10px;">
            <p style="opacity: 0.7;">Upload an image on the left and click <b>Run AI Analysis</b> to view diagnostic results.</p>
        </div>
        """, unsafe_allow_html=True)