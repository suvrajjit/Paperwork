import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { audioPlayer } from '../../services/audioPlayer';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  RefreshCw,
} from 'lucide-react';
import { VoiceGuideResponse } from '../../types';

interface MessageLog {
  id: string;
  sender: 'user' | 'agent';
  text_en: string;
  text_hi: string;
  action_summary?: string;
  timestamp: string;
}

export const VoiceAgentOrb: React.FC = () => {
  const {
    language,
    activeTab,
    setActiveTab,
    selectedFormId,
    setSelectedFormId,
    activeFieldId,
    setActiveFieldId,
    profile,
    updateProfileField,
  } = useApp();

  const [agentStage, setAgentStage] = useState<string>('GREETING');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [typedInput, setTypedInput] = useState<string>('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [messages, setMessages] = useState<MessageLog[]>([]);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleUserUtterance(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  // Scroll message container to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, isSpeaking]);

  // Initial welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      triggerWelcomeGreeting();
    }
  }, [isOpen]);

  const triggerWelcomeGreeting = async () => {
    const initialTextEn =
      "Hello! I am your EasyPaper Voice Guide. Tell me what you'd like to do, such as filling a form or checking eligibility.";
    const initialTextHi =
      'नमस्ते! मैं आपका ईज़ी-पेपर वॉयस गाइड हूँ। मुझे बताएं कि आप क्या करना चाहते हैं, जैसे फॉर्म समझना या पात्रता जांचना।';

    const welcomeMsg: MessageLog = {
      id: 'msg_welcome',
      sender: 'agent',
      text_en: initialTextEn,
      text_hi: initialTextHi,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([welcomeMsg]);
    setQuickReplies(
      language === 'hi'
        ? ['पीएम किसान फॉर्म भरें', 'मेरी पात्रता जांचें', 'दस्तावेज़ जोड़ें']
        : ['PM-Kisan Form', 'Check Eligibility', 'Upload Document']
    );

    if (!isMuted) {
      speakResponse(language === 'hi' ? initialTextHi : initialTextEn, null);
    }
  };

  const speakResponse = async (text: string, base64Audio?: string | null) => {
    setIsSpeaking(true);
    try {
      if (base64Audio) {
        await audioPlayer.playBase64Audio(base64Audio);
      } else {
        await audioPlayer.speakText(text, language);
      }
    } catch (e) {
      // Fallback to browser SpeechSynthesis
      try {
        await audioPlayer.speakText(text, language);
      } catch (err) {
        console.warn('Speech synthesis failed:', err);
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleUserUtterance = async (utterance: string) => {
    if (!utterance.trim()) return;

    // Add user message to log
    const userMsg: MessageLog = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text_en: utterance,
      text_hi: utterance,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTypedInput('');
    setIsThinking(true);

    try {
      // Build conversation history payload
      const convHistory = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: language === 'hi' ? m.text_hi : m.text_en,
      }));

      const guideResp: VoiceGuideResponse = await api.guideVoiceAgent({
        user_message: utterance,
        language: language,
        current_screen: activeTab,
        agent_stage: agentStage,
        active_form_id: selectedFormId,
        active_field_id: activeFieldId,
        profile_data: profile as any,
        conversation_history: convHistory,
        synthesize_audio: !isMuted,
      });

      setIsThinking(false);
      if (guideResp.agent_stage) {
        setAgentStage(guideResp.agent_stage);
      }

      let actionDesc = '';

      // Execute Action if decided by Agent
      if (guideResp.target_screen && guideResp.target_screen !== activeTab) {
        setActiveTab(guideResp.target_screen);
        actionDesc = `Navigated to ${guideResp.target_screen.replace('_', ' ')}`;
      }

      if (guideResp.target_form_id && guideResp.target_form_id !== selectedFormId) {
        setSelectedFormId(guideResp.target_form_id);
      }

      if (guideResp.target_field_id) {
        setActiveFieldId(guideResp.target_field_id);
      }

      if (guideResp.extracted_field_update) {
        const { field_key, value } = guideResp.extracted_field_update;
        updateProfileField(field_key, value, 'voice_agent_input', 0.95);
        actionDesc = `Updated ${field_key} to "${value}"`;
      }

      // Add Agent Message to log
      const agentMsg: MessageLog = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text_en: guideResp.spoken_text_en,
        text_hi: guideResp.spoken_text_hi,
        action_summary: actionDesc,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setQuickReplies(
        language === 'hi'
          ? guideResp.suggested_quick_replies_hi
          : guideResp.suggested_quick_replies_en
      );

      // Play audio response
      if (!isMuted) {
        const spokenText = language === 'hi' ? guideResp.spoken_text_hi : guideResp.spoken_text_en;
        speakResponse(spokenText, guideResp.audio_base64);
      }
    } catch (e) {
      console.error('Voice guide error:', e);
      setIsThinking(false);

      const errorTextEn = 'I heard your question. You can review the details on screen or ask again!';
      const errorTextHi = 'मैंने आपका प्रश्न सुना। आप स्क्रीन पर विवरण देख सकते हैं या पुनः पूछ सकते हैं!';

      const agentMsg: MessageLog = {
        id: `agent_err_${Date.now()}`,
        sender: 'agent',
        text_en: errorTextEn,
        text_hi: errorTextHi,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      if (!isMuted) {
        speakResponse(language === 'hi' ? errorTextHi : errorTextEn, null);
      }
    }
  };

  const startListening = () => {
    audioPlayer.stop();
    setIsSpeaking(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
        return;
      } catch (e) {
        console.warn('Recognition start failed, fallback to mic recording:', e);
      }
    }

    // MediaRecorder fallback to Groq Whisper
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            stream.getTracks().forEach((track) => track.stop());
            setIsListening(false);
            setIsThinking(true);
            try {
              const res = await api.transcribeVoice(audioBlob);
              if (res.transcription) {
                handleUserUtterance(res.transcription);
              }
            } catch (err) {
              setIsThinking(false);
            }
          };

          mediaRecorder.start();
          setIsListening(true);
        })
        .catch((err) => {
          console.error('Microphone access denied:', err);
          setIsListening(false);
        });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <>
      {/* Floating Orb Button in Bottom-Right Corner */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Floating Voice Label Bubble when closed */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper-surface border border-guidance text-guidance text-xs font-semibold shadow-md hover:shadow-lg transition-all animate-bounce"
          >
            <Sparkles className="w-3.5 h-3.5 text-guidance" />
            <span>{language === 'hi' ? 'बोलकर सहायता लें' : 'Voice Assistant'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (isSpeaking) audioPlayer.stop();
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
            isOpen
              ? 'bg-ink text-white'
              : isSpeaking
              ? 'bg-guidance text-white ring-4 ring-guidance-light animate-pulse'
              : 'bg-guidance text-white hover:bg-guidance-hover ring-2 ring-white'
          }`}
          title={language === 'hi' ? 'ईज़ी-पेपर वॉयस गाइड' : 'EasyPaper Voice Guide'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Mic className="w-6 h-6" />
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-review-amber"></span>
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Expandable Voice Guide Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] max-h-[580px] bg-paper-surface border border-paper-sand rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-guidance text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">EasyPaper Voice Guide</h3>
                <div className="text-[11px] text-white/80 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isListening
                        ? 'bg-error-brick animate-ping'
                        : isSpeaking
                        ? 'bg-review-amber animate-pulse'
                        : 'bg-white'
                    }`}
                  />
                  <span>
                    {isListening
                      ? language === 'hi'
                        ? 'सुन रहा हूँ...'
                        : 'Listening...'
                      : isSpeaking
                      ? language === 'hi'
                        ? 'बोल रहा हूँ...'
                        : 'Speaking...'
                      : isThinking
                      ? language === 'hi'
                        ? 'सोच रहा हूँ...'
                        : 'Thinking...'
                      : language === 'hi'
                      ? 'तैयार है • बोलें'
                      : 'Ready • Speak anytime'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsMuted((prev) => !prev);
                  if (!isMuted) audioPlayer.stop();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                title={isMuted ? 'Unmute voice' : 'Mute voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Soundwave Visualizer Bar */}
          {(isListening || isSpeaking) && (
            <div className="bg-guidance-light/80 border-b border-guidance-border py-2 px-4 flex items-center justify-center gap-1.5">
              <div className="text-xs font-semibold text-guidance mr-2">
                {isListening ? (language === 'hi' ? 'आप बोलें' : 'Listening') : language === 'hi' ? 'सहायक' : 'Speaking'}
              </div>
              <span className="w-1 bg-guidance rounded-full animate-[bounce_0.6s_infinite_100ms] h-4"></span>
              <span className="w-1 bg-guidance rounded-full animate-[bounce_0.6s_infinite_200ms] h-6"></span>
              <span className="w-1 bg-guidance rounded-full animate-[bounce_0.6s_infinite_300ms] h-3"></span>
              <span className="w-1 bg-guidance rounded-full animate-[bounce_0.6s_infinite_400ms] h-5"></span>
              <span className="w-1 bg-guidance rounded-full animate-[bounce_0.6s_infinite_250ms] h-4"></span>
            </div>
          )}

          {/* Conversation Transcript Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[320px] bg-paper-canvas text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      isUser
                        ? 'bg-guidance text-white rounded-br-xs'
                        : 'bg-paper-surface border border-paper-sand text-ink rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="text-xs font-normal">
                      {language === 'hi' ? msg.text_hi : msg.text_en}
                    </p>

                    {/* Show alternative translation toggle */}
                    {!isUser && (
                      <div className="mt-1 pt-1 border-t border-paper-sand/50 text-[10px] text-ink-muted italic">
                        {language === 'hi' ? msg.text_en : msg.text_hi}
                      </div>
                    )}
                  </div>

                  {msg.action_summary && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-guidance font-semibold mt-1 px-2 py-0.5 rounded bg-guidance-light border border-guidance-border">
                      <Sparkles className="w-3 h-3" />
                      <span>{msg.action_summary}</span>
                    </div>
                  )}

                  <span className="text-[9px] text-ink-muted mt-0.5 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex items-center gap-2 text-ink-muted italic text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-guidance" />
                <span>{language === 'hi' ? 'उत्तर तैयार कर रहा हूँ...' : 'Processing your voice...'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Spoken Reply Chips */}
          {quickReplies.length > 0 && (
            <div className="px-3 py-2 bg-paper-surface border-t border-paper-sand flex gap-1.5 overflow-x-auto scrollbar-none">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUserUtterance(reply)}
                  className="px-2.5 py-1 rounded-full bg-paper-canvas border border-paper-sand hover:border-guidance text-[11px] text-ink whitespace-nowrap transition-colors"
                >
                  💬 {reply}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Audio & Input Bar */}
          <div className="p-3 bg-paper-surface border-t border-paper-sand flex items-center gap-2">
            {/* Primary Microphone Button */}
            <button
              type="button"
              onClick={() => (isListening ? stopListening() : startListening())}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-error-brick text-white ring-4 ring-error-brick/20 animate-pulse'
                  : 'bg-guidance hover:bg-guidance-hover text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Tap to speak'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Typed Input Fallback */}
            <div className="flex-1 flex items-center bg-paper-canvas border border-paper-sand rounded-lg px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-guidance">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUserUtterance(typedInput);
                }}
                placeholder={
                  language === 'hi' ? 'बोलें या यहाँ टाइप करें...' : 'Speak or type here...'
                }
                className="w-full bg-transparent text-xs text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => handleUserUtterance(typedInput)}
                disabled={!typedInput.trim()}
                className="p-1 text-guidance disabled:text-ink-muted"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
