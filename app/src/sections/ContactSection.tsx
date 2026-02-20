import { Mail, Phone } from 'lucide-react';
import CyberButton from '../components/ui/CyberButton';

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 lg:py-24">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
        <h2 className="font-display text-4xl text-frost-white mb-3">Contacto</h2>
        <p className="text-ghost-white mb-8">Escríbenos para ventas, soporte o auditoría.</p>

        <div className="grid md:grid-cols-2 gap-4">
          <a href="mailto:kanlogic05@gmail.com" className="p-5 rounded-xl border border-terminal-gray/50 bg-steel-gray/30 hover:border-cyber-cyan/50 transition-colors">
            <Mail className="w-5 h-5 text-cyber-cyan mb-2" />
            <p className="text-frost-white">kanlogic05@gmail.com</p>
          </a>
          <a href="https://wa.me/523421055712" className="p-5 rounded-xl border border-terminal-gray/50 bg-steel-gray/30 hover:border-cyber-cyan/50 transition-colors">
            <Phone className="w-5 h-5 text-cyber-cyan mb-2" />
            <p className="text-frost-white">523421055712</p>
          </a>
        </div>

        <div className="mt-6">
          <CyberButton href="#hero">VOLVER ARRIBA</CyberButton>
        </div>
      </div>
    </section>
  );
}
