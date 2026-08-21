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
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    cleaned = re.sub(r"```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"```", "", cleaned).strip()
    return cleaned


def parse_llm_json(raw_content: str) -> Optional[dict[str, Any]]:
    """Robustly extract and parse JSON object from LLM response."""
    if not raw_content:
        return None
    cleaned = clean_llm_response(raw_content)
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_slice = cleaned[start_idx : end_idx + 1]
        try:
            parsed = json.loads(json_slice)
            # Filter out any placeholder echoes
            if isinstance(parsed, dict) and "fields" in parsed:
                parsed["fields"] = [
                    f for f in parsed["fields"]
                    if f.get("field_key") not in ("standard_snake_case_key", "string", "example_field_key")
                    and f.get("label_en") not in ("Human-readable English label", "string")
                ]
            return parsed
        except Exception:
            pass
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and "fields" in parsed:
            parsed["fields"] = [
                f for f in parsed["fields"]
                if f.get("field_key") not in ("standard_snake_case_key", "string", "example_field_key")
                and f.get("label_en") not in ("Human-readable English label", "string")
            ]
        return parsed
    except Exception as e:
        logger.warning(f"Failed to parse JSON from LLM: {e}")
        return None


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

        # Truncate to safe window to stay within token limits
        safe_text = raw_ocr_text[:5000]

        prompt = f"""Extract all identity, address, and application fields from the document text below.
Instructions:
1. Detect document type (e.g. loan_application_form, identity_card, income_certificate, land_record, bank_form).
2. If it is a blank application form, extract the major required fields (e.g. Applicant Full Name, Date of Birth, Gender, Father/Spouse Name, Communication Address, State, Pincode, Mobile No, Email, Occupation, Branch, Loan Scheme). Set value to "[Blank Form Field - Required]".
3. If it has filled user data, extract the exact values with their source text snippet.
4. Output valid JSON only:
{{
  "detected_document_type": "{document_type_hint or 'general_document'}",
  "fields": [
    {{
      "field_key": "applicant_full_name",
      "label_en": "Applicant Full Name",
      "label_hi": "आवेदक का पूरा नाम",
      "value": "Extracted value or [Blank Form Field - Required]",
      "source_text": "Name",
      "confidence": 0.95,
      "category": "identity",
      "is_sensitive": false
    }}
  ]
}}

Document OCR Text:
\"\"\"
{safe_text}
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
            return parse_llm_json(raw_content)
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
