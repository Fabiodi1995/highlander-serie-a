import { Link } from "wouter";
import { Scale, Shield, Cookie, FileText, Mail, MapPin, Phone } from "lucide-react";

export function LegalFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-400" />
              Highlander Gaming
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Il gioco di eliminazione basato sui risultati della Serie A italiana. 
              Ne può rimanere solo uno!
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Via Roma, 123 - 00100 Roma (RM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+39 06 12345678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@highlander-game.it</span>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Note Legali</h4>
            <div className="space-y-2">
              <Link href="/privacy-policy">
                <a className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </a>
              </Link>
              <Link href="/terms-of-service">
                <a className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
                  <FileText className="h-4 w-4" />
                  Termini di Servizio
                </a>
              </Link>
              <Link href="/cookie-policy">
                <a className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
                  <Cookie className="h-4 w-4" />
                  Cookie Policy
                </a>
              </Link>
            </div>
          </div>

          {/* Game Info */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Gioco</h4>
            <div className="space-y-2">
              <Link href="/rules">
                <a className="text-gray-400 hover:text-white text-sm transition-colors">
                  Regolamento
                </a>
              </Link>
              <Link href="/">
                <a className="text-gray-400 hover:text-white text-sm transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/profile">
                <a className="text-gray-400 hover:text-white text-sm transition-colors">
                  Profilo
                </a>
              </Link>
            </div>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Supporto</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div>
                <p className="font-medium text-gray-300">Assistenza Tecnica</p>
                <a href="mailto:support@highlander-game.it" className="hover:text-white transition-colors">
                  support@highlander-game.it
                </a>
              </div>
              <div>
                <p className="font-medium text-gray-300">Privacy & GDPR</p>
                <a href="mailto:privacy@highlander-game.it" className="hover:text-white transition-colors">
                  privacy@highlander-game.it
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              <p>&copy; 2025 Highlander Gaming S.r.l. - Tutti i diritti riservati</p>
              <p className="text-xs mt-1">P.IVA: 12345678901 | C.F.: 12345678901</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-gray-500">
              <span>Conforme a GDPR 2016/679</span>
              <span>•</span>
              <span>Normativa Italiana</span>
              <span>•</span>
              <span>Serie A 2024/2025</span>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Disclaimer:</strong> Highlander è un gioco di intrattenimento basato sui risultati ufficiali 
              del campionato di Serie A. I risultati utilizzati sono forniti dalla Lega Serie A e potrebbero subire variazioni 
              in caso di decisioni del Giudice Sportivo. Il gioco non comporta vincite in denaro ed è destinato esclusivamente 
              al divertimento degli utenti. Per reclami relativi al trattamento dei dati personali è possibile rivolgersi al 
              Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}