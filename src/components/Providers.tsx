"use client";

import React from "react";
import { ConversationProvider } from "@elevenlabs/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConversationProvider>
      {children}
    </ConversationProvider>
  );
}
