"use client";

import React, { useState } from "react";
import { StubInterview } from "@/components/StubInterview";
import { LiveInterview } from "@/components/LiveInterview";
import { SettingsDrawer } from "@/components/SettingsDrawer";

type ActiveTab = "stub" | "live";

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<ActiveTab>("stub");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(0);

  const handleSaveSettings = () => {
    // Increment sessionCount to trigger reloading credentials in subcomponents if necessary
    setSessionCount((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div>
          <div className="brand-section">
            <div className="brand-icon">🧠</div>
            <div className="brand-name">
              SME<span>Brain</span>Dump
            </div>
          </div>

          <ul className="nav-menu">
            <li>
              <button
                className={`nav-item ${activeMenu === "stub" ? "active" : ""}`}
                onClick={() => setActiveMenu("stub")}
              >
                📋 Sally Chen Demo (Stub)
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeMenu === "live" ? "active" : ""}`}
                onClick={() => setActiveMenu("live")}
              >
                🗣️ Custom Transition (Live)
              </button>
            </li>
            <li>
              <button
                className="nav-item"
                onClick={() => setIsSettingsOpen(true)}
                style={{ color: "var(--color-primary-text)" }}
              >
                ⚙️ API Key Settings
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <p>theProductPath &middot; SME Brain Dump</p>
          <p style={{ marginTop: "4px", fontSize: "10px" }}>v2.0 Next.js</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <header className="header-bar">
          <div className="title-group">
            <h1>SME Knowledge Capture</h1>
            <p>
              {activeMenu === "stub"
                ? "Out-of-the-box Wizard-of-Oz interactive demonstration"
                : "Real-time ElevenLabs WebRTC / Gemini Flash dynamic voice sessions"}
            </p>
          </div>
          <div>
            {activeMenu === "stub" ? (
              <span className="badge">Stub Mode</span>
            ) : (
              <span className="badge badge-live">Live Mode</span>
            )}
          </div>
        </header>

        {activeMenu === "stub" ? (
          <StubInterview key={`stub-${sessionCount}`} />
        ) : (
          <LiveInterview key={`live-${sessionCount}`} />
        )}
      </main>

      {/* ── SETTINGS DRAWER ── */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
