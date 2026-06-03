"use client";

import React, { useState, useEffect } from "react";

interface Settings {
  elevenLabsApiKey: string;
  elevenLabsAgentId: string;
  geminiApiKey: string;
  openAiApiKey: string;
  anthropicApiKey: string;
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

export function SettingsDrawer({ isOpen, onClose, onSave }: SettingsDrawerProps) {
  const [settings, setSettings] = useState<Settings>({
    elevenLabsApiKey: "",
    elevenLabsAgentId: "",
    geminiApiKey: "",
    openAiApiKey: "",
    anthropicApiKey: "",
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSettings({
        elevenLabsApiKey: localStorage.getItem("tpp_elevenlabs_key") || "",
        elevenLabsAgentId: localStorage.getItem("tpp_elevenlabs_agent") || "",
        geminiApiKey: localStorage.getItem("tpp_gemini_key") || "",
        openAiApiKey: localStorage.getItem("tpp_openai_key") || "",
        anthropicApiKey: localStorage.getItem("tpp_anthropic_key") || "",
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const trimmedSettings = {
      elevenLabsApiKey: settings.elevenLabsApiKey.trim(),
      elevenLabsAgentId: settings.elevenLabsAgentId.trim(),
      geminiApiKey: settings.geminiApiKey.trim(),
      openAiApiKey: settings.openAiApiKey.trim(),
      anthropicApiKey: settings.anthropicApiKey.trim(),
    };
    
    if (typeof window !== "undefined") {
      localStorage.setItem("tpp_elevenlabs_key", trimmedSettings.elevenLabsApiKey);
      localStorage.setItem("tpp_elevenlabs_agent", trimmedSettings.elevenLabsAgentId);
      localStorage.setItem("tpp_gemini_key", trimmedSettings.geminiApiKey);
      localStorage.setItem("tpp_openai_key", trimmedSettings.openAiApiKey);
      localStorage.setItem("tpp_anthropic_key", trimmedSettings.anthropicApiKey);
    }
    onSave(trimmedSettings);
    onClose();
  };

  return (
    <div className={`settings-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Credentials & Configuration</h3>
          <button className="settings-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-info-box">
            These keys are stored <strong>locally in your browser</strong> via localStorage. They are never sent to any external server other than the respective API endpoints (ElevenLabs, Gemini) during Live sessions.
          </div>

          <div className="kv-detail-block">
            <div className="kv-item">
              <label>ElevenLabs API Key</label>
              <input
                type="password"
                name="elevenLabsApiKey"
                className="kv-item-input"
                placeholder="xi-api-key..."
                value={settings.elevenLabsApiKey}
                onChange={handleChange}
              />
            </div>

            <div className="kv-item">
              <label>ElevenLabs Agent ID</label>
              <input
                type="text"
                name="elevenLabsAgentId"
                className="kv-item-input"
                placeholder="e.g. 2sA8B..."
                value={settings.elevenLabsAgentId}
                onChange={handleChange}
              />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Get this from your ElevenLabs Conversational AI Agent dashboard.
              </span>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

            <div className="kv-item">
              <label>Gemini API Key (Default LLM)</label>
              <input
                type="password"
                name="geminiApiKey"
                className="kv-item-input"
                placeholder="AIzaSy..."
                value={settings.geminiApiKey}
                onChange={handleChange}
              />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Used by Gemini Flash to synthesize raw transcripts into structured Knowledge Packages.
              </span>
            </div>

            <div className="kv-item">
              <label>OpenAI API Key (Optional)</label>
              <input
                type="password"
                name="openAiApiKey"
                className="kv-item-input"
                placeholder="sk-proj-..."
                value={settings.openAiApiKey}
                onChange={handleChange}
              />
            </div>

            <div className="kv-item">
              <label>Anthropic API Key (Optional)</label>
              <input
                type="password"
                name="anthropicApiKey"
                className="kv-item-input"
                placeholder="sk-ant-..."
                value={settings.anthropicApiKey}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            Save Changes
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
