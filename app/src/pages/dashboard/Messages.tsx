import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Info, Archive, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import type { ChatMessage, ConversationDetail, Tag, OrgUser } from '../../lib/api';
import ConversationList from '../../components/inbox/ConversationList';
import ChatThread from '../../components/inbox/ChatThread';
import ComposeBar from '../../components/inbox/ComposeBar';
import ContactPanel from '../../components/inbox/ContactPanel';

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', messenger: 'Messenger', web: 'Web',
};
const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: 'text-green-400 bg-green-400/10 border-green-400/30',
  instagram: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  messenger: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  web: 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/30',
};

export default function Messages() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);

  // Load tags + users once
  useEffect(() => {
    api.getTags().then(d => setAvailableTags(d.tags)).catch(() => {});
    api.getOrgUsers().then(d => setOrgUsers(d.users)).catch(() => {});
  }, []);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    try {
      const data = await api.getMessages(id);
      setConversation(data.conversation);
      setMessages(data.messages);
      // mark read
      api.markConversationRead(id).catch(() => {});
    } catch {
      // ignore
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
    } else {
      setConversation(null);
      setMessages([]);
    }
  }, [selectedId, loadThread]);

  // SSE: append new messages to thread if open
  useEffect(() => {
    const unsub = api.subscribeToMessages((ev) => {
      if (ev.conversationId === selectedId) {
        setMessages(prev => {
          if (prev.some(m => m.id === ev.message.id)) return prev;
          return [...prev, ev.message];
        });
      }
    });
    return unsub;
  }, [selectedId]);

  async function handleSend(body: string, isInternal: boolean) {
    if (!selectedId) return;
    const result = await api.sendMessage(selectedId, body, { isInternal });
    setMessages(prev => {
      if (prev.some(m => m.id === result.message.id)) return prev;
      return [...prev, result.message];
    });
  }

  async function handleUpdate(patch: Parameters<typeof api.updateConversation>[1]) {
    if (!selectedId) return;
    try {
      const result = await api.updateConversation(selectedId, patch);
      setConversation(result.conversation as unknown as ConversationDetail);
    } catch {
      // ignore
    }
  }

  const isMobileThread = selectedId !== null;

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-xl border border-steel-gray/30 bg-void-black/50">
      {/* Left: conversation list */}
      <div className={`${isMobileThread ? 'hidden md:flex' : 'flex'} flex-col`}>
        <ConversationList
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Center: thread */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobileThread ? 'flex' : 'hidden md:flex'}`}>
        {conversation ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-steel-gray/30 bg-void-black/60">
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden text-frost-white/50 hover:text-frost-white transition-colors"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyber-cyan/30 to-neon-purple/30 border border-cyber-cyan/20 flex items-center justify-center text-sm font-bold text-frost-white flex-shrink-0">
                {(conversation.contactName ?? conversation.contactPhone).slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-frost-white truncate">
                  {conversation.contactName ?? conversation.contactPhone}
                </p>
                <p className="text-xs text-frost-white/40 font-mono">{conversation.contactPhone}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded border font-mono ${CHANNEL_COLOR[conversation.channel] ?? 'text-frost-white/50'}`}>
                  {CHANNEL_LABEL[conversation.channel] ?? conversation.channel}
                </span>

                <button
                  onClick={async () => {
                    await handleUpdate({ status: conversation.status === 'active' ? 'archived' : 'active' });
                  }}
                  title={conversation.status === 'active' ? 'Archivar' : 'Restaurar'}
                  className="p-1.5 rounded text-frost-white/40 hover:text-frost-white transition-colors"
                >
                  <Archive size={15} />
                </button>

                <button
                  onClick={() => setShowContactPanel(v => !v)}
                  title="Info del contacto"
                  className={`p-1.5 rounded transition-colors ${showContactPanel ? 'text-cyber-cyan bg-cyber-cyan/10' : 'text-frost-white/40 hover:text-frost-white'}`}
                >
                  <Info size={15} />
                </button>
              </div>
            </div>

            {/* Messages + compose */}
            <ChatThread messages={messages} loading={loadingThread} />
            <ComposeBar onSend={handleSend} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-frost-white/30">
            <div className="w-16 h-16 rounded-full bg-steel-gray/20 border border-steel-gray/30 flex items-center justify-center mb-4">
              <MessageSquare size={28} />
            </div>
            <p className="text-base font-semibold text-frost-white/50">Selecciona una conversación</p>
            <p className="text-sm mt-1">Elige un contacto de la lista</p>
          </div>
        )}
      </div>

      {/* Right: contact panel */}
      {showContactPanel && conversation && (
        <ContactPanel
          conversation={conversation}
          availableTags={availableTags}
          orgUsers={orgUsers}
          onClose={() => setShowContactPanel(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
