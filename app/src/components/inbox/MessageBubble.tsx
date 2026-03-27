import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, CheckCheck, Clock, Lock } from 'lucide-react';
import type { ChatMessage } from '../../lib/api';

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent: <Check size={12} className="text-frost-white/40" />,
  delivered: <CheckCheck size={12} className="text-frost-white/40" />,
  read: <CheckCheck size={12} className="text-cyber-cyan" />,
  failed: <span className="text-red-400 text-xs">!</span>,
};

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message: m }: Props) {
  const isOut = m.direction === 'outbound';
  const isInternal = m.isInternal;
  const ts = format(new Date(m.timestamp), 'HH:mm', { locale: es });

  if (isInternal) {
    return (
      <div className="flex justify-center my-1">
        <div className="flex items-start gap-2 bg-neon-purple/10 border border-neon-purple/20 rounded-lg px-3 py-2 max-w-[70%]">
          <Lock size={12} className="text-neon-purple mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-neon-purple/80 font-mono mb-0.5">Nota interna</p>
            <p className="text-sm text-frost-white/80">{m.body}</p>
            <p className="text-xs text-frost-white/30 mt-1 text-right">{ts}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} my-0.5`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl ${
          isOut
            ? 'bg-cyber-cyan/15 border border-cyber-cyan/20 rounded-tr-sm'
            : 'bg-steel-gray/50 border border-steel-gray/30 rounded-tl-sm'
        }`}
      >
        {m.mediaUrl && (
          <div className="mb-2">
            {m.mediaType?.startsWith('image') ? (
              <img src={m.mediaUrl} alt="media" className="rounded max-w-full max-h-48 object-cover" />
            ) : (
              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-cyber-cyan text-xs underline">
                Ver adjunto
              </a>
            )}
          </div>
        )}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOut ? 'text-frost-white' : 'text-frost-white/90'}`}>
          {m.body}
        </p>
        <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
          {m.status === 'failed' && (
            <Clock size={10} className="text-red-400" />
          )}
          <span className="text-xs text-frost-white/30">{ts}</span>
          {isOut && STATUS_ICON[m.status ?? 'sent']}
        </div>
      </div>
    </div>
  );
}
