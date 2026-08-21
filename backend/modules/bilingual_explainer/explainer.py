import re
import json
import logging
from typing import Optional, Dict, Any, List
from backend.app.schemas.assistant_schemas import (
    ExplainResponse,
    AssistantMessageResponse,
    VoiceGuideResponse,
)
from backend.app.services.ai.groq import groq_service, clean_llm_response, parse_llm_json
from backend.app.services.ai.gemini_service import gemini_service
from backend.app.config import settings

logger = logging.getLogger(__name__)


class BilingualExplainerService:
    """
    Stretch Module 4: Bilingual Explainer, Conversational Voice Agent & Guide.
    Uses Groq LLM and Gemini for bilingual simplification, intent detection,
    and Gemini TTS for natural spoken audio output in Hindi and English.
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
                data = parse_llm_json(raw_resp)
                if data:
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
            simplified_hi=f"मार्गदर्शन सारांश: यह प्रपत्र आपके आवेदन के लिए आवश्यक जानकारी मांगता है।",
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
            "You are 'EasyPaper Assistant', a helpful, concise assistant embedded directly "
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
                data = parse_llm_json(raw_resp)
                if data:
                    response_en = data.get("response_text_en", "")
                    response_hi = data.get("response_text_hi", "")
                    suggested_action = data.get("suggested_action")
            except Exception as e:
                logger.warning(f"Error parsing AI assistant response: {e}")

        # Deterministic Contextual Assistant Fallback if LLM empty
        if not response_en:
            msg_lower = user_message.lower()
            if "aadhaar" in msg_lower or "mask" in msg_lower or "privacy" in msg_lower:
                response_en = "Your Aadhaar number is masked as XXXX-XXXX-1234 on screen for privacy protection. Only confirmed last digits are displayed."
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

        # Real Gemini TTS synthesis if requested
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

    def voice_guide_turn(
        self,
        user_message: str,
        language: str = "hi",
        current_screen: str = "welcome",
        agent_stage: Optional[str] = "GREETING",
        active_form_id: Optional[str] = None,
        active_field_id: Optional[str] = None,
        profile_data: Optional[Dict[str, Any]] = None,
        form_fields: Optional[List[Dict[str, Any]]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        synthesize_audio: bool = True,
    ) -> VoiceGuideResponse:
        """
        Step-by-step proactive voice agent with conversational memory and stage awareness.
        Tracks form selection, proactively detects missing fields, extracts spoken field values,
        and guides citizens sequentially through completion.
        """
        profile = profile_data or {}
        history = (conversation_history or [])[-6:]

        # Compute missing fields for the active form if fields are known
        missing_fields = []
        if form_fields:
            for f in form_fields:
                key = f.get("profile_mapping") or f.get("field_id")
                val_obj = profile.get(key)
                has_val = False
                if isinstance(val_obj, dict):
                    has_val = bool(val_obj.get("value"))
                elif val_obj is not None:
                    has_val = bool(str(val_obj).strip())
                if not has_val:
                    missing_fields.append({
                        "field_id": f.get("field_id"),
                        "key": key,
                        "label_en": f.get("label_en", key),
                        "label_hi": f.get("label_hi", key),
                    })

        system_prompt = f"""You are EasyPaper's friendly, proactive Conversational Voice Guide.
You are helping a citizen with limited tech or English literacy complete paperwork step-by-step.
Always speak simply, warmly, in 1-2 natural spoken sentences.

Current Conversational State:
- Current Screen: {current_screen}
- Active Form: {active_form_id or "None selected yet"}
- Active Stage: {agent_stage or "GREETING"}
- Missing Unfilled Fields in Active Form: {[m['label_en'] for m in missing_fields]}

Dialogue Flow Rules:
1. If the citizen wants to fill/understand a form but has NOT specified which one:
   - Ask them which form they would like to work on (PM-Kisan, Income Certificate, Gold Loan Agreement, or upload their own form).
   - action_type: "SELECT_FORM", agent_stage: "AWAITING_FORM_CHOICE"

