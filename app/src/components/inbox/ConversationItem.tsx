import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ConversationSummary } from '../../lib/api';

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '📱',
  instagram: '📸',
  messenger: '💬',
  web: '🌐',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'text-red-400',
  HIGH: 'text-orange-400',
  NORMAL: 'text-cyber-cyan/60',
  LOW: 'text-frost-white/30',
};

function initials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return phone.slice(-2);
}

interface Props {
  conversation: ConversationSummary;
  selected: boolean;
  onClick: () => void;
}

export default function ConversationItem({ conversation: c, selected, onClick }: Props) {
  const ts = c.lastMessageAt
    ? formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true, locale: es })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-steel-gray/30 transition-colors hover:bg-steel-gray/20 ${selected ? 'bg-cyber-cyan/10 border-l-2 border-l-cyber-cyan' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-cyan/30 to-neon-purple/30 border border-cyber-cyan/20 flex items-center justify-center text-sm font-bold text-frost-white">
          {initials(c.contactName, c.contactPhone)}
        </div>
        <span className="absolute -bottom-1 -right-1 text-xs">{CHANNEL_ICONS[c.channel] ?? '💬'}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-sm font-medium truncate ${selected ? 'text-cyber-cyan' : 'text-frost-white'}`}>
            {c.contactName ?? c.contactPhone}
          </span>
          <span className="text-xs text-frost-white/40 flex-shrink-0">{ts}</span>
        </div>

        {c.lastMessage && (
          <p className="text-xs text-frost-white/50 truncate">
            {c.lastMessage.direction === 'outbound' && <span className="text-cyber-cyan/60">Tú: </span>}
            {c.lastMessage.body}
          </p>
        )}

        {/* Tags + priority + unread */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {c.priority !== 'NORMAL' && (
            <span className={`text-xs font-mono ${PRIORITY_COLORS[c.priority]}`}>
              {c.priority === 'URGENT' ? '⚡' : c.priority === 'HIGH' ? '↑' : '↓'}{c.priority}
            </span>
          )}
          {c.tags.slice(0, 2).map(tag => (
            <span
              key={tag.id}
              className="text-xs px-1.5 py-0.5 rounded-full border font-mono"
              style={{ borderColor: tag.color + '80', color: tag.color, backgroundColor: tag.color + '15' }}
            >
              {tag.name}
            </span>
          ))}
          {c.tags.length > 2 && (
            <span className="text-xs text-frost-white/30">+{c.tags.length - 2}</span>
          )}
        </div>
      </div>

      {/* Unread badge */}
      {c.unreadCount > 0 && (
        <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-cyber-cyan text-void-black text-xs font-bold flex items-center justify-center">
          {c.unreadCount > 9 ? '9+' : c.unreadCount}
        </span>
      )}
    </button>
  );
}
