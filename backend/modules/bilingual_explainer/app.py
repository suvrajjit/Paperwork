from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import os
import sys

# Support relative imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.modules.bilingual_explainer.explainer import bilingual_explainer_service
from backend.app.services.ai.gemini_service import gemini_service
from backend.app.services.ai.groq import groq_service

app = FastAPI(
    title="Bilingual Explainer & Conversational Voice Standalone Service",
    description="Plain-language text simplification and multi-turn voice guidance with STT & Gemini/Google TTS.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExplainRequest(BaseModel):
    text: str
    context: Optional[str] = None
    target_language: str = "hi"


class VoiceGuideRequest(BaseModel):
    user_message: str
    language: str = "hi"
    current_screen: str = "welcome"
    agent_stage: Optional[str] = "GREETING"
    active_form_id: Optional[str] = None
    active_field_id: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None
    form_fields: Optional[List[Dict[str, Any]]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    synthesize_audio: bool = True


class SynthesizeSpeechRequest(BaseModel):
    text: str
    voice_name: Optional[str] = "Aoede"


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "bilingual-explainer-voice",
        "version": "1.0.0",
    }


@app.post("/v1/explain")
def explain_text(req: ExplainRequest):
    try:
        return bilingual_explainer_service.explain_text(
            text=req.text,
            context=req.context,
            target_language=req.target_language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text simplification error: {e}")


@app.post("/v1/assistant/agent/guide")
def voice_agent_guide(req: VoiceGuideRequest):
    try:
        return bilingual_explainer_service.voice_guide_turn(
            user_message=req.user_message,
            language=req.language,
            current_screen=req.current_screen,
            agent_stage=req.agent_stage,
            active_form_id=req.active_form_id,
            active_field_id=req.active_field_id,
            profile_data=req.profile_data,
            form_fields=req.form_fields,
            conversation_history=req.conversation_history,
            synthesize_audio=req.synthesize_audio,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice agent turn error: {e}")


@app.post("/v1/assistant/synthesize")
def synthesize_speech(req: SynthesizeSpeechRequest):
    try:
        res = gemini_service.synthesize_speech(req.text, req.voice_name)
        if not res:
            raise HTTPException(status_code=500, detail="TTS synthesis failed")
        audio_b64, audio_fmt = res
        return {
            "audio_base64": audio_b64,
            "format": audio_fmt,
            "voice": req.voice_name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
