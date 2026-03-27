import { useEffect, useRef } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ChatMessage } from '../../lib/api';
import MessageBubble from './MessageBubble';

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date)
    ? 'Hoy'
    : isYesterday(date)
    ? 'Ayer'
    : format(date, "d 'de' MMMM, yyyy", { locale: es });

  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-steel-gray/30" />
      <span className="text-xs text-frost-white/30 font-mono px-2">{label}</span>
      <div className="flex-1 h-px bg-steel-gray/30" />
    </div>
  );
}

interface Props {
  messages: ChatMessage[];
  loading?: boolean;
}

export default function ChatThread({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-frost-white/30 text-sm">
        Sin mensajes aún
      </div>
    );
  }

  const groups: { date: Date; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const d = new Date(msg.timestamp);
    const last = groups[groups.length - 1];
    if (!last || !isSameDay(last.date, d)) {
      groups.push({ date: d, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
      {groups.map(group => (
        <div key={group.date.toISOString()}>
          <DateSeparator date={group.date} />
          {group.msgs.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
