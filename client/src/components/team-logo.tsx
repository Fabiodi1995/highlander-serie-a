import { Team } from "@shared/schema";

// Import all team logos as PNG
import atalantaLogo from "../assets/team-logos/atalanta.png";
import bolognaLogo from "../assets/team-logos/bologna.png";
import cagliariLogo from "../assets/team-logos/cagliari.png";
import comoLogo from "../assets/team-logos/como.png";
import empoliLogo from "../assets/team-logos/empoli.png";
import fiorentinaLogo from "../assets/team-logos/fiorentina.png";
import genoaLogo from "../assets/team-logos/genoa.png";
import hellasVeronaLogo from "../assets/team-logos/hellas-verona.png";
import interLogo from "../assets/team-logos/inter.png";
import juventusLogo from "../assets/team-logos/juventus.png";
import lazioLogo from "../assets/team-logos/lazio.png";
import lecceLogo from "../assets/team-logos/lecce.png";
import milanLogo from "../assets/team-logos/milan.png";
import monzaLogo from "../assets/team-logos/monza.png";
import napoliLogo from "../assets/team-logos/napoli.png";
import parmaLogo from "../assets/team-logos/parma.png";
import romaLogo from "../assets/team-logos/roma.png";
import torinoLogo from "../assets/team-logos/torino.png";
import udineseLogo from "../assets/team-logos/udinese.png";
import veneziaLogo from "../assets/team-logos/venezia.png";

interface TeamLogoProps {
  team: Team;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const getTeamLogoPath = (teamName: string): string => {
  const logoMap: { [key: string]: string } = {
    "Atalanta": atalantaLogo,
    "Bologna": bolognaLogo,
    "Cagliari": cagliariLogo,
    "Como": comoLogo,
    "Cremonese": empoliLogo, // Fallback for now
    "Empoli": empoliLogo,
    "Fiorentina": fiorentinaLogo,
    "Genoa": genoaLogo,
    "Hellas Verona": hellasVeronaLogo,
    "Verona": hellasVeronaLogo, // Alternative name
    "Inter": interLogo,
    "Juventus": juventusLogo,
    "Lazio": lazioLogo,
    "Lecce": lecceLogo,
    "Milan": milanLogo,
    "Monza": monzaLogo,
    "Napoli": napoliLogo,
    "Parma": parmaLogo,
    "Pisa": parmaLogo, // Fallback for now
    "Roma": romaLogo,
    "Sassuolo": genoaLogo, // Fallback for now
    "Torino": torinoLogo,
    "Udinese": udineseLogo,
    "Venezia": veneziaLogo,
  };

  return logoMap[teamName] || "";
};

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-10 h-10"
};

export function TeamLogo({ team, size = "md", showName = false }: TeamLogoProps) {
  // Safety check for team object
  if (!team || !team.name) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold`}>
        ?
      </div>
    );
  }

  const logoPath = getTeamLogoPath(team.name);

  return (
    <div className="flex items-center gap-2">
      {logoPath ? (
        <img 
          src={logoPath} 
          alt={`Logo ${team.name}`}
          className={`${sizeClasses[size]} object-contain`}
          onError={(e) => {
            console.warn(`Failed to load logo for ${team.name}`);
          }}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold`}>
          {team.code || team.name?.substring(0, 3).toUpperCase() || '?'}
        </div>
      )}
      {showName && (
        <span className="text-sm font-medium">{team.name}</span>
      )}
    </div>
  );
}