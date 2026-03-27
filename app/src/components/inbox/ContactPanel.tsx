import { useState } from 'react';
import { X, Phone, Mail, Tag, ChevronDown, User, FileText } from 'lucide-react';
import type { ConversationDetail, Tag as TagType, OrgUser } from '../../lib/api';

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado',
  proposal: 'Propuesta', negotiation: 'Negociación', won: 'Ganado', lost: 'Perdido',
};
const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Baja', NORMAL: 'Normal', HIGH: 'Alta', URGENT: 'Urgente' };
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-frost-white/40', NORMAL: 'text-cyber-cyan/60', HIGH: 'text-orange-400', URGENT: 'text-red-400',
};

interface Props {
  conversation: ConversationDetail;
  availableTags: TagType[];
  orgUsers: OrgUser[];
  onClose: () => void;
  onUpdate: (patch: {
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    pipelineStage?: string | null;
    notes?: string | null;
    tags?: string[];
    assignedToId?: string | null;
  }) => void;
}

export default function ContactPanel({ conversation: c, availableTags, orgUsers, onClose, onUpdate }: Props) {
  const [notes, setNotes] = useState(c.notes ?? '');
  const [showTagPicker, setShowTagPicker] = useState(false);

  const currentTagIds = new Set(c.tags.map(t => t.id));

  function toggleTag(tagId: string) {
    const next = new Set(currentTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    onUpdate({ tags: Array.from(next) });
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-steel-gray/30 bg-void-black/80 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-steel-gray/30">
        <h3 className="text-sm font-semibold text-frost-white font-mono">Info del contacto</h3>
        <button onClick={onClose} className="text-frost-white/40 hover:text-frost-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* Contact info */}
        <div>
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyber-cyan/30 to-neon-purple/30 border border-cyber-cyan/20 flex items-center justify-center text-xl font-bold text-frost-white mb-3">
            {(c.contactName ?? c.contactPhone).slice(0, 2).toUpperCase()}
          </div>
          <p className="text-center text-sm font-semibold text-frost-white">{c.contactName ?? 'Sin nombre'}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs text-frost-white/50">
              <Phone size={12} />
              <span>{c.contactPhone}</span>
            </div>
            {c.contactEmail && (
              <div className="flex items-center gap-2 text-xs text-frost-white/50">
                <Mail size={12} />
                <span className="truncate">{c.contactEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-mono text-frost-white/40 uppercase tracking-wider mb-1.5 block">Prioridad</label>
          <div className="grid grid-cols-2 gap-1">
            {PRIORITY_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => onUpdate({ priority: p })}
                className={`text-xs py-1.5 rounded border transition-colors font-mono ${
                  c.priority === p
                    ? 'border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan'
                    : 'border-steel-gray/30 text-frost-white/50 hover:border-steel-gray/60'
                }`}
              >
                <span className={PRIORITY_COLORS[p]}>{PRIORITY_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline stage */}
        <div>
          <label className="text-xs font-mono text-frost-white/40 uppercase tracking-wider mb-1.5 block">
            <ChevronDown size={11} className="inline mr-1" />Etapa del pipeline
          </label>
          <select
            value={c.pipelineStage ?? 'new'}
            onChange={e => onUpdate({ pipelineStage: e.target.value })}
            className="w-full bg-steel-gray/20 border border-steel-gray/40 rounded-lg px-2 py-1.5 text-sm text-frost-white outline-none focus:border-cyber-cyan/50"
          >
            {PIPELINE_STAGES.map(s => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Assign agent */}
        <div>
          <label className="text-xs font-mono text-frost-white/40 uppercase tracking-wider mb-1.5 block">
            <User size={11} className="inline mr-1" />Agente asignado
          </label>
          <select
            value={c.assignedToId ?? ''}
            onChange={e => onUpdate({ assignedToId: e.target.value || null })}
            className="w-full bg-steel-gray/20 border border-steel-gray/40 rounded-lg px-2 py-1.5 text-sm text-frost-white outline-none focus:border-cyber-cyan/50"
          >
            <option value="">Sin asignar</option>
            {orgUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-frost-white/40 uppercase tracking-wider">
              <Tag size={11} className="inline mr-1" />Etiquetas
            </label>
            <button
              onClick={() => setShowTagPicker(v => !v)}
              className="text-xs text-cyber-cyan hover:text-cyber-cyan/80"
            >
              {showTagPicker ? 'Cerrar' : 'Editar'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {c.tags.map(tag => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded-full border font-mono"
                style={{ borderColor: tag.color + '80', color: tag.color, backgroundColor: tag.color + '15' }}
              >
                {tag.name}
              </span>
            ))}
            {c.tags.length === 0 && <span className="text-xs text-frost-white/30">Sin etiquetas</span>}
          </div>
          {showTagPicker && (
            <div className="flex flex-wrap gap-1 p-2 bg-steel-gray/10 border border-steel-gray/30 rounded-lg">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2 py-0.5 rounded-full border font-mono transition-opacity ${
                    currentTagIds.has(tag.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{ borderColor: tag.color + '80', color: tag.color, backgroundColor: tag.color + (currentTagIds.has(tag.id) ? '25' : '10') }}
                >
                  {currentTagIds.has(tag.id) ? '✓ ' : ''}{tag.name}
                </button>
              ))}
              {availableTags.length === 0 && (
                <span className="text-xs text-frost-white/30">No hay etiquetas creadas</span>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-mono text-frost-white/40 uppercase tracking-wider mb-1.5 block">
            <FileText size={11} className="inline mr-1" />Notas
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => onUpdate({ notes: notes || null })}
            placeholder="Agrega notas sobre este contacto..."
            rows={4}
            className="w-full bg-steel-gray/20 border border-steel-gray/40 rounded-lg px-3 py-2 text-sm text-frost-white placeholder-frost-white/30 outline-none focus:border-cyber-cyan/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
