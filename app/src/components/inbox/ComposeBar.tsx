import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Lock, Unlock } from 'lucide-react';

interface Props {
  onSend: (body: string, isInternal: boolean) => Promise<void>;
  disabled?: boolean;
}

export default function ComposeBar({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed, isInternal);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  return (
    <div className={`border-t border-steel-gray/30 p-3 ${isInternal ? 'bg-neon-purple/5' : 'bg-void-black/60'}`}>
      {isInternal && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-neon-purple font-mono">
          <Lock size={11} />
          <span>Nota interna — solo visible para el equipo</span>
        </div>
      )}
      <div className={`flex items-end gap-2 rounded-xl border ${isInternal ? 'border-neon-purple/30 bg-neon-purple/5' : 'border-steel-gray/40 bg-steel-gray/10'} px-3 py-2`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isInternal ? 'Escribe una nota interna...' : 'Escribe un mensaje... (Enter para enviar)'}
          rows={1}
          disabled={disabled || sending}
          className="flex-1 bg-transparent text-sm text-frost-white placeholder-frost-white/30 resize-none outline-none leading-relaxed"
          style={{ maxHeight: '160px' }}
        />

        {/* Toggle internal note */}
        <button
          type="button"
          onClick={() => setIsInternal(v => !v)}
          title={isInternal ? 'Cambiar a mensaje normal' : 'Cambiar a nota interna'}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isInternal ? 'text-neon-purple bg-neon-purple/20' : 'text-frost-white/30 hover:text-frost-white/60'}`}
        >
          {isInternal ? <Lock size={16} /> : <Unlock size={16} />}
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="flex-shrink-0 p-1.5 rounded-lg bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 hover:bg-cyber-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-frost-white/20 mt-1 ml-1">Shift+Enter para salto de línea</p>
    </div>
  );
}
