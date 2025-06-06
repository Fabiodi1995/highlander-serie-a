import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Star,
  Shield
} from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-12 w-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Regolamento Highlander
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Il gioco di eliminazione basato sui risultati della Serie A 2024/2025
          </p>
          <Badge variant="secondary" className="mt-4 text-lg px-4 py-2">
            <Star className="h-4 w-4 mr-2" />
            Versione Ufficiale 1.0
          </Badge>
        </div>

        {/* Obiettivo del Gioco */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Target className="h-6 w-6" />
              Obiettivo del Gioco
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              <strong>Highlander</strong> è un gioco di eliminazione progressiva basato sui risultati reali del campionato di Serie A 2024/2025. 
              L'obiettivo è essere l'ultimo giocatore rimasto in vita, dimostrando le migliori capacità predittive sui risultati delle partite.
            </p>
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <p className="font-semibold text-green-800 dark:text-green-200">
                "Ne può rimanere solo uno!" - Come nel film omonimo, solo un giocatore potrà proclamarsi vincitore.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup del Gioco */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Users className="h-5 w-5 text-blue-600" />
              Setup del Gioco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Partecipanti</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Minimo 4 giocatori, massimo 50 per partita</li>
                  <li>• Un amministratore gestisce la partita</li>
                  <li>• Registrazione obbligatoria con dati completi</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Durata</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Una partita dura tutto il campionato Serie A</li>
                  <li>• 38 giornate di campionato</li>
                  <li>• Circa 9 mesi di gioco</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meccaniche di Gioco */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Calendar className="h-5 w-5 text-purple-600" />
              Meccaniche di Gioco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fase 1: Selezione */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                Fase 1: Selezione delle Squadre
              </h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• <strong>Prima della giornata:</strong> ogni giocatore deve selezionare le squadre che crede vinceranno</li>
                <li>• <strong>Deadline:</strong> 2 ore prima del primo fischio d'inizio della giornata</li>
                <li>• <strong>Numero selezioni:</strong> variabile in base alle partite della giornata (di solito 10 partite = 10 selezioni)</li>
                <li>• <strong>Vincolo importante:</strong> una volta selezionata una squadra, non può essere più scelta nelle giornate successive</li>
              </ul>
            </div>

            {/* Fase 2: Risultati */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                Fase 2: Valutazione dei Risultati
              </h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• <strong>Vittoria:</strong> la squadra scelta deve vincere la partita (3 punti)</li>
                <li>• <strong>Pareggio o Sconfitta:</strong> comportano l'eliminazione dal gioco</li>
                <li>• <strong>Partite rinviate:</strong> vengono considerate nel momento del recupero</li>
                <li>• <strong>Risultati ufficiali:</strong> si considerano solo i risultati ratificati dalla Lega Serie A</li>
              </ul>
            </div>

            {/* Fase 3: Eliminazione */}
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                Fase 3: Eliminazione
              </h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• I giocatori che sbagliano una o più predizioni vengono <strong>eliminati immediatamente</strong></li>
                <li>• L'eliminazione è <strong>irreversibile</strong> - non si può rientrare nel gioco</li>
                <li>• I giocatori eliminati possono continuare a seguire la partita come spettatori</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Regole Speciali */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Regole Speciali e Situazioni Particolari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Partite Rinviate o Sospese
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Se una partita viene rinviata o sospesa, le selezioni rimangono valide e verranno valutate 
                  quando la partita verrà effettivamente giocata e completata.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Errori Tecnici o Dispute
                </h4>
                <p className="text-blue-700 dark:text-blue-300">
                  In caso di errori tecnici del sistema o dispute sui risultati, la decisione finale 
                  spetta all'amministratore del gioco. Tutti i risultati si basano sui dati ufficiali della Lega Serie A.
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Selezioni Mancate
                </h4>
                <p className="text-red-700 dark:text-red-300">
                  Se un giocatore non effettua le selezioni entro la deadline, viene automaticamente eliminato 
                  dal gioco. Non sono previste eccezioni o proroghe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategia */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="h-5 w-5 text-indigo-600" />
              Strategia e Consigli
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Strategia Conservativa</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Scegli le squadre più forti nelle prime giornate</li>
                  <li>• Evita big match nelle prime fasi</li>
                  <li>• Tieni le squadre di vertice per le giornate difficili</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Strategia Aggressiva</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Usa le big immediatamente contro avversari deboli</li>
                  <li>• Rischia con squadre di medio livello</li>
                  <li>• Punta su risultati sorprendenti</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                Regola d'Oro
              </h4>
              <p className="text-indigo-700 dark:text-indigo-300">
                Ricorda che ogni squadra può essere usata <strong>una sola volta</strong> durante tutto il campionato. 
                Pianifica con cura le tue selezioni considerando l'intero arco della stagione!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vittoria e Classifiche */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="h-6 w-6" />
              Condizioni di Vittoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Highlander - Ne può rimanere solo uno!
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Vincitore Assoluto</h4>
                <p className="text-green-700 dark:text-green-300">
                  Il giocatore che rimane l'unico superstite alla fine del campionato vince la partita.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Pareggio tra Finalisti</h4>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Se più giocatori arrivano all'ultima giornata, vince chi ha usato le squadre con la classifica finale più bassa.
                  In caso di ulteriore pareggio, vince chi si è iscritto per primo al gioco.
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Eliminazione Totale</h4>
                <p className="text-red-700 dark:text-red-300">
                  Se tutti i giocatori vengono eliminati prima della fine del campionato, vince l'ultimo eliminato.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fair Play */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Clock className="h-5 w-5 text-gray-600" />
              Fair Play e Comportamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                Il gioco si basa sui principi di lealtà e fair play. È vietato:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Creare account multipli per lo stesso giocatore</li>
                <li>• Condividere informazioni privilegiate sui risultati</li>
                <li>• Utilizzare bot o sistemi automatici per le selezioni</li>
                <li>• Mancare di rispetto ad altri giocatori</li>
              </ul>
              
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                  "Il gioco deve rimanere divertente e leale per tutti i partecipanti. 
                  Comportamenti scorretti possono portare all'esclusione dal gioco."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Regolamento Highlander - Serie A 2024/2025 | Versione 1.0
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Ultimo aggiornamento: Gennaio 2025
          </p>
        </div>
      </div>
    </div>
  );
}