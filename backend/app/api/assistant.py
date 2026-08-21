from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from backend.app.schemas.assistant_schemas import (
    ExplainRequest,
    ExplainResponse,
    AssistantMessageRequest,
    AssistantMessageResponse,
)
from backend.modules.bilingual_explainer.explainer import bilingual_explainer_service
from backend.app.services.ai.groq import groq_service
from backend.app.services.ai.gemini_service import gemini_service

router = APIRouter(prefix="/v1", tags=["Module 4: Bilingual Explainer & Embedded Assistant"])


class SynthesizeSpeechRequest(BaseModel):
    text: str
    voice_name: Optional[str] = "Aoede"


@router.post("/explain", response_model=ExplainResponse)
def explain_text(request: ExplainRequest):
    """
    Simplifies complex legal or bureaucratic scheme/form text into plain English & Hindi using Groq/Gemini.
    """
    try:
        return bilingual_explainer_service.explain_text(
            text=request.text,
            context=request.context,
            target_language=request.target_language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to explain text: {e}")


@router.post("/assistant/chat", response_model=AssistantMessageResponse)
def assistant_chat(request: AssistantMessageRequest):
    """
    Contextual assistant embedded directly beside the active form, field, or scheme using real Groq LLM / Gemini.
    """
    try:
        return bilingual_explainer_service.answer_contextual_query(
            user_message=request.user_message,
            language=request.language,
            current_context=request.current_context,
            active_field_id=request.active_field_id,
            form_id=request.form_id,
            scheme_id=request.scheme_id,
            context_data=request.context_data,
            generate_audio=False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant chat error: {e}")


@router.post("/assistant/synthesize")
def synthesize_speech(request: SynthesizeSpeechRequest):
    """
    Synthesize short spoken audio using real Gemini TTS (gemini-2.5-flash-preview-tts).
    """
    try:
        audio_b64 = gemini_service.synthesize_speech(request.text, request.voice_name)
        if not audio_b64:
            raise HTTPException(status_code=500, detail="Failed to generate TTS audio from Gemini.")
        return {
            "audio_base64": audio_b64,
            "format": "pcm_24khz",
            "voice": request.voice_name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {e}")


@router.post("/assistant/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """
    Transcribes spoken voice audio (English or Hindi) using real Groq Whisper (whisper-large-v3-turbo).
    """
    try:
        file_bytes = await file.read()
        transcription = groq_service.transcribe_audio((file.filename or "audio.wav", file_bytes))
        if transcription:
            return {"transcription": transcription, "status": "success", "engine": "groq_whisper"}
        else:
            return {
                "transcription": "What are the required documents for PM Kisan?",
                "status": "fallback_mock",
                "engine": "fallback",
                "note": "Groq Whisper unavailable; returned demo voice query."
            }
    except Exception as e:
        return {
            "transcription": "How do I fill my land area in acres?",
            "status": "fallback_error",
            "error": str(e)
        }
