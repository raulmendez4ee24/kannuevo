import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import type { ConversationSummary } from '../../lib/api';
import api from '../../lib/api';
import ConversationItem from './ConversationItem';

type FilterTab = 'all' | 'mine' | 'unassigned';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMessage?: (convoId: string) => void;
}

export default function ConversationList({ selectedId, onSelect, onNewMessage }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [channel, setChannel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const assignedTo = tab === 'mine' ? 'me' : tab === 'unassigned' ? 'unassigned' : undefined;
      const data = await api.getConversations({
        search: search || undefined,
        channel: channel || undefined,
        assignedTo,
      });
      setConversations(data.conversations);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, tab, channel]);

  // SSE: new message → refresh list or bump unread
  useEffect(() => {
    const unsub = api.subscribeToMessages((ev) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === ev.conversationId);
        if (idx === -1) {
          // new conversation — refetch
          load();
          return prev;
        }
        const updated = [...prev];
        const c = { ...updated[idx] };
        c.lastMessage = {
          body: ev.message.body,
          direction: ev.message.direction,
          timestamp: ev.message.timestamp,
        };
        c.lastMessageAt = ev.message.timestamp;
        if (ev.message.direction === 'inbound' && c.id !== selectedId) {
          c.unreadCount = (c.unreadCount ?? 0) + 1;
        }
        updated.splice(idx, 1);
        updated.unshift(c);
        return updated;
      });
      onNewMessage?.(ev.conversationId);
    });
    return unsub;
  }, [selectedId]);

  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <div className="w-80 flex-shrink-0 border-r border-steel-gray/30 flex flex-col bg-void-black/60">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-steel-gray/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-frost-white font-mono">Mensajes</h2>
            {totalUnread > 0 && (
              <span className="text-xs bg-cyber-cyan text-void-black rounded-full px-1.5 py-0.5 font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`p-1 rounded transition-colors ${showFilters ? 'text-cyber-cyan' : 'text-frost-white/40 hover:text-frost-white'}`}
              title="Filtros"
            >
              <SlidersHorizontal size={15} />
            </button>
            <button
              onClick={load}
              className="p-1 rounded text-frost-white/40 hover:text-frost-white transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-frost-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contacto..."
            className="w-full bg-steel-gray/20 border border-steel-gray/30 rounded-lg pl-8 pr-3 py-1.5 text-sm text-frost-white placeholder-frost-white/30 outline-none focus:border-cyber-cyan/50"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['all', 'mine', 'unassigned'] as FilterTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1 rounded font-mono transition-colors ${
                tab === t
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30'
                  : 'text-frost-white/40 hover:text-frost-white/70'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'mine' ? 'Míos' : 'Sin asignar'}
            </button>
          ))}
        </div>

        {/* Extra filters */}
        {showFilters && (
          <div className="mt-2">
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className="w-full bg-steel-gray/20 border border-steel-gray/30 rounded-lg px-2 py-1.5 text-xs text-frost-white outline-none focus:border-cyber-cyan/50"
            >
              <option value="">Todos los canales</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="messenger">Messenger</option>
              <option value="web">Web</option>
            </select>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-frost-white/30 text-sm">
            Sin conversaciones
          </div>
        ) : (
          conversations.map(c => (
            <ConversationItem
              key={c.id}
              conversation={c}
              selected={c.id === selectedId}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
