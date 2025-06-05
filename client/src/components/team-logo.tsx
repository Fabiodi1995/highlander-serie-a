import { Team } from "@shared/schema";

interface TeamLogoProps {
  team: Team;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const getTeamLogoPath = (teamName: string): string => {
  const logoMap: { [key: string]: string } = {
    "Atalanta": "/src/assets/team-logos/atalanta.svg",
    "Bologna": "/src/assets/team-logos/bologna.svg",
    "Cagliari": "/src/assets/team-logos/cagliari.svg",
    "Como": "/src/assets/team-logos/como.svg",
    "Empoli": "/src/assets/team-logos/empoli.svg",
    "Fiorentina": "/src/assets/team-logos/fiorentina.svg",
    "Genoa": "/src/assets/team-logos/genoa.svg",
    "Hellas Verona": "/src/assets/team-logos/hellas-verona.svg",
    "Inter": "/src/assets/team-logos/inter.svg",
    "Juventus": "/src/assets/team-logos/juventus.svg",
    "Lazio": "/src/assets/team-logos/lazio.svg",
    "Lecce": "/src/assets/team-logos/lecce.svg",
    "Milan": "/src/assets/team-logos/milan.svg",
    "Monza": "/src/assets/team-logos/monza.svg",
    "Napoli": "/src/assets/team-logos/napoli.svg",
    "Parma": "/src/assets/team-logos/parma.svg",
    "Roma": "/src/assets/team-logos/roma.svg",
    "Torino": "/src/assets/team-logos/torino.svg",
    "Udinese": "/src/assets/team-logos/udinese.svg",
    "Venezia": "/src/assets/team-logos/venezia.svg",
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