import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Timer,
  Shield
} from "lucide-react";
import highlanderLogo from "@assets/highlander_logo.png";

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Shield className="h-10 w-10 text-green-600" />
          Regolamento Highlander
        </h1>
        <p className="text-xl text-gray-600">
          Il gioco di eliminazione basato sui risultati della Serie A
        </p>
      </div>

      <div className="space-y-8">
        {/* Panoramica del Gioco */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              Panoramica del Gioco
            </CardTitle>
            <CardDescription>
              Come funziona Highlander e qual è l'obiettivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Highlander è un gioco di eliminazione strategico basato sui risultati reali della Serie A italiana. 
              I giocatori devono scegliere saggiamente le squadre che credono vinceranno le partite di ogni giornata, 
              sapendo che ogni squadra può essere selezionata una sola volta durante l'intero gioco.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <img src={highlanderLogo} alt="Highlander" className="h-4 w-4" />
                Obiettivo
              </h4>
              <p className="text-green-700">
                Essere l'ultimo giocatore rimasto attivo dopo che tutte le altre persone sono state eliminate. 
                Come nel film "Highlander": <em>"Ne rimarrà soltanto uno!"</em>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meccaniche di Gioco */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Meccaniche di Gioco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Selezione delle Squadre</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Ogni giornata devi scegliere una squadra che pensi vincerà
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Ogni squadra può essere scelta una sola volta per tutto il gioco
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Devi fare la selezione prima che inizi la giornata
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Stati del Ticket</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-800 border-green-200">Attivo</Badge>
                    <span className="text-sm text-gray-600">Ticket ancora in gioco</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Superato</Badge>
                    <span className="text-sm text-gray-600">Ha superato round precedenti</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-800 border-red-200">Eliminato</Badge>
                    <span className="text-sm text-gray-600">Eliminato dal gioco</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Vincitore</Badge>
                    <span className="text-sm text-gray-600">Ha vinto il gioco</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regole di Eliminazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Regole di Eliminazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3">Vieni eliminato se:</h4>
              <ul className="space-y-2 text-red-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  La squadra che hai scelto perde la partita
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  La squadra che hai scelto pareggia la partita
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  Non fai una selezione entro il tempo limite
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Rimani in gioco se:</h4>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  La squadra che hai scelto vince la partita
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Condizioni di Vittoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src={highlanderLogo} alt="Highlander" className="h-6 w-6" />
              Condizioni di Vittoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Il gioco può terminare in diverse situazioni:
            </p>
            
            <div className="grid gap-4">
              <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Vincitore Singolo</h4>
                <p className="text-yellow-700">
                  Se rimane solo un giocatore attivo, quello è il vincitore
                </p>
              </div>
              
              <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Vincitori Multipli</h4>
                <p className="text-blue-700">
                  Se più giocatori sopravvivono fino alla 38ª giornata di Serie A o al 20º round del gioco, 
                  tutti i sopravvissuti sono dichiarati vincitori
                </p>
              </div>
              
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Nessun Vincitore</h4>
                <p className="text-gray-700">
                  Se tutti i giocatori vengono eliminati prima della fine, il gioco termina senza vincitori
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tempistiche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-6 w-6 text-purple-600" />
              Tempistiche e Scadenze
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800">Selezioni</h4>
                  <p className="text-gray-600 text-sm">
                    Le selezioni devono essere effettuate prima dell'inizio della giornata di Serie A
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Timer className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800">Assegnazione Automatica</h4>
                  <p className="text-gray-600 text-sm">
                    Se non fai una selezione in tempo, il sistema potrebbe assegnartene una automaticamente 
                    o potresti essere eliminato (a discrezione dell'amministratore)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-green-600" />
              Registrazione e Partecipazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Come Partecipare</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Registrati sulla piattaforma con username e password</li>
                  <li>Aspetta che un amministratore crei un nuovo gioco</li>
                  <li>Ricevi i tuoi ticket di partecipazione dall'amministratore</li>
                  <li>Inizia a fare le tue selezioni quando il gioco diventa attivo</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Ticket Multipli</h4>
                <p className="text-blue-700 text-sm">
                  Puoi ricevere più ticket per lo stesso gioco, aumentando le tue possibilità di vittoria. 
                  Ogni ticket è indipendente e ha le sue selezioni separate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note Finali */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Shield className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800">Fair Play</h3>
              <p className="text-green-700 max-w-2xl mx-auto">
                Highlander è un gioco basato sulla strategia e sulla conoscenza del calcio. 
                Gioca sempre in modo leale e rispetta gli altri partecipanti. 
                Le decisioni degli amministratori sono definitive.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}