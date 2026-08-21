import os
import re
import json
import logging
from typing import Any, Optional
from groq import Groq
from backend.app.config import settings

logger = logging.getLogger(__name__)


def clean_llm_response(text: str) -> str:
    """Strip reasoning <think>...</think> tags and markdown code blocks."""
    if not text:
        return ""
    # Remove <think> ... </think> tags
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    # Remove markdown ```json or ``` code fences
    cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()
    return cleaned


class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.llm_model = settings.GROQ_LLM_MODEL
        self.stt_model = settings.GROQ_STT_MODEL
        self._client: Optional[Groq] = None

    @property
    def client(self) -> Optional[Groq]:
        if self._client is None and self.api_key:
            try:
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")
                self._client = None
        return self._client

    def is_available(self) -> bool:
        return bool(self.api_key and self.client)

    def extract_document_fields(
        self, raw_ocr_text: str, document_type_hint: Optional[str] = None
    ) -> Optional[dict[str, Any]]:
        """
        Use Groq LLM to convert OCR text into structured schema fields with exact source grounding.
        """
        if not self.is_available():
            logger.info("Groq API key not configured, using deterministic fallback.")
            return None

        prompt = f"""You are an accurate, strict document parsing assistant.
Given the following raw OCR text from an uploaded document, extract structured identity, address, and eligibility-related fields.

Rules:
1. Every extracted field MUST be grounded strictly in the OCR text. Do NOT guess or hallucinate any values.
2. Provide the exact snippet of source text from the OCR where you found the value.
3. If document type is not provided, detect whether it is an identity_card (Aadhaar/Voter/PAN), income_certificate, land_record, caste_certificate, or general_document.
4. Return ONLY a valid JSON object matching this schema:
{{
  "detected_document_type": "string",
  "fields": [
    {{
      "field_key": "standard_snake_case_key (e.g. full_name, date_of_birth, annual_income, aadhaar_number, etc.)",
      "label_en": "Human-readable English label",
      "label_hi": "Human-readable Hindi label (in Devanagari script)",
      "value": "extracted string or number",
      "source_text": "Exact text snippet from the raw OCR",
      "confidence": 0.95,
      "category": "identity | address | income | general",
      "is_sensitive": true or false
    }}
  ]
}}

Document Type Hint: {document_type_hint or "None"}

Raw OCR Text:
\"\"\"
{raw_ocr_text}
\"\"\"
"""
        try:
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise data extractor that returns only valid JSON without markdown fences or reasoning tags.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
            )
            raw_content = response.choices[0].message.content or ""
            cleaned = clean_llm_response(raw_content)
            # Find the outermost JSON object
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Groq document extraction failed: {e}")
            return None

    def generate_chat_response(
        self, system_prompt: str, user_prompt: str, temperature: float = 0.3
    ) -> Optional[str]:
        """Generate a chat response using Groq."""
        if not self.is_available():
            return None

        try:
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
            )
            raw_content = response.choices[0].message.content or ""
            return clean_llm_response(raw_content)
        except Exception as e:
            logger.error(f"Groq chat generation failed: {e}")
            return None

    def transcribe_audio(self, audio_file_path_or_bytes: Any) -> Optional[str]:
        """Transcribe English/Hindi audio using Groq Whisper."""
        if not self.is_available():
            return None

        try:
            transcription = self.client.audio.transcriptions.create(
                file=audio_file_path_or_bytes,
                model=self.stt_model,
                temperature=0.0,
            )
            return transcription.text
        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {e}")
            return None


groq_service = GroqService()
