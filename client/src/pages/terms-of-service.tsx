import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, FileText, AlertCircle, Clock, CheckCircle, XCircle, Euro } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="h-12 w-12 text-slate-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Termini di Servizio
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Condizioni Generali di Utilizzo del Servizio Highlander
          </p>
          <Badge variant="secondary" className="mt-4 text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Ultimo aggiornamento: Gennaio 2025
          </Badge>
        </div>

        {/* Definizioni */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <FileText className="h-5 w-5 text-blue-600" />
              Definizioni
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">Servizio</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  La piattaforma di gioco online "Highlander" accessibile tramite sito web e applicazioni mobile
                </p>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">Utente</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Qualsiasi persona fisica che si registra e utilizza il Servizio
                </p>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">Titolare</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Highlander Gaming S.r.l., società proprietaria e gestore del Servizio
                </p>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">Gioco</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Competizione di eliminazione basata sui risultati reali del campionato di Serie A
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accettazione dei Termini */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <CheckCircle className="h-6 w-6" />
              Accettazione dei Termini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                L'utilizzo del Servizio implica l'accettazione integrale e incondizionata dei presenti Termini di Servizio.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Condizioni di Accettazione</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Registrazione volontaria al servizio</li>
                  <li>• Conferma durante il processo di registrazione</li>
                  <li>• Accettazione esplicita tramite checkbox</li>
                  <li>• Possibilità di revocare l'accettazione cancellando l'account</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requisiti di Registrazione */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Requisiti di Registrazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Età Minima</h4>
                <p className="text-green-700 dark:text-green-300">
                  È necessario aver compiuto 18 anni per registrarsi al servizio. 
                  I minori tra 14 e 18 anni possono registrarsi solo con il consenso dei genitori o tutori legali.
                </p>
              </div>

              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Informazioni Richieste</h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Nome e cognome reali</li>
                  <li>• Indirizzo email valido e verificabile</li>
                  <li>• Numero di telefono</li>
                  <li>• Data di nascita</li>
                  <li>• Città e paese di residenza</li>
                </ul>
              </div>

              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Divieti</h4>
                <ul className="space-y-1 text-red-700 dark:text-red-300">
                  <li>• È vietato creare account multipli</li>
                  <li>• È vietato fornire informazioni false o fuorvianti</li>
                  <li>• È vietato condividere le credenziali di accesso</li>
                  <li>• È vietato utilizzare nomi utente offensivi o inappropriati</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descrizione del Servizio */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <FileText className="h-5 w-5 text-purple-600" />
              Descrizione del Servizio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Highlander è un gioco di strategia e previsione basato sui risultati reali del campionato di Serie A italiano.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Caratteristiche del Gioco</h4>
                <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                  <li>• Competizioni di eliminazione progressiva</li>
                  <li>• Selezioni basate sui risultati reali della Serie A</li>
                  <li>• Classifiche e statistiche personali</li>
                  <li>• Interfaccia web e mobile responsive</li>
                  <li>• Sistema di achievement e riconoscimenti</li>
                </ul>
              </div>

              <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Limitazioni del Servizio</h4>
                <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
                  <li>• Il servizio può essere temporaneamente sospeso per manutenzione</li>
                  <li>• Le partite dipendono dal calendario ufficiale della Serie A</li>
                  <li>• I risultati si basano esclusivamente sui dati ufficiali della Lega Serie A</li>
                  <li>• Il servizio è fornito "as is" senza garanzie di continuità</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condotte Vietate */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <XCircle className="h-5 w-5 text-red-600" />
              Condotte Vietate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              È espressamente vietato agli utenti:
            </p>
            
            <div className="grid gap-4">
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Violazioni Tecniche</h4>
                <ul className="space-y-1 text-red-700 dark:text-red-300">
                  <li>• Utilizzare bot, script automatici o sistemi di automazione</li>
                  <li>• Tentare di accedere abusivamente ai sistemi</li>
                  <li>• Interferire con il normale funzionamento del servizio</li>
                  <li>• Reverse engineering del codice dell'applicazione</li>
                </ul>
              </div>

              <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Violazioni del Fair Play</h4>
                <ul className="space-y-1 text-orange-700 dark:text-orange-300">
                  <li>• Barare o tentare di manipolare i risultati</li>
                  <li>• Colludere con altri giocatori per ottenere vantaggi</li>
                  <li>• Utilizzare informazioni privilegiate sui risultati</li>
                  <li>• Creare account falsi o multipli</li>
                </ul>
              </div>

              <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Violazioni Comportamentali</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Utilizzare linguaggio offensivo, discriminatorio o volgare</li>
                  <li>• Molestare altri utenti o amministratori</li>
                  <li>• Pubblicare contenuti inappropriati o illegali</li>
                  <li>• Violare la privacy di altri utenti</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aspetti Economici */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Euro className="h-5 w-5 text-green-600" />
              Aspetti Economici
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Servizio Gratuito</h4>
                <p className="text-green-700 dark:text-green-300">
                  Il servizio Highlander è attualmente fornito gratuitamente. Non sono richiesti pagamenti 
                  per la registrazione o la partecipazione ai giochi.
                </p>
              </div>

              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Funzionalità Premium Future</h4>
                <p className="text-blue-700 dark:text-blue-300">
                  Il Titolare si riserva il diritto di introdurre funzionalità premium a pagamento in futuro, 
                  con preavviso di almeno 30 giorni agli utenti registrati.
                </p>
              </div>

              <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Modifiche Tariffarie</h4>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Eventuali modifiche alle condizioni economiche saranno comunicate con almeno 30 giorni di preavviso. 
                  Gli utenti avranno il diritto di recedere entro tale termine.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proprietà Intellettuale */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Scale className="h-5 w-5 text-indigo-600" />
              Proprietà Intellettuale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Diritti del Titolare</h4>
                <p className="text-indigo-700 dark:text-indigo-300">
                  Tutti i diritti di proprietà intellettuale relativi al servizio, inclusi ma non limitati a 
                  software, design, contenuti, marchi e loghi, appartengono al Titolare.
                </p>
              </div>

              <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Licenza d'Uso</h4>
                <p className="text-purple-700 dark:text-purple-300">
                  Il Titolare concede agli utenti una licenza limitata, non esclusiva e revocabile per 
                  l'utilizzo del servizio esclusivamente per gli scopi previsti.
                </p>
              </div>

              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Divieti</h4>
                <ul className="space-y-1 text-red-700 dark:text-red-300">
                  <li>• Copiare, modificare o distribuire il software</li>
                  <li>• Utilizzare marchi o loghi senza autorizzazione</li>
                  <li>• Creare opere derivate</li>
                  <li>• Utilizzare il servizio per scopi commerciali non autorizzati</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limitazioni di Responsabilità */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Limitazioni di Responsabilità
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Esclusioni di Garanzia</h4>
                <p className="text-orange-700 dark:text-orange-300">
                  Il servizio è fornito "così com'è" senza garanzie di alcun tipo. Il Titolare non garantisce 
                  la continuità, l'accuratezza o l'affidabilità del servizio.
                </p>
              </div>

              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Limitazioni di Responsabilità</h4>
                <p className="text-red-700 dark:text-red-300">
                  Il Titolare non sarà responsabile per danni diretti, indiretti, incidentali o consequenziali 
                  derivanti dall'uso del servizio, salvo quanto previsto dalla legge italiana.
                </p>
              </div>

              <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Forza Maggiore</h4>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Il Titolare non sarà responsabile per interruzioni del servizio dovute a eventi di forza maggiore, 
                  guasti tecnici, manutenzioni o modifiche del calendario Serie A.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risoluzione del Contratto */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <XCircle className="h-5 w-5 text-gray-600" />
              Risoluzione del Contratto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Recesso dell'Utente</h4>
                <p className="text-blue-700 dark:text-blue-300">
                  L'utente può recedere dal servizio in qualsiasi momento cancellando il proprio account 
                  dalle impostazioni del profilo o contattando il supporto.
                </p>
              </div>

              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Risoluzione da parte del Titolare</h4>
                <p className="text-red-700 dark:text-red-300">
                  Il Titolare può sospendere o cancellare l'account in caso di violazione dei presenti termini, 
                  con preavviso di 7 giorni salvo gravi violazioni che richiedano intervento immediato.
                </p>
              </div>

              <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Effetti della Risoluzione</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Cessazione immediata dell'accesso al servizio</li>
                  <li>• Cancellazione dei dati personali secondo la privacy policy</li>
                  <li>• Conservazione dei dati per obblighi legali quando applicabile</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legge Applicabile */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Scale className="h-5 w-5 text-slate-600" />
              Legge Applicabile e Foro Competente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Legge Applicabile</h4>
                <p className="text-slate-700 dark:text-slate-300">
                  I presenti Termini di Servizio sono disciplinati dalla legge italiana.
                </p>
              </div>

              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Foro Competente</h4>
                <p className="text-blue-700 dark:text-blue-300">
                  Per qualsiasi controversia derivante dai presenti termini, sarà competente esclusivamente 
                  il Foro di Roma, salvo diversa previsione di legge per i consumatori.
                </p>
              </div>

              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Risoluzione Alternative delle Controversie</h4>
                <p className="text-green-700 dark:text-green-300">
                  Prima di ricorrere al tribunale, le parti si impegnano a tentare la risoluzione bonaria 
                  delle controversie tramite mediazione secondo il D.Lgs. 28/2010.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Termini di Servizio - Highlander Gaming S.r.l. | Conforme alla Normativa Italiana ed Europea
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Ultimo aggiornamento: Gennaio 2025 | Versione 1.0
          </p>
          <div className="mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Sede legale: Via Roma, 123 - 00100 Roma (RM) | P.IVA: 12345678901
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}