2. If a form is selected or citizen names a form (e.g. "PM Kisan", "Income Certificate", "Gold Loan"):
   - If there are missing fields:
     - Focus on the first missing field (e.g. {missing_fields[0]['label_en'] if missing_fields else 'next field'}).
     - Ask the citizen for that specific information in plain language.
     - action_type: "NAVIGATE", target_screen: "form_workspace", target_form_id: active_form_id or selected, target_field_id: "{missing_fields[0]['field_id'] if missing_fields else ''}", agent_stage: "COLLECTING_MISSING_DATA"
   - If NO missing fields remain:
     - Celebrate that all fields are ready and invite them to see their Form Readiness Plan and Draft PDF.
     - action_type: "NAVIGATE", target_screen: "form_readiness", agent_stage: "READY_FOR_DRAFT"

3. If the citizen provides data (e.g. "My land is 2.5 acres", "50000 income", "My name is Ramesh"):
   - Extract the field key and value.
   - Confirm the captured value and ask for the next missing field.
   - action_type: "UPDATE_FIELD", extracted_field_update: {{"field_key": "...", "value": ...}}, agent_stage: "COLLECTING_MISSING_DATA"

4. If citizen wants to upload/scan a document or check eligibility:
   - Route to "document_review" or "eligibility".

Return strictly valid JSON matching:
{{
  "spoken_text_en": "Short conversational English response (1-2 sentences)",
  "spoken_text_hi": "स्वाभाविक और सरल हिंदी उत्तर (1-2 वाक्य)",
  "action_type": "NAVIGATE | SELECT_FORM | SELECT_FIELD | UPDATE_FIELD | SPEAK",
  "agent_stage": "GREETING | AWAITING_FORM_CHOICE | FORM_IN_PROGRESS | COLLECTING_MISSING_DATA | READY_FOR_DRAFT",
  "target_screen": "dashboard | form_workspace | eligibility | document_review | form_readiness | vault | null",
  "target_form_id": "form_pm_kisan_app | form_income_cert | form_gold_loan_app | null",
  "target_field_id": "field_id or null",
  "extracted_field_update": {{"field_key": "...", "value": ...}} or null,
  "missing_fields_remaining": ["field1", "field2"],
  "suggested_quick_replies_en": ["Option 1", "Option 2"],
  "suggested_quick_replies_hi": ["विकल्प १", "विकल्प २"]
}}
"""
        context_payload = {
            "current_screen": current_screen,
            "agent_stage": agent_stage,
            "active_form_id": active_form_id,
            "active_field_id": active_field_id,
            "missing_fields": missing_fields,
            "profile_summary": {k: (v.get("value") if isinstance(v, dict) else v) for k, v in profile.items() if v},
            "recent_conversation_turns": history,
            "user_speech": user_message,
        }

        user_prompt = f"Citizen Spoken Input:\n\"\"\"{user_message}\"\"\"\n\nState Context:\n{json.dumps(context_payload, ensure_ascii=False)}"

        raw_resp = groq_service.generate_chat_response(system_prompt, user_prompt, temperature=0.3)
        if not raw_resp and gemini_service.is_available():
            raw_resp = gemini_service.generate_chat_response(system_prompt, user_prompt, temperature=0.3)

        spoken_en = ""
        spoken_hi = ""
        action_type = "SPEAK"
        next_stage = agent_stage or "GREETING"
        target_screen = None
        target_form_id = None
        target_field_id = None
        extracted_field_update = None
        remaining_missing = [m["label_en"] for m in missing_fields]
        replies_en = ["PM-Kisan Form", "Check Eligibility", "Upload Document"]
        replies_hi = ["पीएम-किसान फॉर्म", "पात्रता जांचें", "दस्तावेज़ जोड़ें"]

        if raw_resp:
            try:
                data = parse_llm_json(raw_resp)
                if data:
                    spoken_en = data.get("spoken_text_en", "")
                    spoken_hi = data.get("spoken_text_hi", "")
                    action_type = data.get("action_type", "SPEAK")
                    next_stage = data.get("agent_stage", agent_stage)
                    target_screen = data.get("target_screen")
                    target_form_id = data.get("target_form_id")
                    target_field_id = data.get("target_field_id")
                    extracted_field_update = data.get("extracted_field_update")
                    if data.get("suggested_quick_replies_en"):
                        replies_en = data.get("suggested_quick_replies_en")
                    if data.get("suggested_quick_replies_hi"):
                        replies_hi = data.get("suggested_quick_replies_hi")
            except Exception as e:
                logger.warning(f"Failed to parse voice guide LLM response: {e}")

        # Deterministic State Machine Fallback if LLM empty
        if not spoken_en or not spoken_hi:
            msg_lower = user_message.lower()
            
            # 1. User says "I want to fill up a form" without naming one
            if any(w in msg_lower for w in ["fill a form", "fill form", "form bharna", "फॉर्म भरना", "फॉर्म भरें", "फॉर्म चाहिए"]) and not any(w in msg_lower for w in ["kisan", "income", "gold", "किसान", "आय", "गोल्ड"]):
                spoken_en = "Which form would you like to work on? You can choose PM-Kisan, Income Certificate, Gold Loan, or upload your own form."
                spoken_hi = "आप कौन सा फॉर्म भरना चाहते हैं? आप पीएम-किसान, आय प्रमाण पत्र, गोल्ड लोन चुन सकते हैं या अपना फॉर्म अपलोड कर सकते हैं।"
                action_type = "SELECT_FORM"
                next_stage = "AWAITING_FORM_CHOICE"
                target_screen = "form_workspace"
                replies_en = ["PM-Kisan Form", "Income Certificate", "Gold Loan Agreement", "Upload Form"]
                replies_hi = ["पीएम-किसान फॉर्म", "आय प्रमाण पत्र", "गोल्ड लोन अनुबंध", "फॉर्म अपलोड करें"]

            # 2. PM-Kisan form requested
            elif any(w in msg_lower for w in ["kisan", "pm-kisan", "farmer", "किसान", "खेती"]):
                target_screen = "form_workspace"
                target_form_id = "form_pm_kisan_app"
                if missing_fields:
                    first_miss = missing_fields[0]
                    spoken_en = f"I have opened the PM-Kisan form. We have your basic details, but what is your {first_miss['label_en']}?"
                    spoken_hi = f"मैंने पीएम-किसान फॉर्म खोल दिया है। आपके पास कितना {first_miss['label_hi']} है?"
                    action_type = "NAVIGATE"
                    next_stage = "COLLECTING_MISSING_DATA"
                    target_field_id = first_miss["field_id"]
                    replies_en = ["2.4 Acres", "Verify Aadhaar", "Check Eligibility"]
                    replies_hi = ["२.४ एकड़", "आधार सत्यापित करें", "पात्रता जांचें"]
                else:
                    spoken_en = "Opening the PM-Kisan form. All your details look ready! Let's review the final plan."
                    spoken_hi = "पीएम-किसान फॉर्म खुल गया है। आपके सभी विवरण तैयार हैं! आइए अंतिम योजना देखें।"
                    action_type = "NAVIGATE"
                    next_stage = "READY_FOR_DRAFT"
                    replies_en = ["Prepare Draft PDF", "Check Eligibility"]
                    replies_hi = ["ड्राफ्ट पीडीएफ बनाएं", "पात्रता जांचें"]

            # 3. Gold Loan form requested
            elif any(w in msg_lower for w in ["gold", "loan", "स्वर्ण", "गोल्ड", "ऋण", "लोन"]):
                spoken_en = "Opening the Gold Loan Application Form-cum-Agreement. Let's start with your branch and loan amount."
                spoken_hi = "गोल्ड लोन आवेदन पत्र एवं अनुबंध खुल गया है। आइए आपकी शाखा और ऋण राशि से शुरुआत करें।"
                action_type = "NAVIGATE"
                target_screen = "form_workspace"
                target_form_id = "form_gold_loan_app"
                next_stage = "FORM_IN_PROGRESS"
                replies_en = ["Loan Amount ₹1,00,000", "PAN Card", "What is next?"]
                replies_hi = ["ऋण राशि ₹१,००,०००", "पैन कार्ड", "आगे क्या करें?"]

            # 4. Data entry answers (e.g. land / income)
            elif any(c.isdigit() for c in user_message) and ("acre" in msg_lower or "एकड़" in msg_lower or "हेक्टेयर" in msg_lower):
                val = float(re.findall(r"[-+]?\d*\.\d+|\d+", user_message)[0])
                extracted_field_update = {"field_key": "landholding_acres", "value": val}
                spoken_en = f"I've saved {val} acres to your profile! Next, do you have your bank passbook ready for direct transfer?"
                spoken_hi = f"मैंने आपकी प्रोफ़ाइल में {val} एकड़ सहेज लिया है! आगे, क्या आपके पास डीबीटी के लिए बैंक पासबुक तैयार है?"
                action_type = "UPDATE_FIELD"
                next_stage = "COLLECTING_MISSING_DATA"
                replies_en = ["Bank Account Ready", "Check Eligibility", "Prepare Plan"]
                replies_hi = ["बैंक खाता तैयार है", "पात्रता जांचें", "योजना तैयार करें"]

            # 5. Check Eligibility
            elif any(w in msg_lower for w in ["eligible", "eligibility", "qualify", "पात्रता", "योग्य"]):
                spoken_en = "Let's check if you qualify for government assistance. I will show you the exact transparent rules."
                spoken_hi = "आइए देखते हैं कि क्या आप योजना के पात्र हैं। मैं आपको इसके पारदर्शी नियम दिखाता हूँ।"
                action_type = "NAVIGATE"
                target_screen = "eligibility"
                replies_en = ["PM Kisan Scheme", "Income Certificate", "Back to Form"]
                replies_hi = ["पीएम किसान योजना", "आय प्रमाण पत्र", "फॉर्म पर वापस"]

            # 6. Upload Documents
            elif any(w in msg_lower for w in ["document", "aadhaar", "khatauni", "upload", "दस्तावेज़", "आधार", "अपलोड"]):
                spoken_en = "Opening document review. You can upload or verify your Aadhaar card and land records."
                spoken_hi = "दस्तावेज़ समीक्षा खुल गई है। आप अपना आधार कार्ड और खतौनी दस्तावेज़ सत्यापित कर सकते हैं।"
                action_type = "NAVIGATE"
                target_screen = "document_review"
                replies_en = ["Verify Aadhaar", "Scan Khatauni", "Save to Vault"]
                replies_hi = ["आधार सत्यापित करें", "खतौनी स्कैन करें", "तिजोरी में सहेजें"]

            else:
                spoken_en = "Hello! Tell me what you'd like to do, such as filling a form, checking eligibility, or uploading documents."
                spoken_hi = "नमस्ते! मुझे बताएं कि आप क्या करना चाहते हैं, जैसे फॉर्म भरना, पात्रता जांचना, या दस्तावेज़ जोड़ना।"
                action_type = "SPEAK"
                next_stage = "GREETING"
                replies_en = ["I need to fill a form", "Check Eligibility", "Upload Document"]
                replies_hi = ["मुझे फॉर्म भरना है", "पात्रता जांचें", "दस्तावेज़ जोड़ें"]

        # Synthesize Spoken Audio (Gemini TTS with automatic gTTS fallback)
        audio_b64 = None
        audio_fmt = "mp3"
        if synthesize_audio:
            text_to_synthesize = spoken_hi if language == "hi" else spoken_en
            res = gemini_service.synthesize_speech(text_to_synthesize, lang=language)
            if res:
                audio_b64, audio_fmt = res

        return VoiceGuideResponse(
            spoken_text_en=spoken_en,
            spoken_text_hi=spoken_hi,
            action_type=action_type,
            agent_stage=next_stage,
            target_screen=target_screen,
            target_form_id=target_form_id,
            target_field_id=target_field_id,
            extracted_field_update=extracted_field_update,
            missing_fields_remaining=remaining_missing,
            suggested_quick_replies_en=replies_en,
            suggested_quick_replies_hi=replies_hi,
            audio_base64=audio_b64,
            audio_format=audio_fmt,
        )


bilingual_explainer_service = BilingualExplainerService()
