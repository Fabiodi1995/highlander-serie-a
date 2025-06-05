import { Team } from "@shared/schema";

// Import all team logos
import atalantaLogo from "../assets/team-logos/atalanta.svg";
import bolognaLogo from "../assets/team-logos/bologna.svg";
import cagliariLogo from "../assets/team-logos/cagliari.svg";
import comoLogo from "../assets/team-logos/como.svg";
import empoliLogo from "../assets/team-logos/empoli.svg";
import fiorentinaLogo from "../assets/team-logos/fiorentina.svg";
import genoaLogo from "../assets/team-logos/genoa.svg";
import hellasVeronaLogo from "../assets/team-logos/hellas-verona.svg";
import interLogo from "../assets/team-logos/inter.svg";
import juventusLogo from "../assets/team-logos/juventus.svg";
import lazioLogo from "../assets/team-logos/lazio.svg";
import lecceLogo from "../assets/team-logos/lecce.svg";
import milanLogo from "../assets/team-logos/milan.svg";
import monzaLogo from "../assets/team-logos/monza.svg";
import napoliLogo from "../assets/team-logos/napoli.svg";
import parmaLogo from "../assets/team-logos/parma.svg";
import romaLogo from "../assets/team-logos/roma.svg";
import torinoLogo from "../assets/team-logos/torino.svg";
import udineseLogo from "../assets/team-logos/udinese.svg";
import veneziaLogo from "../assets/team-logos/venezia.svg";

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
    "Empoli": empoliLogo,
    "Fiorentina": fiorentinaLogo,
    "Genoa": genoaLogo,
    "Hellas Verona": hellasVeronaLogo,
    "Inter": interLogo,
    "Juventus": juventusLogo,
    "Lazio": lazioLogo,
    "Lecce": lecceLogo,
    "Milan": milanLogo,
    "Monza": monzaLogo,
    "Napoli": napoliLogo,
    "Parma": parmaLogo,
    "Roma": romaLogo,
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
  const logoPath = getTeamLogoPath(team.name);

  return (
    <div className="flex items-center gap-2">
      {logoPath ? (
        <img 
          src={logoPath} 
          alt={`Logo ${team.name}`}
          className={`${sizeClasses[size]} rounded-full`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold`}>
          {team.code}
        </div>
      )}
      {showName && (
        <span className="text-sm font-medium">{team.name}</span>
      )}
    </div>
  );
}