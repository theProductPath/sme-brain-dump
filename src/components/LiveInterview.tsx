"use client";

import React, { useState, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";

interface LiveInterviewProps {
  onRestartGlobal?: () => void;
}

interface Message {
  role: "SME" | "AI" | "system";
  text: string;
}

export function LiveInterview({ onRestartGlobal }: LiveInterviewProps) {
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusText, setStatusText] = useState<string>("Ready to Start");
  
  // Settings / Keys loaded on start
  const [keys, setKeys] = useState({
    elevenLabsKey: "",
    agentId: "",
    geminiKey: "", openAiKey: "", anthropicKey: "",
  });

  const [useBackupMode, setUseBackupMode] = useState<boolean>(false);
  
  // Backup Mode state
  const [backupStep, setBackupStep] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [answers, setAnswers] = useState({
    currentInput: "",
    roleName: "Senior Developer",
    contextInfo: "Ingestion and ETL ownership transfer before parental leave.",
  });

  // Dictation/Speech state
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [synthesisProgress, setSynthesisProgress] = useState<number>(0);
  const [showOutputButton, setShowOutputButton] = useState<boolean>(false);
  const [hasFinishedPackage, setHasFinishedPackage] = useState<boolean>(false);

  // Document outputs
  const [activeTab, setActiveTab] = useState<"successor" | "faq" | "decisions" | "runbook">("successor");
  const [documents, setDocuments] = useState({
    brief: "",
    faq: "",
    decisions: "",
    runbook: "",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load local settings on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const elKey = localStorage.getItem("tpp_elevenlabs_key") || "";
      const elAgent = localStorage.getItem("tpp_elevenlabs_agent") || "";
      const gemKey = localStorage.getItem("tpp_gemini_key") || "";
      const openaiKey = localStorage.getItem("tpp_openai_key") || "";
      const anthropicKey = localStorage.getItem("tpp_anthropic_key") || "";
      
      setKeys({
        elevenLabsKey: elKey,
        agentId: elAgent,
        geminiKey: gemKey,
        openAiKey: openaiKey,
        anthropicKey: anthropicKey,
      });

      // Decide if we default to backup (Gemini Flash) mode
      if (!elKey || !elAgent) {
        setUseBackupMode(true);
      }
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Voice synthesis for Backup mode questions
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.25;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) || 
                  voices.find(v => v.lang.startsWith("en")) || 
                  null;
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  };

  // WebRTC ElevenLabs Conversation management
  const conversation = useConversation({
    onMessage: (message) => {
      // message.source is either 'user' or 'agent'
      const role = message.source === "user" ? "SME" : "AI";
      // Ignore partial/non-final speech updates to prevent cluttering
      if (message.source === "user" && !(message as any).isFinal) return;

      setMessages((prev) => [
        ...prev.filter(m => m.text !== "..."), // remove typing placeholder
        { role, text: message.message }
      ]);
    },
    onError: (error: any) => {
      console.error("ElevenLabs Error:", error);
      setStatusText("Connection Error");
      setMessages((prev) => [...prev, { role: "system", text: `Connection Error: ${error?.message || error || "Failed call."}` }]);
      setSessionActive(false);
    },
  });

  const startSession = async () => {
    if (useBackupMode) {
      // Start Gemini dynamic TTS/STT backup
      setSessionActive(true);
      setStatusText("Dynamic Interview Active");
      setBackupStep(1);
      
      const welcomeQuestion = `Hi, I am your transition advisor. I understand you are transferring your role as a ${answers.roleName || "Subject Matter Expert"}. Let's start with your day-to-day focus: what actually owns your attention, and what would fall apart if you weren't here?`;
      setCurrentQuestion(welcomeQuestion);
      setMessages([{ role: "AI", text: welcomeQuestion }]);
      setTimeout(() => speakText(welcomeQuestion), 400);
      return;
    }

    try {
      setStatusText("Generating signed session...");
      setMessages([{ role: "system", text: "Connecting to ElevenLabs agent..." }]);

      const res = await fetch("/api/elevenlabs/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: keys.agentId, apiKey: keys.elevenLabsKey }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})); throw new Error(errData.error || "Failed to get authenticated session URL.");
      }

      const { signed_url } = await res.json();

      setStatusText("Connecting WebRTC audio...");
      await conversation.startSession({ signedUrl: signed_url, dynamicVariables: { roleName: answers.roleName, contextInfo: answers.contextInfo } });
      
      setSessionActive(true);
      setStatusText("Voice Session Live");
      setMessages([{ role: "system", text: "Session established. Start speaking naturally with the voice agent." }]);
    } catch (err: any) {
      console.error(err);
      setStatusText("Initialization Failed");
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `Failed: ${err.message}. Switching to Gemini Flash dynamic backup mode.` }
      ]);
      setUseBackupMode(true); alert("ElevenLabs Connection Failed: " + err.message);
    }
  };

  const endSession = async () => {
    try {
      setStatusText("Closing call...");
      let finalTranscript: Message[] = [];

      if (useBackupMode) {
        setSessionActive(false);
        finalTranscript = [...messages];
      } else {
        const id = conversation.getId();
        conversation.endSession();
        setSessionActive(false);
        setStatusText("Session completed.");

        // ALWAYS default to the live UI messages state so we never send an empty transcript
        finalTranscript = [...messages];

        if (id) {
          setStatusText("Retrieving secure transcript...");
          try {
            const res = await fetch(`/api/elevenlabs/transcript/${id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ apiKey: keys.elevenLabsKey }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.transcript && data.transcript.length > 0) {
                finalTranscript = data.transcript;
                // update message window with actual clean transcript
                setMessages(finalTranscript);
              }
            }
          } catch (e) {
            console.error("ElevenLabs transcript fetch failed, using local state", e);
          }
        }
      }
      
      if (!finalTranscript || finalTranscript.length === 0) {
        // Fallback safety if somehow it's still empty
        finalTranscript = [{ role: "SME", text: "I managed the ETL pipelines and am handing off my role." }];
      }

      // Trigger document synthesis
      triggerSynthesis(finalTranscript);
    } catch (err: any) {
      console.error(err);
      setStatusText("Handoff compilation failed.");
    }
  };

  // Submit Answer in Backup/Gemini Dynamic Mode
  
  const handleSendElevenLabsText = () => {
    const text = answers.currentInput.trim();
    if (!text) return;
    
    try {
      if (conversation.sendUserMessage) {
        conversation.sendUserMessage(text);
      } else if ((conversation as any).sendText) {
        (conversation as any).sendText(text);
      }
      
      setMessages((prev) => [
        ...prev,
        { role: "SME", text: text }
      ]);
      setAnswers((prev) => ({ ...prev, currentInput: "" }));
    } catch (err) {
      console.error("Failed to send text to ElevenLabs", err);
    }
  };

  const submitBackupAnswer = async () => {
    const userText = answers.currentInput.trim();
    if (!userText) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const updatedMessages = [
      ...messages,
      { role: "SME" as const, text: userText }
    ];
    setMessages(updatedMessages);
    setAnswers(prev => ({ ...prev, currentInput: "" }));

    if (backupStep < 3) {
      // Fetch dynamic follow-up from Gemini Flash
      setStatusText("Generating follow-up question...");
      setMessages(prev => [...prev, { role: "AI" as const, text: "..." }]);

      try {
        const res = await fetch("/api/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: updatedMessages,
            geminiApiKey: keys.geminiKey,
            openAiApiKey: keys.openAiKey,
            anthropicApiKey: keys.anthropicKey,
            customRoleInfo: `${answers.roleName}: ${answers.contextInfo}`
          }),
        });

        if (!res.ok) throw new Error("Synthesis node timed out.");
        const data = await res.json();
        
        setBackupStep(prev => prev + 1);
        setCurrentQuestion(data.question);
        setMessages(prev => [
          ...prev.filter(m => m.text !== "..."),
          { role: "AI", text: data.question }
        ]);
        setStatusText("Dynamic Interview Active");
        setTimeout(() => speakText(data.question), 300);
      } catch (err) {
        console.error(err);
        const fallbackQ = "Thanks. Can you outline the most critical legacy systems or decisions you made in this role?";
        setBackupStep(prev => prev + 1);
        setCurrentQuestion(fallbackQ);
        setMessages(prev => [
          ...prev.filter(m => m.text !== "..."),
          { role: "AI", text: fallbackQ }
        ]);
        setTimeout(() => speakText(fallbackQ), 300);
      }
    } else {
      // Completed three steps, trigger dynamic synthesis directly
      setSessionActive(false);
      triggerSynthesis(updatedMessages);
    }
  };

  // Synthesize using Gemini Flash
  const triggerSynthesis = async (transcript: Message[]) => {
    setBackupStep(4); // Switch UI to processing screen
    setSynthesisProgress(0);
    setShowOutputButton(false);

    // Run simulated synthesis indicators
    const progressSteps = [1, 2, 3, 4, 5, 6, 7];
    progressSteps.forEach((step, idx) => {
      setTimeout(() => {
        setSynthesisProgress(step);
      }, idx * 700);
    });

    try {
      setStatusText("Synthesizing deliverables...");
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.map(m => ({ role: m.role, text: m.text })),
          geminiApiKey: keys.geminiKey,
          openAiApiKey: keys.openAiKey,
          anthropicApiKey: keys.anthropicKey,
          customRoleInfo: `${answers.roleName}: ${answers.contextInfo}`
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Synthesis failed.");
      }
      const data = await res.json();

      setDocuments({
        brief: data.brief || "<h1>Brief</h1><p>Not generated</p>",
        faq: data.faq || "<h1>FAQ</h1><p>Not generated</p>",
        decisions: data.decisions || "<h1>Decision Log</h1><p>Not generated</p>",
        runbook: data.runbook || "<h1>Runbook</h1><p>Not generated</p>",
      });

      // Complete synthesis process
      setTimeout(() => {
        setSynthesisProgress(7);
        setShowOutputButton(true);
        setStatusText("Synthesis Complete");
      }, progressSteps.length * 700);

    } catch (err: any) {
      console.error(err);
      setStatusText("Synthesis failed");
      setDocuments({
        brief: `<h1>Handoff Brief</h1><p>Synthesis failed: ${err.message}. Please review your LLM API Keys in the settings drawer and try again.</p>`,
        faq: "<h1>FAQ</h1><p>Generation incomplete.</p>",
        decisions: "<h1>Decision Log</h1><p>Generation incomplete.</p>",
        runbook: "<h1>Runbook</h1><p>Generation incomplete.</p>",
      });
      setShowOutputButton(true);
    }
  };

  // Browser Web Speech Recognition dictation
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser speech dictation is only supported in Chrome, Edge, and Safari.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onstart = () => setIsDictating(true);
    rec.onend = () => setIsDictating(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setAnswers((prev) => ({ ...prev, currentInput: prev.currentInput + " " + text }));
    };
    rec.start();
  };

  const restartLive = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSessionActive(false);
    setMessages([]);
    setBackupStep(0);
    setHasFinishedPackage(false);
    setShowOutputButton(false);
    setSynthesisProgress(0);
    setStatusText("Ready to Start");
    if (onRestartGlobal) onRestartGlobal();
  };

  return (
    <div>
      {/* ── STAGE 0: SETUP ROLE ── */}
      {!sessionActive && backupStep === 0 && !hasFinishedPackage && (
        <div className="card wizard-box">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-live">Live voice interview</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="live-indicator-light" style={{ animation: "none", background: useBackupMode ? "var(--color-primary-text)" : "var(--color-success)" }}></span>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {useBackupMode ? "Gemini Dynamic STT Backup" : "ElevenLabs Voice WebRTC"}
                </span>
              </div>
            </div>

            <h2 style={{ marginTop: "16px", fontSize: "24px" }}>Start a Dynamic Transition</h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Type your role name and the context. The AI interviewer will formulate personalized, dynamic questions to extract your institutional expertise.
            </p>

            <div className="kv-detail-block" style={{ marginTop: "24px" }}>
              <div className="kv-item">
                <label>SME Transitioning Role Title</label>
                <input
                  type="text"
                  className="kv-item-input"
                  value={answers.roleName}
                  onChange={(e) => setAnswers(prev => ({ ...prev, roleName: e.target.value }))}
                />
              </div>

              <div className="kv-item">
                <label>Transition Context & Reasons</label>
                <input
                  type="text"
                  className="kv-item-input"
                  value={answers.contextInfo}
                  onChange={(e) => setAnswers(prev => ({ ...prev, contextInfo: e.target.value }))}
                />
              </div>

              <div className="kv-item" style={{ marginTop: "12px" }}>
                <label>Connection Mode</label>
                <select
                  className="kv-item-select"
                  value={useBackupMode ? "backup" : "elevenlabs"}
                  onChange={(e) => setUseBackupMode(e.target.value === "backup")}
                >
                  <option value="elevenlabs">ElevenLabs voice agent (Requires Agent ID & ElevenLabs Key)</option>
                  <option value="backup">Gemini Dynamic STT Backup (Requires Gemini Key)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
            <button className="btn btn-primary" onClick={startSession}>
              Start Call &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 1: VOICE/CHAT ACTIVE SESSION ── */}
      {sessionActive && backupStep === 0 && !useBackupMode && (
        <div className="card wizard-box">
          <div>
            <div className="live-glow-container">
              <div className={`live-visualizer ${conversation.isSpeaking ? "active" : ""}`}>
                🎙️
              </div>
              <div className="live-status-txt">
                <span className="live-indicator-light"></span>
                {statusText}
              </div>
            </div>

            
            <div className="chat-transcript-box" ref={scrollRef}>
              {messages.map((m, idx) => (
                <div key={idx} className={`chat-bubble ${m.role}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="kv-item" style={{ marginTop: "16px" }}>
              <label>Your Response (Speak via Mic, or Type)</label>
              <div className="input-container">
                <textarea
                  className="input-textarea"
                  value={answers.currentInput}
                  onChange={(e) => setAnswers(prev => ({ ...prev, currentInput: e.target.value }))}
                  placeholder="You can simply speak to the agent, or type a response and submit..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendElevenLabsText();
                    }
                  }}
                />
                
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button className="btn btn-ghost" onClick={endSession} style={{ color: "var(--color-error)", fontWeight: 600 }}>
              🔴 Hang Up &amp; Compile Brief
            </button>
            <button className="btn btn-primary" onClick={handleSendElevenLabsText} disabled={!answers.currentInput.trim()}>
              Submit &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 2: BACKUP/GEMINI DYNAMIC INTERVIEW ACTIVE ── */}
      {sessionActive && useBackupMode && backupStep > 0 && backupStep <= 3 && (
        <div className="card wizard-box">
          <div>
            <div className="progress-container">
              <div className="progress-header">
                <span>Backup Interview Step {backupStep} of 3</span>
                <span>{backupStep === 1 ? "33%" : backupStep === 2 ? "66%" : "100%"}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: backupStep === 1 ? "33%" : backupStep === 2 ? "66%" : "100%" }}></div>
              </div>
            </div>

            <div className="question-panel">
              <div className="question-avatar">
                <span>🤖</span>
                <span>Dynamic Interviewer (Gemini)</span>
              </div>
              <p className="question-text">{currentQuestion}</p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() => speakText(currentQuestion)}
              >
                &#9654; Play Question
              </button>
            </div>

            <div className="kv-item">
              <label>Your Response (Speak or Type)</label>
              <div className="input-container">
                <textarea
                  className="input-textarea"
                  value={answers.currentInput}
                  onChange={(e) => setAnswers(prev => ({ ...prev, currentInput: e.target.value }))}
                  placeholder="Speak your response using the mic, or type here..."
                />
                <button
                  className={`mic-button ${isDictating ? "active" : ""}`}
                  onClick={startSpeechRecognition}
                  title="Speak response"
                >
                  🎙️
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button className="btn btn-ghost" onClick={restartLive}>
              Cancel Call
            </button>
            <button className="btn btn-primary" onClick={submitBackupAnswer} disabled={!answers.currentInput.trim()}>
              Submit &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: SYNTHESIS IN PROGRESS ── */}
      {backupStep === 4 && !hasFinishedPackage && (
        <div className="card processing-box">
          <div className="processing-icon">⚡</div>
          <h2>Building Custom Knowledge Package</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Gemini Flash is structuring the conversation transcript intosuccessor-ready briefs...
          </p>

          <div className="processing-steps-log">
            <div className={`processing-step-line ${synthesisProgress >= 1 ? (synthesisProgress === 1 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{synthesisProgress > 1 ? "✓" : "1"}</div>
              <span>Ingesting live transcript...</span>
            </div>
            <div className={`processing-step-line ${synthesisProgress >= 2 ? (synthesisProgress === 2 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{synthesisProgress > 2 ? "✓" : "2"}</div>
              <span>Extracting undocumented system dependencies...</span>
            </div>
            <div className={`processing-step-line ${synthesisProgress >= 3 ? (synthesisProgress === 3 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{synthesisProgress > 3 ? "✓" : "3"}</div>
              <span>Drafting custom successor brief...</span>
            </div>
            <div className={`processing-step-line ${synthesisProgress >= 4 ? (synthesisProgress === 4 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{synthesisProgress > 4 ? "✓" : "4"}</div>
              <span>Synthesizing custom FAQ document...</span>
            </div>
            <div className={`processing-step-line ${synthesisProgress >= 5 ? (synthesisProgress === 5 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{synthesisProgress > 5 ? "✓" : "5"}</div>
              <span>Compiling decision patterns table...</span>
            </div>
            <div className={`processing-step-line ${synthesisProgress >= 6 ? (synthesisProgress === 6 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{synthesisProgress > 6 ? "✓" : "6"}</div>
              <span>Drafting operational runbooks...</span>
            </div>
            <div className={`processing-step-line ${synthesisProgress >= 7 ? "done" : ""}`}>
              <div className="step-bullet">{synthesisProgress >= 7 ? "✓" : "7"}</div>
              <span>Package ready.</span>
            </div>
          </div>

          <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
            {showOutputButton && (
              <button className="btn btn-primary" onClick={() => setHasFinishedPackage(true)}>
                View Custom Package &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STAGE 4: HIGH-FIDELITY CUSTOM DELIVERABLES (LIGHT-THEME) ── */}
      {hasFinishedPackage && (
        <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          
          <div className="output-overlay-header">
            <div>
              <span className="badge badge-live">Custom Output</span>
              <h2 style={{ fontSize: "18px", marginTop: "4px" }}>{answers.roleName} — Transition Package</h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-sm btn-ghost" onClick={() => window.print()}>
                🖨️ PDF Handoff
              </button>
              <button className="btn btn-sm btn-primary" onClick={restartLive}>
                ↺ Restart Live
              </button>
            </div>
          </div>

          <div className="output-tabs-row">
            <button
              className={`output-tab-btn ${activeTab === "successor" ? "active" : ""}`}
              onClick={() => setActiveTab("successor")}
            >
              📋 Successor Brief
            </button>
            <button
              className={`output-tab-btn ${activeTab === "faq" ? "active" : ""}`}
              onClick={() => setActiveTab("faq")}
            >
              ❓ FAQ
            </button>
            <button
              className={`output-tab-btn ${activeTab === "decisions" ? "active" : ""}`}
              onClick={() => setActiveTab("decisions")}
            >
              ⚖️ Decision Log
            </button>
            <button
              className={`output-tab-btn ${activeTab === "runbook" ? "active" : ""}`}
              onClick={() => setActiveTab("runbook")}
            >
              📖 Runbook
            </button>
          </div>

          <div className="doc-canvas-wrapper">
            <div className="doc-canvas">
              {activeTab === "successor" && (
                <div>
                  <div className="doc-why-banner">
                    Why this exists: A high-level orientation brief synthesized dynamically from your conversation turns.
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: documents.brief }} />
                </div>
              )}

              {activeTab === "faq" && (
                <div>
                  <div className="doc-why-banner">
                    Why this exists: Frequently asked questions and answers formulated exactly in your own expert voice.
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: documents.faq }} />
                </div>
              )}

              {activeTab === "decisions" && (
                <div>
                  <div className="doc-why-banner">
                    Why this exists: Judgment calls and unwritten decisions made visible for the successor covering this role.
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: documents.decisions }} />
                </div>
              )}

              {activeTab === "runbook" && (
                <div>
                  <div className="doc-why-banner">
                    Why this exists: Step-by-step procedures detailing recurring processes and edge-case incidents.
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: documents.runbook }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
            Generated dynamically using Gemini Flash transition model &middot; theProductPath
          </div>
        </div>
      )}
    </div>
  );
}
