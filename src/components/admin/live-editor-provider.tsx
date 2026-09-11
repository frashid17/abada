"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider, useLocale } from "next-intl";
import {
  flattenMessages,
  setMessageAtPath,
  type MessagesTree,
} from "@/lib/platform-admin/ui-copy-shared";

type LiveEditorContextValue = {
  editing: boolean;
  setEditing: (value: boolean) => void;
  flatMessages: Record<string, string>;
  applyLocalOverride: (messageKey: string, value: string) => void;
  messages: MessagesTree;
};

const LiveEditorContext = createContext<LiveEditorContextValue | null>(null);

export function useLiveEditor() {
  const ctx = useContext(LiveEditorContext);
  if (!ctx) {
    throw new Error("useLiveEditor must be used within LiveEditorProvider");
  }
  return ctx;
}

export function LiveEditorProvider({
  initialMessages,
  children,
}: {
  initialMessages: MessagesTree;
  children: ReactNode;
}) {
  const locale = useLocale();
  const [messages, setMessages] = useState<MessagesTree>(initialMessages);
  const [messagesSeed, setMessagesSeed] = useState(initialMessages);
  const [editing, setEditing] = useState(false);

  if (initialMessages !== messagesSeed) {
    setMessagesSeed(initialMessages);
    setMessages(initialMessages);
  }

  const flatMessages = useMemo(() => flattenMessages(messages), [messages]);

  const applyLocalOverride = useCallback((messageKey: string, value: string) => {
    setMessages((prev) => setMessageAtPath(prev, messageKey, value));
  }, []);

  const value = useMemo(
    () => ({
      editing,
      setEditing,
      flatMessages,
      applyLocalOverride,
      messages,
    }),
    [editing, flatMessages, applyLocalOverride, messages],
  );

  return (
    <LiveEditorContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LiveEditorContext.Provider>
  );
}
