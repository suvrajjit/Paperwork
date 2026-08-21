import base64
import json
import logging
from typing import Optional, Any
from google import genai
from google.genai import types
from backend.app.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.llm_model = settings.GEMINI_LLM_MODEL
        self.tts_model = settings.GEMINI_TTS_MODEL
        self.voice_name = settings.GEMINI_VOICE_NAME
        self._client: Optional[genai.Client] = None

    @property
    def client(self) -> Optional[genai.Client]:
        if self._client is None and self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}")
                self._client = None
        return self._client

    def is_available(self) -> bool:
        return bool(self.api_key and self.client)

    def generate_chat_response(
        self, system_prompt: str, user_prompt: str, temperature: float = 0.2
    ) -> Optional[str]:
        """Generate structured text response using Gemini."""
        if not self.is_available():
            return None

        try:
            full_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
            response = self.client.models.generate_content(
                model=self.llm_model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return None

    def synthesize_speech(self, text: str, voice_name: Optional[str] = None) -> Optional[str]:
        """
        Generate short spoken audio bytes in base64 using Gemini TTS.
        """
        if not self.is_available():
            return None

        try:
            selected_voice = voice_name or self.voice_name
            response = self.client.models.generate_content(
                model=self.tts_model,
                contents=text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=selected_voice
                            )
                        )
                    ),
                ),
            )
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.data:
                        # Return base64 audio string
                        return base64.b64encode(part.inline_data.data).decode("utf-8")
            return None
        except Exception as e:
            logger.error(f"Gemini TTS generation failed: {e}")
            return None


gemini_service = GeminiService()
