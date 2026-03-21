import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import api from '../../lib/api';
import type { ConversationSummary, ChatMessage } from '../../lib/api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-cyber-cyan" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-ghost-white/50" />;
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-ghost-white/50" />;
  if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-error-crimson" />;
  return <Clock className="w-3.5 h-3.5 text-ghost-white/30" />;
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
  return phone.slice(-2);
}

export default function Messages() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find(c => c.id === selectedId);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations({
        search: search || undefined,
      });
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await api.getMessages(convId);
      setMessages(data.messages);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      ));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  // Real-time SSE
  useEffect(() => {
    const unsubscribe = api.subscribeToMessages((event) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === event.conversationId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage: {
              body: event.message.body,
              direction: event.message.direction,
              timestamp: event.message.timestamp,
            },
            lastMessageAt: event.message.timestamp,
            unreadCount: event.conversationId === selectedId
              ? 0
              : updated[idx].unreadCount + (event.message.direction === 'inbound' ? 1 : 0),
          };
          updated.sort((a, b) =>
            new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
          );
          return updated;
        }
        loadConversations();
        return prev;
      });

      if (event.conversationId === selectedId) {
        setMessages(prev => [...prev, event.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });
    return unsubscribe;
  }, [selectedId, loadConversations]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedId || isSending) return;
    setIsSending(true);
    try {
      const result = await api.sendMessage(selectedId, inputText.trim());
      setMessages(prev => [...prev, result.message]);
      setInputText('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mobile: show thread when conversation selected
  const showThread = selectedId !== null;

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-xl border border-terminal-gray/30 bg-void-black/50">
      {/* Left panel: Conversation list */}
      <div className={`w-full md:w-96 border-r border-terminal-gray/30 flex flex-col ${showThread ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-terminal-gray/30">
          <h2 className="font-display text-lg font-semibold text-frost-white mb-3">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ghost-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversacion..."
              className="w-full bg-steel-gray/30 border border-terminal-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-frost-white placeholder:text-ghost-white/40 focus:border-cyber-cyan focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-cyber">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ghost-white/50">
              <MessageSquare className="w-10 h-10 mb-3" />
              <p className="text-sm">Sin conversaciones</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-steel-gray/30 ${
                  selectedId === conv.id ? 'bg-steel-gray/40 border-l-2 border-cyber-cyan' : 'border-l-2 border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-steel-gray flex items-center justify-center text-frost-white font-mono text-xs shrink-0">
                  {getInitials(conv.contactName, conv.contactPhone)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-frost-white truncate">
                      {conv.contactName || conv.contactPhone}
                    </span>
                    <span className="text-[10px] text-ghost-white/50 font-mono shrink-0 ml-2">
                      {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-ghost-white/60 truncate">
                      {conv.lastMessage
                        ? `${conv.lastMessage.direction === 'outbound' ? 'Tu: ' : ''}${conv.lastMessage.body}`
                        : 'Sin mensajes'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 shrink-0 w-5 h-5 bg-cyber-cyan text-void-black rounded-full text-[10px] font-mono flex items-center justify-center font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Message thread */}
      <div className={`flex-1 flex flex-col ${showThread ? 'flex' : 'hidden md:flex'}`}>
        {selectedConv ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 p-4 border-b border-terminal-gray/30">
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden text-ghost-white hover:text-cyber-cyan"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-steel-gray flex items-center justify-center text-frost-white font-mono text-xs">
                {getInitials(selectedConv.contactName, selectedConv.contactPhone)}
              </div>
              <div>
                <p className="text-sm font-medium text-frost-white">
                  {selectedConv.contactName || selectedConv.contactPhone}
                </p>
                <p className="text-[10px] font-mono text-ghost-white/50">
                  {selectedConv.contactPhone}
                  <span className="ml-2 px-1.5 py-0.5 bg-matrix-green/20 text-matrix-green rounded text-[9px]">
                    WhatsApp
                  </span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-cyber">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 ${
                      msg.direction === 'outbound'
                        ? 'bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-2xl rounded-tr-md'
                        : 'bg-steel-gray/50 rounded-2xl rounded-tl-md'
                    }`}
                  >
                    <p className="text-sm text-frost-white whitespace-pre-wrap break-words">{msg.body}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : ''}`}>
                      <span className="text-[10px] text-ghost-white/40 font-mono">
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.direction === 'outbound' && <StatusIcon status={msg.status} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-terminal-gray/30">
              <div className="flex items-end gap-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 bg-steel-gray/30 border border-terminal-gray/50 rounded-xl px-4 py-2.5 text-sm text-frost-white placeholder:text-ghost-white/40 focus:border-cyber-cyan focus:outline-none resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isSending}
                  className="p-2.5 bg-cyber-cyan text-void-black rounded-xl hover:bg-cyber-cyan/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ghost-white/40">
            <div className="w-16 h-16 rounded-full bg-steel-gray/30 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="font-display text-lg text-frost-white/60">Selecciona una conversacion</p>
            <p className="text-sm mt-1">Elige un contacto de la lista para ver los mensajes</p>
          </div>
        )}
      </div>
    </div>
  );
}
