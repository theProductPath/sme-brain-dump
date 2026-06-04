"use client";

import React, { useState, useEffect, useRef } from "react";
import { downloadArtifactsZip } from "@/utils/zipGenerator";

interface StubInterviewProps {
  onRestartGlobal?: () => void;
}

export function StubInterview({ onRestartGlobal }: StubInterviewProps) {
  const [screen, setScreen] = useState<number>(0);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female");
  const [q2Path, setQ2Path] = useState<"A" | "B">("A");
  
  const [answers, setAnswers] = useState({
    q1: "I'm the primary contact for our enterprise data pipeline — I manage the Monday ingestion runs, handle escalations from the three downstream teams when data looks off, and I'm the only one who knows the quirks in the legacy ETL config from the 2021 migration. If I'm gone, the Monday run will probably fail by week two and nobody will know why.",
    q2: "", // Will be set automatically when path A or B is selected or submitted
    q3: "One: the Monday pipeline has a 20-minute lag that isn't a bug — don't touch it. Two: the data team at the vendor has a shared inbox that's faster than their ticketing system — always email that directly. Three: the finance team's dashboard pulls a cached version — if they're asking why their numbers look stale, tell them to hit the refresh button in the top right, not re-run the query.",
  });

  const [activeTab, setActiveTab] = useState<"successor" | "faq" | "decisions" | "runbook">("successor");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [showOutputButton, setShowOutputButton] = useState<boolean>(false);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  
  const q2TextA = "You mentioned the legacy ETL config from 2021, Sally. Can you walk me through what makes it unusual — and what someone would need to know to troubleshoot it when something breaks?";
  const q2TextB = "You mentioned handling escalations from three downstream teams, Sally. What does that process actually look like — and what do those teams need to know to handle things themselves while you're out?";

  const responseA = "Yeah, the config has a hardcoded date offset that was a workaround for a vendor bug that was never patched. It means the timestamps on records from the Salesforce connector are always 6 hours behind. Everyone downstream has compensated for this in their queries, but it's undocumented. If someone 'fixes' the offset thinking it's wrong, every downstream report breaks.";
  const responseB = "Usually it's Slack first — they ping me directly. I've got a mental triage: if it's a volume anomaly, I check the source system first. If it's a schema mismatch, that's almost always a vendor push. I've never written this down. The teams are capable but they don't know which errors are 'wait and it'll fix itself' vs. 'wake someone up.'";

  // Pre-load default Q2 response on load
  useEffect(() => {
    setAnswers(prev => ({
      ...prev,
      q2: q2Path === "A" ? responseA : responseB
    }));
  }, [q2Path]);

  // Voice synthesis helper
  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.2;
    utt.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const isMale = voiceGender === "male";
    const maleNames = ["tom", "evan", "reed", "rishi", "daniel", "google uk english male", "daniel", "maged"];
    const femaleNames = ["samantha", "karen", "fiona", "victoria", "tessa", "google uk english female", "susan"];
    const preferredNames = isMale ? maleNames : femaleNames;

    let selectedVoice = null;
    for (const name of preferredNames) {
      const match = voices.find(v => v.name.toLowerCase().includes(name) && v.lang.startsWith("en"));
      if (match) {
        selectedVoice = match;
        break;
      }
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes(isMale ? "male" : "female")) || 
                      voices.find(v => v.lang.startsWith("en")) || 
                      null;
    }

    if (selectedVoice) utt.voice = selectedVoice;
    window.speechSynthesis.speak(utt);
  };

  // Speak when screen transitions
  useEffect(() => {
    if (screen === 1) {
      speak("Let's start with the big picture, Sally. In your own words — not your job title, but what you actually own day to day around the data pipeline, and what would fall apart if you weren't here for a month?");
    } else if (screen === 2) {
      // Simulate brief thinking delay before speaking Q2
      const timer = setTimeout(() => {
        speak(q2Path === "A" ? q2TextA : q2TextB);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (screen === 3) {
      speak("Last question, Sally. If the person covering your pipeline could only know three things that aren't written down anywhere — what would they be?");
    } else if (screen === 4) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      // Run processing steps animations
      setProcessingProgress(0);
      setShowOutputButton(false);
      
      const steps = [1, 2, 3, 4, 5, 6, 7];
      steps.forEach((step, idx) => {
        setTimeout(() => {
          setProcessingProgress(step);
          if (step === 7) {
            setTimeout(() => setShowOutputButton(true), 400);
          }
        }, idx * 600);
      });
    }
  }, [screen, q2Path]);

  // Restart voices in browser on load
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>, question: "q1" | "q2" | "q3") => {
    setAnswers((prev) => ({ ...prev, [question]: e.target.value }));
  };

  const handleMicToggle = () => {
    if (!isDictating) {
      setIsDictating(true);
      // Simulate standard speech-to-text placeholder
      setTimeout(() => setIsDictating(false), 3000);
    } else {
      setIsDictating(false);
    }
  };

  const restartDemo = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setScreen(0);
    setQ2Path("A");
    setProcessingProgress(0);
    setShowOutputButton(false);
    setActiveTab("successor");
    if (onRestartGlobal) onRestartGlobal();
  };

  return (
    <div>
      {/* ── SCREEN 0: WELCOME ── */}
      {screen === 0 && (
        <div className="card wizard-box">
          <div>
            <span className="badge">Stub Mode · Personalized</span>
            <h2 style={{ marginTop: "16px", fontSize: "24px" }}>Hi Sally — let's capture what you know</h2>
            <div className="onboarding-intro" style={{ marginTop: "12px" }}>
              <p>
                You've been asked to complete a knowledge transfer before your upcoming leave. This session is focused specifically on your ownership of the <strong>enterprise data pipeline</strong> — the processes, quirks, decisions, and institutional knowledge that live with you right now.
              </p>
              <p>
                This tool will ask you a series of questions and use your answers to build a set of documents your team can reference while you're away. It's designed to feel like a conversation, not a form.
              </p>
              <blockquote>
                "There are no wrong answers. Just explain things naturally as if you're talking to a smart colleague who is new to your area."
              </blockquote>
            </div>

            <div className="voice-toggle-row">
              <div className="voice-toggle-label">Interviewer Voice</div>
              <div className="voice-toggle-group">
                <button
                  className={`voice-toggle-btn ${voiceGender === "male" ? "active" : ""}`}
                  onClick={() => setVoiceGender("male")}
                >
                  ♂ Male
                </button>
                <button
                  className={`voice-toggle-btn ${voiceGender === "female" ? "active" : ""}`}
                  onClick={() => setVoiceGender("female")}
                >
                  ♀ Female
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
            <button className="btn btn-primary" onClick={() => setScreen(1)}>
              Start Interview &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 1: QUESTION 1 ── */}
      {screen === 1 && (
        <div className="card wizard-box">
          <div>
            <div className="progress-container">
              <div className="progress-header">
                <span>Question 1 of 3</span>
                <span>33% Complete</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "33%" }}></div>
              </div>
            </div>

            <div className="question-panel">
              <div className="question-avatar">
                <span>🤖</span>
                <span>AI Interviewer</span>
              </div>
              <p className="question-text">
                Let's start with the big picture, Sally. In your own words — not your job title, but what you actually own day to day around the data pipeline, and what would fall apart if you weren't here for a month?
              </p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() =>
                  speak(
                    "Let's start with the big picture, Sally. In your own words — not your job title, but what you actually own day to day around the data pipeline, and what would fall apart if you weren't here for a month?"
                  )
                }
              >
                &#9654; Play Question
              </button>
            </div>

            <div className="kv-item">
              <label>Your Response (Editable)</label>
              <div className="input-container">
                <textarea
                  className="input-textarea"
                  value={answers.q1}
                  onChange={(e) => handleChange(e, "q1")}
                />
                <button
                  className={`mic-button ${isDictating ? "active" : ""}`}
                  onClick={handleMicToggle}
                  title="Speak response"
                >
                  🎙️
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={() => setScreen(2)}>
              Submit Answer &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: QUESTION 2 (BRANCHING) ── */}
      {screen === 2 && (
        <div className="card wizard-box">
          <div>
            <div className="progress-container">
              <div className="progress-header">
                <span>Question 2 of 3</span>
                <span>66% Complete</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "66%" }}></div>
              </div>
            </div>

            <div className="demo-path-selector">
              <div className="demo-path-label">🎛️ Demo Mode Branching: Choose which path Sally responds to</div>
              <div className="demo-path-buttons">
                <button
                  className={`demo-path-btn ${q2Path === "A" ? "active" : ""}`}
                  onClick={() => setQ2Path("A")}
                >
                  Path A: Legacy System
                </button>
                <button
                  className={`demo-path-btn ${q2Path === "B" ? "active" : ""}`}
                  onClick={() => setQ2Path("B")}
                >
                  Path B: Downstream Escalation
                </button>
              </div>
            </div>

            <div className="question-panel">
              <div className="question-avatar">
                <span>🤖</span>
                <span>AI Interviewer</span>
              </div>
              <p className="question-text">{q2Path === "A" ? q2TextA : q2TextB}</p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() => speak(q2Path === "A" ? q2TextA : q2TextB)}
              >
                &#9654; Play Question
              </button>
            </div>

            <div className="kv-item">
              <label>Your Response (Editable)</label>
              <div className="input-container">
                <textarea
                  className="input-textarea"
                  value={answers.q2}
                  onChange={(e) => handleChange(e, "q2")}
                />
                <button
                  className={`mic-button ${isDictating ? "active" : ""}`}
                  onClick={handleMicToggle}
                  title="Speak response"
                >
                  🎙️
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={() => setScreen(3)}>
              Submit Answer &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: QUESTION 3 ── */}
      {screen === 3 && (
        <div className="card wizard-box">
          <div>
            <div className="progress-container">
              <div className="progress-header">
                <span>Question 3 of 3 (Final)</span>
                <span>100% Complete</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "100%" }}></div>
              </div>
            </div>

            <div className="question-panel">
              <div className="question-avatar">
                <span>🤖</span>
                <span>AI Interviewer</span>
              </div>
              <p className="question-text">
                Last question, Sally. If the person covering your pipeline could only know three things that aren't written down anywhere — what would they be?
              </p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() =>
                  speak(
                    "Last question, Sally. If the person covering your pipeline could only know three things that aren't written down anywhere — what would they be?"
                  )
                }
              >
                &#9654; Play Question
              </button>
            </div>

            <div className="kv-item">
              <label>Your Response (Editable)</label>
              <div className="input-container">
                <textarea
                  className="input-textarea"
                  value={answers.q3}
                  onChange={(e) => handleChange(e, "q3")}
                />
                <button
                  className={`mic-button ${isDictating ? "active" : ""}`}
                  onClick={handleMicToggle}
                  title="Speak response"
                >
                  🎙️
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={() => setScreen(4)}>
              Finish Interview &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 4: PROCESSING ── */}
      {screen === 4 && (
        <div className="card processing-box">
          <div className="processing-icon">⚙️</div>
          <h2>Compiling Knowledge Package</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Synthesizing conversational transcript and structuring handoff deliverables...
          </p>

          <div className="processing-steps-log">
            <div className={`processing-step-line ${processingProgress >= 1 ? (processingProgress === 1 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{processingProgress > 1 ? "✓" : "1"}</div>
              <span>Analyzing conversation transcript...</span>
            </div>
            <div className={`processing-step-line ${processingProgress >= 2 ? (processingProgress === 2 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{processingProgress > 2 ? "✓" : "2"}</div>
              <span>Identifying key processes and dependencies...</span>
            </div>
            <div className={`processing-step-line ${processingProgress >= 3 ? (processingProgress === 3 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{processingProgress > 3 ? "✓" : "3"}</div>
              <span>Drafting Sally's successor brief...</span>
            </div>
            <div className={`processing-step-line ${processingProgress >= 4 ? (processingProgress === 4 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{processingProgress > 4 ? "✓" : "4"}</div>
              <span>Building FAQ from conversation...</span>
            </div>
            <div className={`processing-step-line ${processingProgress >= 5 ? (processingProgress === 5 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{processingProgress > 5 ? "✓" : "5"}</div>
              <span>Extracting decision patterns...</span>
            </div>
            <div className={`processing-step-line ${processingProgress >= 6 ? (processingProgress === 6 ? "active" : "done") : ""}`}>
              <div className="step-bullet">{processingProgress > 6 ? "✓" : "6"}</div>
              <span>Compiling operational runbook...</span>
            </div>
            <div className={`processing-step-line ${processingProgress >= 7 ? "done" : ""}`}>
              <div className="step-bullet">{processingProgress >= 7 ? "✓" : "7"}</div>
              <span>Knowledge package ready.</span>
            </div>
          </div>

          <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
            {showOutputButton && (
              <button className="btn btn-primary" onClick={() => setScreen(5)}>
                View Handoff Brief &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SCREEN 5: TABBED DELIVERABLES (LIGHT-THEME) ── */}
      {screen === 5 && (
        <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          
          <div className="output-overlay-header">
            <div>
              <span className="badge">Output Handoff</span>
              <h2 style={{ fontSize: "18px", marginTop: "4px" }}>Sally Chen — Transition Package</h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-sm btn-ghost" onClick={() => {
                const dummyDocs = {
                  brief: "<h1>Sally Chen — Data Pipeline Ownership</h1><p>Transition Brief prepared from AI interview...</p>",
                  faq: "<h1>Sally Chen FAQ</h1><p>Q: What's the most important thing? A: Monday ingestion run.</p>",
                  decisions: "<h1>Sally Chen Decision Log</h1><p>Timestamp offset in ETL config: Leave 6-hour offset in place.</p>",
                  runbook: "<h1>Runbook: Monday Data Ingestion Run</h1><ol><li>Pre-run check...</li></ol>"
                };
                downloadArtifactsZip("Sally Chen", dummyDocs);
              }}>
                🗂️ Download ZIP
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => window.print()}>
                🖨️ PDF Handoff
              </button>
              <button className="btn btn-sm btn-primary" onClick={restartDemo}>
                ↺ Restart Stub
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
              {/* TAB CONTENT: Successor Brief */}
              <div className={`tab-content ${activeTab === "successor" ? "active" : ""}`}>
                  <div className="doc-why-banner">
                    Why this exists: A high-level orientation for whoever steps into Sally's pipeline responsibilities — written for someone smart who doesn't know the specifics yet.
                  </div>
                  <h1 className="doc-h1">Sally Chen — Data Pipeline Ownership</h1>
                  <p className="doc-meta-txt">Transition Brief · Prepared from AI-facilitated voice interview</p>

                  <h2 className="doc-h2">What Sally Actually Owns</h2>
                  <p className="doc-body-p">
                    Sally is the primary steward of the enterprise data pipeline. Her formal title is Senior Data Engineer, but her real ownership is operational: she runs the weekly ingestion cycle, maintains relationships with three downstream data consumer teams, and carries institutional knowledge of legacy system configurations that predate current team membership.
                  </p>

                  <h2 className="doc-h2">What This Role Actually Does (Beyond Job Specs)</h2>
                  <ul className="doc-bullet-list">
                    <li>Monitors and manages the Monday data ingestion run — the most operationally critical recurring task.</li>
                    <li>Acts as first escalation point for all three downstream data consumer teams.</li>
                    <li>Maintains undocumented knowledge of the legacy ETL configuration and its known quirks from the 2021 migration.</li>
                    <li>Manages vendor relationship for the Salesforce connector, including a faster escalation path via their shared team inbox.</li>
                  </ul>

                  <h2 className="doc-h2">What Will Break Without Intervention</h2>
                  <ul className="doc-bullet-list">
                    <li><strong>The Monday pipeline:</strong> Likely to surface errors by week 2 without someone who knows the timestamp offset behavior.</li>
                    <li><strong>Downstream team escalations:</strong> Teams will escalate to each other or to leadership without a clear triage owner.</li>
                  </ul>

                  <h2 className="doc-h2">Three Things Not Written Down Anywhere</h2>
                  <ol className="doc-numbered-list">
                    <li>The Monday pipeline has a 20-minute lag by design — do not attempt to fix it.</li>
                    <li>Contact the vendor data team via their shared inbox, not the ticketing system.</li>
                    <li>When finance reports stale dashboard data, use the dashboard refresh button — do not re-run the underlying query.</li>
                  </ol>

                  <h2 className="doc-h2">Recommended First Week for Covering Successor</h2>
                  <ul className="doc-bullet-list">
                    <li>Shadow the Monday run (even if nothing breaks).</li>
                    <li>Meet individually with each of the three downstream team leads.</li>
                    <li>Review the legacy ETL config with Sally before her transition is complete.</li>
                  </ul>
                </div>

              {/* TAB CONTENT: FAQ */}
              <div className={`tab-content ${activeTab === "faq" ? "active" : ""}`}>
                  <div className="doc-why-banner">
                    Why this exists: The questions Sally's successor — or whoever covers her pipeline — will almost certainly ask. Answered in her own words.
                  </div>
                  <h1 className="doc-h1">Sally Chen FAQ</h1>
                  <p className="doc-meta-txt">Transition FAQ · Extracted from voice interview</p>

                  <div className="doc-faq-block">
                    <h4 className="doc-faq-q">Q: What's the most important thing to watch every week?</h4>
                    <p className="doc-faq-a">
                      The Monday ingestion run. It should complete within a predictable window. Any anomaly in volume is the first thing to investigate — check the source system before assuming a pipeline issue.
                    </p>
                  </div>

                  <div className="doc-faq-block">
                    <h4 className="doc-faq-q">Q: Why do the timestamps on Salesforce records look 6 hours off?</h4>
                    <p className="doc-faq-a">
                      This is intentional (or rather, a known workaround). There's a hardcoded offset in the legacy ETL config that compensates for an unpatched vendor bug from 2021. All downstream queries have been written to account for this. Do not "fix" it — doing so will break every downstream report.
                    </p>
                  </div>

                  <div className="doc-faq-block">
                    <h4 className="doc-faq-q">Q: How do I reach the vendor when something's wrong?</h4>
                    <p className="doc-faq-a">
                      Email the shared data team inbox directly. It's faster than the ticketing system and gets a response from someone who can actually help. The ticket system routes to a general queue.
                    </p>
                  </div>

                  <div className="doc-faq-block">
                    <h4 className="doc-faq-q">Q: What do I do when a downstream team escalates a data issue?</h4>
                    <p className="doc-faq-a">
                      Triage first: volume anomaly &rarr; check source system. Schema mismatch &rarr; almost always a vendor push, wait or ping vendor. If unsure, ask the team what changed recently on their end.
                    </p>
                  </div>

                  <div className="doc-faq-block">
                    <h4 className="doc-faq-q">Q: The finance dashboard looks stale. What do I do?</h4>
                    <p className="doc-faq-a">
                      Hit the refresh button in the top right of the dashboard UI. Do not re-run the underlying query. This is a known behavior — the dashboard pulls cached data until manually refreshed.
                    </p>
                  </div>
                </div>

              {/* TAB CONTENT: Decision Log */}
              <div className={`tab-content ${activeTab === "decisions" ? "active" : ""}`}>
                  <div className="doc-why-banner">
                    Why this exists: The judgment calls and institutional decisions that lived in Sally's head — made visible so the next person doesn't have to reinvent them.
                  </div>
                  <h1 className="doc-h1">Sally Chen Decision Log</h1>
                  <p className="doc-meta-txt">Transition Decision Log · Extracted from voice interview</p>

                  <table className="doc-data-table">
                    <thead>
                      <tr>
                        <th>Decision</th>
                        <th>What Was Decided</th>
                        <th>Why</th>
                        <th>Who to Ask If Unclear</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Timestamp offset in ETL config</strong></td>
                        <td>Leave the 6-hour offset in place</td>
                        <td>Compensates for unpatched vendor bug; downstream queries depend on it</td>
                        <td>Sally / Vendor data team</td>
                      </tr>
                      <tr>
                        <td><strong>Vendor escalation path</strong></td>
                        <td>Use shared inbox, not ticketing system</td>
                        <td>Shared inbox gets faster response from capable personnel</td>
                        <td>Sally</td>
                      </tr>
                      <tr>
                        <td><strong>Finance dashboard refresh</strong></td>
                        <td>Manual refresh button, not query re-run</td>
                        <td>Re-running the query doesn't affect the cache; UI refresh does</td>
                        <td>Sally</td>
                      </tr>
                      <tr>
                        <td><strong>Monday pipeline lag</strong></td>
                        <td>20-minute lag is by design</td>
                        <td>Artifact of source system batching — correcting it breaks timing assumptions</td>
                        <td>Sally</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              {/* TAB CONTENT: Runbook */}
              <div className={`tab-content ${activeTab === "runbook" ? "active" : ""}`}>
                  <div className="doc-why-banner">
                    Why this exists: Step-by-step operational procedures for the recurring tasks Sally owns — so someone covering can execute without guessing.
                  </div>
                  <h1 className="doc-h1">Runbook: Monday Data Ingestion Run</h1>
                  <p className="doc-meta-txt">Operational Procedures · Active Monitoring: 30-45 mins</p>

                  <ol className="doc-numbered-list" style={{ counterReset: "none" }}>
                    <li>
                      <strong>Step 1 — Pre-run check (Sunday evening or Monday before 8am):</strong> Confirm source system was updated over the weekend (check last-modified timestamp in admin dashboard). If source system shows no update since prior Wednesday, flag to vendor before the run starts.
                    </li>
                    <li>
                      <strong>Step 2 — Monitor the run (Monday, typically starts 8:15am):</strong> The run has a built-in 20-minute lag from scheduled start. This is normal. Do not intervene before the lag window closes. Watch for volume anomaly alert in the monitoring dashboard (threshold: &gt;15% deviation from 4-week average).
                    </li>
                    <li>
                      <strong>Step 3 — If a volume anomaly fires:</strong> Check source system record count first — is the deviation in the source or in the pipeline? If source count looks normal, check Salesforce connector log for schema changes. If schema mismatch, email vendor shared inbox with subject "Schema drift — [date]" and attach log. If no cause, escalate.
                    </li>
                    <li>
                      <strong>Step 4 — Post-run confirmation:</strong> Confirm all three downstream teams' dashboards show updated data by 10am. If any dashboard is stale: (a) check if cache refresh is needed, (b) ping the relevant team lead.
                    </li>
                  </ol>
                </div>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
            Generated from a 20-minute AI-facilitated voice interview with Sally Chen · March 2026 · SMJ Advisory
          </div>
        </div>
      )}
    </div>
  );
}
