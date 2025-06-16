import { Link } from "wouter";
import { 
  Shield, 
  Mail, 
  Github, 
  Trophy, 
  Calendar,
  Users
} from "lucide-react";
import highlanderLogo from "@assets/highlander_logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { href: "/", label: "Dashboard", icon: Trophy },
      { href: "/rules", label: "Regolamento", icon: Shield },
      { href: "/standings", label: "Classifiche", icon: () => <img src={highlanderLogo} alt="Crown" className="h-4 w-4" /> },
      { href: "/calendar", label: "Calendario", icon: Calendar }
    ],
    support: [
      { href: "/help", label: "Aiuto", icon: Mail },
      { href: "/privacy-policy", label: "Privacy", icon: Shield },
      { href: "/terms-of-service", label: "Termini", icon: Shield },
      { href: "/cookie-policy", label: "Cookie", icon: Shield }
    ]
  };

  const socialLinks = [
    { href: "https://github.com", label: "GitHub", icon: Github },
    { href: "mailto:support@highlander.com", label: "Email", icon: Mail }
  ];

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <Crown className="h-8 w-8 text-yellow-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Highlander</h3>
                  <p className="text-sm text-gray-500">Serie A Challenge</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Il gioco di eliminazione basato sui risultati della Serie A. 
                Scegli la tua squadra, sopravvivi ai round e diventa l'ultimo 
                Highlander in piedi.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>Community italiana di appassionati Serie A</span>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Piattaforma</h4>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer group">
                        <link.icon className="h-4 w-4 group-hover:text-green-600" />
                        <span className="text-sm">{link.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Supporto</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <div className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer group">
                        <link.icon className="h-4 w-4 group-hover:text-green-600" />
                        <span className="text-sm">{link.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Serie A Stats Bar */}
        <div className="py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-green-600">20</div>
              <div className="text-xs text-gray-500">Squadre Serie A</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-blue-600">38</div>
              <div className="text-xs text-gray-500">Giornate</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-purple-600">380</div>
              <div className="text-xs text-gray-500">Partite Totali</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-orange-600">2025/26</div>
              <div className="text-xs text-gray-500">Stagione</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-500">
              © {currentYear} Highlander Serie A Challenge. Tutti i diritti riservati.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* Serie A Badge */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span>Powered by Serie A 2025/26</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}