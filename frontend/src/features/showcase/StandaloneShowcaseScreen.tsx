import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  Play,
  Copy,
  Check,
  Download,
  Volume2,
  Terminal,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { audioPlayer } from '../../services/audioPlayer';
import {
  DocumentExtractionResponse,
  EligibilityEvaluationResponse,
  FormReadinessResponse,
  ExplainResponse,
  VoiceGuideResponse,
} from '../../types';

export const StandaloneShowcaseScreen: React.FC = () => {
  const { language, profile } = useApp();
  const [activeModule, setActiveModule] = useState<'m1' | 'm2' | 'm3' | 'm4'>('m1');
  const [copiedCode, setCopiedCode] = useState(false);

  // Module 1 State
  const [m1SampleKey, setM1SampleKey] = useState('sample_aadhaar');
  const [m1File, setM1File] = useState<File | null>(null);
  const [m1Loading, setM1Loading] = useState(false);
  const [m1Result, setM1Result] = useState<DocumentExtractionResponse | null>(null);
  const [m1MaskSensitive, setM1MaskSensitive] = useState(true);

  // Module 2 State
  const [m2SchemeId, setM2SchemeId] = useState('scheme_pm_kisan');
  const [m2Age, setM2Age] = useState(42);
  const [m2Land, setM2Land] = useState(2.4);
  const [m2Income, setM2Income] = useState(72000);
  const [m2State] = useState('Uttar Pradesh');
  const [m2Loading, setM2Loading] = useState(false);
  const [m2Result, setM2Result] = useState<EligibilityEvaluationResponse | null>(null);

  // Module 3 State
  const [m3FormId, setM3FormId] = useState('form_pm_kisan_app');
  const [m3Loading, setM3Loading] = useState(false);
  const [m3Result, setM3Result] = useState<FormReadinessResponse | null>(null);
  const [m3DownloadingPdf, setM3DownloadingPdf] = useState(false);

  // Module 4 State
  const [m4InputText, setM4InputText] = useState(
    'Eligible operational landholders shall receive DBT of ₹6,000 annually payable in three tranches under the national farmer income security guidelines.'
  );
  const [m4Loading, setM4Loading] = useState(false);
  const [m4Result, setM4Result] = useState<ExplainResponse | null>(null);
  const [m4VoiceInput, setM4VoiceInput] = useState('मुझे पीएम किसान फॉर्म भरना है');
  const [m4VoiceResult, setM4VoiceResult] = useState<VoiceGuideResponse | null>(null);
  const [m4VoiceLoading, setM4VoiceLoading] = useState(false);

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Run Module 1
  const runModule1 = async () => {
    setM1Loading(true);
    try {
      if (m1File) {
        const res = await api.extractDocument({ file: m1File });
        setM1Result(res);
      } else {
        const res = await api.extractDocument({ sampleKey: m1SampleKey });
        setM1Result(res);
      }
    } catch (e) {
      console.error(e);
      alert('Module 1 Extraction failed');
    } finally {
      setM1Loading(false);
    }
  };

  // Run Module 2
  const runModule2 = async () => {
    setM2Loading(true);
    try {
      const customProfile = {
        ...profile,
        age: { value: m2Age, source: 'standalone_playground', confidence: 1.0, confirmed_by_user: true },
        landholding_acres: { value: m2Land, source: 'standalone_playground', confidence: 1.0, confirmed_by_user: true },
        annual_income: { value: m2Income, source: 'standalone_playground', confidence: 1.0, confirmed_by_user: true },
        state: { value: m2State, source: 'standalone_playground', confidence: 1.0, confirmed_by_user: true },
      };
      const res = await api.evaluateEligibility(m2SchemeId, customProfile, ['identity_card', 'land_record'], language);
      setM2Result(res);
    } catch (e) {
      console.error(e);
      alert('Module 2 Evaluation failed');
    } finally {
      setM2Loading(false);
    }
  };

  // Run Module 3
  const runModule3 = async () => {
    setM3Loading(true);
    try {
      const res = await api.prepareFormPlan(m3FormId, profile, language);
      setM3Result(res);
    } catch (e) {
      console.error(e);
      alert('Module 3 Form Plan failed');
    } finally {
      setM3Loading(false);
    }
  };

  const downloadM3Pdf = async () => {
    setM3DownloadingPdf(true);
    try {
      const blob = await api.downloadDraftPdf(m3FormId, profile, language);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EasyPaper_Draft_${m3FormId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('PDF generation failed');
    } finally {
      setM3DownloadingPdf(false);
    }
  };

  // Run Module 4
  const runModule4Explain = async () => {
    setM4Loading(true);
    try {
      const res = await api.explainText(m4InputText, 'Scheme Notice', 'hi');
      setM4Result(res);
    } catch (e) {
      console.error(e);
    } finally {
      setM4Loading(false);
    }
  };

  const runModule4Voice = async () => {
    setM4VoiceLoading(true);
    try {
      const res = await api.guideVoiceAgent({
        user_message: m4VoiceInput,
        language: 'hi',
        current_screen: 'welcome',
        agent_stage: 'GREETING',
        synthesize_audio: true,
      });
      setM4VoiceResult(res);
      await audioPlayer.playAudioOrSpeak({
        base64Audio: res.audio_base64,
        format: res.audio_format || 'mp3',
        text: res.spoken_text_hi,
        lang: 'hi',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setM4VoiceLoading(false);
    }
  };

  const [m4TtsInput, setM4TtsInput] = useState('नमस्ते! मैं आपका ईज़ी-पेपर वॉयस सहायक हूँ।');
  const [m4TtsLoading, setM4TtsLoading] = useState(false);

  const runDirectTts = async () => {
    setM4TtsLoading(true);
    try {
      const res = await api.synthesizeSpeech(m4TtsInput);
      await audioPlayer.playAudioOrSpeak({
        base64Audio: res.audio_base64,
        format: res.format,
        text: m4TtsInput,
        lang: 'hi',
      });
    } catch (e) {
      console.error('Direct TTS fallback to speech synthesis:', e);
      await audioPlayer.speakText(m4TtsInput, 'hi');
    } finally {
      setM4TtsLoading(false);
    }
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-paper-surface border border-paper-sand space-y-2 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-guidance-light text-guidance text-xs font-bold">
          <Terminal className="w-3.5 h-3.5" />
          <span>Standalone Sellable Modules & API Playgrounds</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Modular Architecture & Video Showcase
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Each module is completely decoupled and exposes a public HTTP API. You can test and record independent 30-45s demonstrations for each individual sellable asset below.
        </p>
      </div>

      {/* Module Tabs Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveModule('m1')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeModule === 'm1'
              ? 'bg-guidance text-white border-guidance shadow-md'
              : 'bg-paper-surface border-paper-sand hover:border-ink-muted text-ink'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Module 1</span>
          </div>
          <div className="font-bold text-sm mt-1">Document Intelligence</div>
          <div className={`text-[11px] mt-0.5 ${activeModule === 'm1' ? 'text-white/80' : 'text-ink-muted'}`}>
            POST /v1/documents/extract
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('m2')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeModule === 'm2'
              ? 'bg-guidance text-white border-guidance shadow-md'
              : 'bg-paper-surface border-paper-sand hover:border-ink-muted text-ink'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Module 2</span>
          </div>
          <div className="font-bold text-sm mt-1">Eligibility Copilot</div>
          <div className={`text-[11px] mt-0.5 ${activeModule === 'm2' ? 'text-white/80' : 'text-ink-muted'}`}>
            POST /v1/eligibility/evaluate
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('m3')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeModule === 'm3'
              ? 'bg-guidance text-white border-guidance shadow-md'
              : 'bg-paper-surface border-paper-sand hover:border-ink-muted text-ink'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <FileCheck2 className="w-4 h-4" />
            <span>Module 3</span>
          </div>
          <div className="font-bold text-sm mt-1">Form Readiness Kit</div>
          <div className={`text-[11px] mt-0.5 ${activeModule === 'm3' ? 'text-white/80' : 'text-ink-muted'}`}>
            POST /v1/forms/prepare
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('m4')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeModule === 'm4'
              ? 'bg-guidance text-white border-guidance shadow-md'
              : 'bg-paper-surface border-paper-sand hover:border-ink-muted text-ink'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Module 4</span>
          </div>
          <div className="font-bold text-sm mt-1">Bilingual Explainer & Voice</div>
          <div className={`text-[11px] mt-0.5 ${activeModule === 'm4' ? 'text-white/80' : 'text-ink-muted'}`}>
            POST /v1/explain • /v1/assistant
          </div>
        </button>
      </div>

      {/* -------------------- PLAYGROUND: MODULE 1 -------------------- */}
      {activeModule === 'm1' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-paper-surface border border-paper-sand space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-sand">
              <div>
                <h3 className="font-bold text-lg text-ink">Module 1: Document Intelligence Playground</h3>
                <p className="text-xs text-ink-muted">PaddleOCR + Groq/Gemini Structured Extraction with Grounding & Masking</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `curl -X POST "http://localhost:8000/v1/documents/extract?sample_key=${m1SampleKey}"`
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-paper-sand text-xs font-medium text-ink flex items-center gap-1.5 hover:bg-paper-canvas transition-colors self-start sm:self-center"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-guidance" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Select Sample Document</label>
                <select
                  value={m1SampleKey}
                  onChange={(e) => {
                    setM1SampleKey(e.target.value);
                    setM1File(null);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                >
                  <option value="sample_aadhaar">Aadhaar Card (sample_aadhaar)</option>
                  <option value="sample_khatauni">Khatauni Land Record (sample_khatauni)</option>
                  <option value="sample_income_certificate">Income Certificate (sample_income_certificate)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Or Upload Custom PDF/Image</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setM1File(e.target.files[0]);
                  }}
                  className="w-full text-xs text-ink file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-guidance-light file:text-guidance hover:file:bg-guidance-light/80"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={runModule1}
                  disabled={m1Loading}
                  className="flex-1 min-h-[38px] px-4 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {m1Loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>{m1Loading ? 'Running OCR...' : 'Run Extraction API'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setM1MaskSensitive((prev) => !prev)}
                  className="px-3 py-2 rounded-lg border border-paper-sand text-xs font-medium text-ink"
                  title="Toggle PII Masking"
                >
                  {m1MaskSensitive ? 'Masked' : 'Unmasked'}
                </button>
              </div>
            </div>

            {/* Results Display */}
            {m1Result && (
              <div className="space-y-4 pt-4 border-t border-paper-sand">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-guidance bg-guidance-light px-2.5 py-1 rounded">
                      Type: {m1Result.detected_document_type}
                    </span>
                    <span className="text-xs text-ink-muted">Doc ID: {m1Result.document_id}</span>
                  </div>
                  <span className="text-xs text-ink-muted font-mono">{m1Result.fields.length} Fields Extracted</span>
                </div>

                {/* Table of Extracted Fields */}
                <div className="overflow-x-auto rounded-lg border border-paper-sand">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-paper-canvas border-b border-paper-sand text-ink-muted font-semibold">
                      <tr>
                        <th className="p-2.5">Field Key</th>
                        <th className="p-2.5">Label (EN/HI)</th>
                        <th className="p-2.5">Extracted Value</th>
                        <th className="p-2.5">Confidence</th>
                        <th className="p-2.5">Evidence Grounding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-sand text-ink font-mono">
                      {m1Result.fields.map((f, i) => (
                        <tr key={i} className="hover:bg-paper-canvas/50">
                          <td className="p-2.5 font-bold text-guidance">{f.field_key}</td>
                          <td className="p-2.5 font-sans">
                            <div>{f.label_en}</div>
                            <div className="text-[10px] text-ink-muted">{f.label_hi}</div>
                          </td>
                          <td className="p-2.5 font-semibold">
                            {f.is_sensitive && m1MaskSensitive ? f.masked_value || 'XXXX' : String(f.value)}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-guidance-light text-guidance text-[11px] font-bold">
                              {Math.round(f.confidence * 100)}%
                            </span>
                          </td>
                          <td className="p-2.5 text-ink-muted text-[11px] font-sans truncate max-w-[200px]">
                            {f.source_text || 'Exact OCR match'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Raw OCR Text & JSON Accordion */}
                <div className="p-3 bg-paper-canvas rounded-lg border border-paper-sand space-y-1">
                  <div className="text-[11px] font-bold uppercase text-ink-muted">Raw OCR Output</div>
                  <pre className="text-[11px] font-mono text-ink-muted max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {m1Result.raw_ocr_text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- PLAYGROUND: MODULE 2 -------------------- */}
      {activeModule === 'm2' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-paper-surface border border-paper-sand space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-sand">
              <div>
                <h3 className="font-bold text-lg text-ink">Module 2: Eligibility Copilot Playground</h3>
                <p className="text-xs text-ink-muted">Deterministic Rule Evaluator with Transparent Citations & Missing Prompts</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `curl -X POST "http://localhost:8000/v1/eligibility/evaluate" -H "Content-Type: application/json" -d '{"scheme_id":"${m2SchemeId}","profile":{"landholding_acres":{"value":${m2Land}},"annual_income":{"value":${m2Income}}}}'`
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-paper-sand text-xs font-medium text-ink flex items-center gap-1.5 hover:bg-paper-canvas transition-colors self-start sm:self-center"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-guidance" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Target Scheme</label>
                <select
                  value={m2SchemeId}
                  onChange={(e) => setM2SchemeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                >
                  <option value="scheme_pm_kisan">PM-Kisan Farmer Support</option>
                  <option value="scheme_income_cert">Tehsil Income Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Applicant Age</label>
                <input
                  type="number"
                  value={m2Age}
                  onChange={(e) => setM2Age(parseInt(e.target.value, 10) || 18)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Land (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  value={m2Land}
                  onChange={(e) => setM2Land(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Annual Income (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={m2Income}
                  onChange={(e) => setM2Income(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={runModule2}
                  disabled={m2Loading}
                  className="w-full min-h-[38px] px-4 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {m2Loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>{m2Loading ? 'Evaluating...' : 'Evaluate'}</span>
                </button>
              </div>
            </div>

            {/* Results Display */}
            {m2Result && (
              <div className="space-y-4 pt-4 border-t border-paper-sand">
                {/* Verdict Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    m2Result.status === 'likely_match'
                      ? 'bg-guidance-light border-guidance text-guidance'
                      : m2Result.status === 'not_a_match'
                      ? 'bg-error-brick/10 border-error-brick text-error-brick'
                      : 'bg-review-light border-review-amber text-review-amber'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m2Result.status === 'likely_match' && <CheckCircle2 className="w-6 h-6" />}
                    {m2Result.status === 'not_a_match' && <XCircle className="w-6 h-6" />}
                    {m2Result.status === 'needs_information' && <AlertCircle className="w-6 h-6" />}
                    <div>
                      <div className="font-bold text-sm uppercase">Verdict: {m2Result.status.replace('_', ' ')}</div>
                      <div className="text-xs text-ink mt-0.5 font-sans font-medium">{m2Result.summary_explanation_en}</div>
                    </div>
                  </div>
                  <a
                    href={m2Result.official_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline font-semibold text-guidance whitespace-nowrap"
                  >
                    Official Portal ↗
                  </a>
                </div>

                {/* Criterion Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-ink-muted">Criterion-by-Criterion Checks:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {m2Result.criteria_evaluations.map((c) => (
                      <div key={c.criterion_id} className="p-3 bg-paper-canvas rounded-lg border border-paper-sand space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-ink">
                          <span>{c.label_en}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              c.status === 'met'
                                ? 'bg-guidance-light text-guidance'
                                : 'bg-error-brick/10 text-error-brick'
                            }`}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-ink-muted">{c.reason_en}</div>
                        <div className="text-[10px] text-ink-muted italic border-t border-paper-sand/60 pt-1 mt-1">
                          Source: {c.rule_source_citation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- PLAYGROUND: MODULE 3 -------------------- */}
      {activeModule === 'm3' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-paper-surface border border-paper-sand space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-sand">
              <div>
                <h3 className="font-bold text-lg text-ink">Module 3: Form Readiness Kit Playground</h3>
                <p className="text-xs text-ink-muted">Field-by-Field Completion Plan & Watermarked Draft PDF Generator</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `curl -X POST "http://localhost:8000/v1/forms/prepare" -H "Content-Type: application/json" -d '{"form_id":"${m3FormId}","language":"en"}'`
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-paper-sand text-xs font-medium text-ink flex items-center gap-1.5 hover:bg-paper-canvas transition-colors self-start sm:self-center"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-guidance" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={m3FormId}
                onChange={(e) => setM3FormId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
              >
                <option value="form_pm_kisan_app">PM-Kisan Farmer Application Form</option>
                <option value="form_income_cert_app">Revenue Income Certificate Form</option>
                <option value="form_gold_loan_app">Bank Gold Loan Form-cum-Agreement</option>
              </select>

              <button
                type="button"
                onClick={runModule3}
                disabled={m3Loading}
                className="min-h-[38px] px-5 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {m3Loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{m3Loading ? 'Generating Plan...' : 'Generate Readiness Plan'}</span>
              </button>

              {m3Result && (
                <button
                  type="button"
                  onClick={downloadM3Pdf}
                  disabled={m3DownloadingPdf}
                  className="min-h-[38px] px-5 py-2 rounded-lg bg-ink hover:bg-black text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{m3DownloadingPdf ? 'Generating PDF...' : 'Download Draft PDF'}</span>
                </button>
              )}
            </div>

            {/* Results Display */}
            {m3Result && (
              <div className="space-y-4 pt-4 border-t border-paper-sand">
                <div className="flex items-center justify-between p-3 rounded-lg bg-paper-canvas border border-paper-sand text-xs">
                  <span className="font-bold text-ink">
                    Completion Status: {m3Result.completed_fields} / {m3Result.total_fields} Fields Ready
                  </span>
                  <span className="font-mono text-guidance font-bold">
                    {Math.round((m3Result.completed_fields / m3Result.total_fields) * 100)}%
                  </span>
                </div>

                {/* Sequential Field Instructions */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-ink-muted">Sequential 'Write This Here' Instructions:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto">
                    {m3Result.field_guidance_list.map((fg, idx) => (
                      <div key={fg.field_id} className="p-3 bg-paper-canvas rounded-lg border border-paper-sand text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-ink">
                          <span>{idx + 1}. {fg.label_en}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              fg.completion_state === 'ready'
                                ? 'bg-guidance-light text-guidance font-semibold'
                                : 'bg-review-light text-review-amber'
                            }`}
                          >
                            {fg.completion_state.toUpperCase()}
                          </span>
                        </div>
                        <div className="font-semibold text-guidance text-[11px]">
                          {fg.manual_instruction_en}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          Proposed Value: <span className="font-mono font-bold text-ink">{fg.proposed_value || 'Missing'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- PLAYGROUND: MODULE 4 -------------------- */}
      {activeModule === 'm4' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-paper-surface border border-paper-sand space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-sand">
              <div>
                <h3 className="font-bold text-lg text-ink">Module 4: Bilingual Explainer & Voice Agent Playground</h3>
                <p className="text-xs text-ink-muted">Plain-Language Translation (Groq Qwen) & Voice Guidance (Gemini 2.5 Flash TTS)</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `curl -X POST "http://localhost:8000/v1/explain" -H "Content-Type: application/json" -d '{"text":"${m4InputText.replace(/"/g, '\\"')}","target_language":"hi"}'`
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-paper-sand text-xs font-medium text-ink flex items-center gap-1.5 hover:bg-paper-canvas transition-colors self-start sm:self-center"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-guidance" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>

            {/* Part A: Text Simplification */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink-muted">1. Test Legal / Policy Text Simplification</label>
              <textarea
                rows={3}
                value={m4InputText}
                onChange={(e) => setM4InputText(e.target.value)}
                placeholder="Paste any dense official circular or scheme rule text..."
                className="w-full p-3 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
              />
              <button
                type="button"
                onClick={runModule4Explain}
                disabled={m4Loading || !m4InputText.trim()}
                className="min-h-[38px] px-5 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {m4Loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{m4Loading ? 'Explaining...' : 'Explain in Plain English & Hindi'}</span>
              </button>
            </div>

            {m4Result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-paper-canvas rounded-xl border border-paper-sand text-xs">
                <div className="space-y-2">
                  <div className="font-bold text-ink uppercase text-[11px]">Plain English:</div>
                  <p className="text-ink leading-relaxed">{m4Result.simplified_en}</p>
                </div>
                <div className="space-y-2">
                  <div className="font-bold text-ink uppercase text-[11px]">सरल हिंदी (Hindi):</div>
                  <p className="text-ink leading-relaxed font-devanagari">{m4Result.simplified_hi}</p>
                </div>
              </div>
            )}

            {/* Part B: Voice Guide Agent Turn */}
            <div className="space-y-3 pt-4 border-t border-paper-sand">
              <label className="block text-xs font-semibold text-ink-muted">2. Test Conversational Voice Turn & Audio TTS</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={m4VoiceInput}
                  onChange={(e) => setM4VoiceInput(e.target.value)}
                  placeholder="Type spoken query (e.g. मुझे फॉर्म भरना है / मेरी 2.5 एकड़ जमीन है)..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={runModule4Voice}
                  disabled={m4VoiceLoading || !m4VoiceInput.trim()}
                  className="min-h-[38px] px-5 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {m4VoiceLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  <span>{m4VoiceLoading ? 'Processing...' : 'Run Voice Turn & Play Audio'}</span>
                </button>
              </div>

              {m4VoiceResult && (
                <div className="p-4 bg-paper-canvas rounded-xl border border-paper-sand space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>Action: {m4VoiceResult.action_type} | Stage: {m4VoiceResult.agent_stage}</span>
                    <button
                      type="button"
                      onClick={() =>
                        audioPlayer.playAudioOrSpeak({
                          base64Audio: m4VoiceResult.audio_base64,
                          format: m4VoiceResult.audio_format || 'mp3',
                          text: m4VoiceResult.spoken_text_hi,
                          lang: 'hi',
                        })
                      }
                      className="text-guidance font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Replay Spoken Audio
                    </button>
                  </div>
                  <div className="text-ink font-semibold">Spoken English: {m4VoiceResult.spoken_text_en}</div>
                  <div className="text-ink font-devanagari">बोली गई हिंदी: {m4VoiceResult.spoken_text_hi}</div>
                  {m4VoiceResult.extracted_field_update && (
                    <div className="text-guidance font-mono text-[11px]">
                      Extracted Field Update: {JSON.stringify(m4VoiceResult.extracted_field_update)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Part C: Direct Speech Synthesis Test */}
            <div className="space-y-3 pt-4 border-t border-paper-sand">
              <label className="block text-xs font-semibold text-ink-muted">3. Direct Speech Synthesis API (`POST /v1/assistant/synthesize`)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={m4TtsInput}
                  onChange={(e) => setM4TtsInput(e.target.value)}
                  placeholder="Enter any text to speak in Hindi or English..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-canvas text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={runDirectTts}
                  disabled={m4TtsLoading || !m4TtsInput.trim()}
                  className="min-h-[38px] px-5 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {m4TtsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  <span>{m4TtsLoading ? 'Synthesizing...' : 'Synthesize & Speak'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
