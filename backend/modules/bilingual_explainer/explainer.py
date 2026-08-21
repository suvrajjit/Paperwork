import re
import json
import logging
from typing import Optional, Dict, Any, List
from backend.app.schemas.assistant_schemas import (
    ExplainResponse,
    AssistantMessageResponse,
)
from backend.app.services.ai.groq import groq_service, clean_llm_response
from backend.app.services.ai.gemini_service import gemini_service
from backend.app.config import settings

logger = logging.getLogger(__name__)


class BilingualExplainerService:
    """
    Stretch Module 4: Bilingual Explainer & Embedded Assistant
    Uses Groq LLM and Gemini for bilingual simplification, and Gemini TTS for spoken responses.
    """

    def explain_text(
        self,
        text: str,
        context: Optional[str] = None,
        target_language: str = "hi",
    ) -> ExplainResponse:
        """
        Produce simple-language English and Hindi explanations with takeaways using real AI models.
        """
        system_prompt = (
            "You are an empathetic, clear public-service assistant in India. "
            "Translate complex legal or bureaucratic government scheme/form language "
            "into simple 5th-grade level English and natural Hindi (Devanagari script). "
            "Do NOT give legal advice. Return ONLY a valid JSON object matching: "
            "{\"simplified_en\": \"string\", \"simplified_hi\": \"string\", "
            "\"key_takeaways_en\": [\"str1\", \"str2\"], \"key_takeaways_hi\": [\"str1\", \"str2\"], "
            "\"official_source_citation\": \"string or null\"}"
        )
        user_prompt = f"Context: {context or 'General'}\nOfficial Text to Explain:\n\"\"\"{text}\"\"\""

        # 1. Try Groq LLM
        raw_resp = groq_service.generate_chat_response(system_prompt, user_prompt, temperature=0.2)
        if not raw_resp and gemini_service.is_available():
            # 2. Try Gemini LLM fallback
            raw_resp = gemini_service.generate_chat_response(system_prompt, user_prompt, temperature=0.2)

        if raw_resp:
            try:
                cleaned = clean_llm_response(raw_resp)
                match = re.search(r"\{.*\}", cleaned, re.DOTALL)
                data = json.loads(match.group(0)) if match else json.loads(cleaned)
                return ExplainResponse(
                    original_text=text,
                    simplified_en=data.get("simplified_en", text),
                    simplified_hi=data.get("simplified_hi", text),
                    key_takeaways_en=data.get("key_takeaways_en", []),
                    key_takeaways_hi=data.get("key_takeaways_hi", []),
                    official_source_citation=data.get("official_source_citation"),
                )
            except Exception as e:
                logger.warning(f"Failed to parse AI explainer response JSON: {e}")

        # Deterministic / Rule-based plain language transformation
        return self._fallback_explain(text)

    def _fallback_explain(self, text: str) -> ExplainResponse:
        """Rule-based plain explanations for common government terminology."""
        text_lower = text.lower()
        if "pm-kisan" in text_lower or "farmer" in text_lower or "landholding" in text_lower:
            return ExplainResponse(
                original_text=text,
                simplified_en="PM-Kisan provides ₹6,000 every year directly to your bank account in 3 equal installments of ₹2,000 to help with farming costs.",
                simplified_hi="पीएम-किसान योजना के तहत खेती के खर्च के लिए हर साल ₹6,000 सीधे आपके बैंक खाते में ₹2,000 की 3 किस्तों में दिए जाते हैं।",
                key_takeaways_en=[
                    "Must own cultivable agricultural land up to 5 acres in state land records.",
                    "Bank account must be active and linked with your Aadhaar for DBT transfer.",
                    "Keep your Land Record (Khatauni) and Aadhaar Card ready."
                ],
                key_takeaways_hi=[
                    "भू-अभिलेख में 5 एकड़ तक कृषि भूमि का मालिकाना हक होना चाहिए।",
                    "डीबीटी लाभ प्राप्त करने हेतु बैंक खाता आधार से लिंक होना अनिवार्य है।",
                    "अपना आधार कार्ड और खतौनी दस्तावेज़ तैयार रखें।"
                ],
                official_source_citation="PM-Kisan Portal (https://pmkisan.gov.in/)",
            )
        elif "income" in text_lower or "revenue" in text_lower or "आय" in text_lower:
            return ExplainResponse(
                original_text=text,
                simplified_en="An Income Certificate proves your total family earnings from all sources in a year, issued by the Tehsil revenue officer.",
                simplified_hi="आय प्रमाण पत्र यह प्रमाणित करता है कि आपके पूरे परिवार की सभी स्रोतों से एक वर्ष में कुल कितनी कमाई है, जिसे तहसील राजस्व अधिकारी जारी करता है।",
                key_takeaways_en=[
                    "Required for scholarship, housing, and pension welfare schemes.",
                    "Must declare earnings from agriculture, daily labor, or business accurately.",
                    "Attach identity and residence proof."
                ],
                key_takeaways_hi=[
                    "छात्रवृत्ति, आवास और पेंशन योजनाओं के लिए आवश्यक प्रमाण पत्र।",
                    "कृषि, मजदूरी या व्यवसाय से होने वाली वार्षिक आय का सही विवरण दें।",
                    "पहचान और निवास प्रमाण पत्र संलग्न करें।"
                ],
                official_source_citation="Revenue Administration Department",
            )

        return ExplainResponse(
            original_text=text,
            simplified_en=f"Guidance summary: {text[:200]}...",
            simplified_hi=f"मार्गदर्शन सारांश: यह सरकारी प्रपत्र आपके आवेदन के लिए आवश्यक जानकारी मांगता है।",
            key_takeaways_en=["Carefully review all field values before final submission."],
            key_takeaways_hi=["अंतिम रूप से जमा करने से पहले सभी प्रविष्टियों की पुनः जांच करें।"],
        )

    def answer_contextual_query(
        self,
        user_message: str,
        language: str = "en",
        current_context: Optional[str] = None,
        active_field_id: Optional[str] = None,
        form_id: Optional[str] = None,
        scheme_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None,
        generate_audio: bool = False,
    ) -> AssistantMessageResponse:
        """
        Context-aware assistant grounded beside the active form/field/scheme using real AI + Gemini TTS.
        """
        system_prompt = (
            "You are 'Paperwork & Access Assistant', a helpful, concise assistant embedded directly "
            "beside a citizen's active form or scheme application.\n"
            "Constraints:\n"
            "1. Answer ONLY questions related to the active form, field, or eligibility criteria in context.\n"
            "2. Provide plainspoken, encouraging, concise answers (2-3 sentences max).\n"
            "3. Never claim official approval, government affiliation, or guarantee eligibility.\n"
            "4. Return valid JSON only: {\"response_text_en\": \"...\", \"response_text_hi\": \"...\", \"suggested_action\": \"...\"}"
        )
        context_summary = f"Context: {current_context}, Form: {form_id}, Scheme: {scheme_id}, Active Field: {active_field_id}, Data: {json.dumps(context_data or {})}"
        user_prompt = f"{context_summary}\nUser Question: {user_message}"

        raw_resp = groq_service.generate_chat_response(system_prompt, user_prompt, temperature=0.3)
        if not raw_resp and gemini_service.is_available():
            raw_resp = gemini_service.generate_chat_response(system_prompt, user_prompt, temperature=0.3)

        response_en = ""
        response_hi = ""
        suggested_action = None

        if raw_resp:
            try:
                cleaned = clean_llm_response(raw_resp)
                match = re.search(r"\{.*\}", cleaned, re.DOTALL)
                data = json.loads(match.group(0)) if match else json.loads(cleaned)
                response_en = data.get("response_text_en", "")
                response_hi = data.get("response_text_hi", "")
                suggested_action = data.get("suggested_action")
            except Exception as e:
                logger.warning(f"Error parsing AI assistant response: {e}")

        # Deterministic Contextual Assistant Fallback if LLM empty
        if not response_en:
            msg_lower = user_message.lower()
            if "aadhaar" in msg_lower or "mask" in msg_lower or "privacy" in msg_lower:
                response_en = "Your Aadhaar number is masked as XXXX-XXXX-1234 on screen for privacy protection. Only the confirmed last digits are shown in previews."
                response_hi = "आपकी गोपनीयता की सुरक्षा के लिए आपका आधार नंबर स्क्रीन पर XXXX-XXXX-1234 के रूप में छुपाया गया है।"
                suggested_action = "Review and confirm your Aadhaar details."
            elif "khatauni" in msg_lower or "land" in msg_lower or "acres" in msg_lower:
                response_en = "Enter your cultivable land area in acres exactly as listed in your Land Record (Khatauni / RoR) document."
                response_hi = "अपनी कृषि भूमि का क्षेत्रफल ठीक वैसा ही एकड़ में लिखें जैसा आपकी खतौनी / भू-अभिलेख में दर्ज है।"
                suggested_action = "Check the landholding acres box in the form."
            elif "bank" in msg_lower or "ifsc" in msg_lower or "dbt" in msg_lower:
                response_en = "Make sure to provide your Aadhaar-linked bank account number and 11-digit IFSC code from your passbook to receive direct benefit transfers."
                response_hi = "डीबीटी किस्त प्राप्त करने के लिए अपनी बैंक पासबुक से आधार-लिंक बैंक खाता संख्या और 11 अंकों का आईएफएससी कोड दर्ज करें।"
                suggested_action = "Verify your bank account number and IFSC code."
            elif "draft" in msg_lower or "download" in msg_lower or "pdf" in msg_lower:
                response_en = "You can download a generated readiness draft PDF anytime. It will clearly display a 'Draft — Review Before Use' banner."
                response_hi = "आप कभी भी तैयार मसौदा पीडीएफ डाउनलोड कर सकते हैं। इस पर स्पष्ट रूप से 'मसौदा - उपयोग से पहले समीक्षा करें' अंकित रहेगा।"
                suggested_action = "Click 'Download Draft PDF' on the Form Readiness tab."
            else:
                response_en = f"For {active_field_id or 'this section'}, ensure your details match your official supporting document. Let me know if you need help with any specific field!"
                response_hi = f"{active_field_id or 'इस अनुभाग'} के लिए, सुनिश्चित करें कि आपका विवरण आपके आधिकारिक दस्तावेज़ से मेल खाता है।"
                suggested_action = "Continue to the next field in the checklist."

        # Real Gemini TTS synthesis if requested or available
        audio_b64 = None
        if generate_audio and gemini_service.is_available():
            text_to_speak = response_hi if language == "hi" else response_en
            audio_b64 = gemini_service.synthesize_speech(text_to_speak)

        return AssistantMessageResponse(
            response_text_en=response_en,
            response_text_hi=response_hi,
            suggested_action=suggested_action,
            audio_base64=audio_b64,
            audio_format="pcm",
        )


bilingual_explainer_service = BilingualExplainerService()
