// Setup languages: detection, name parsing and the setup texts.
// Pure module, no engine access. Add a language by adding one entry to LANGS.

export type Strings = {
  /** One yes/no question per bar item, each with a short explanation. */
  items: Record<Item, string>
  yes: string
  no: string
  s3: string
  s3usd: string // first option of step 3
  s4: (cur: string) => string
  s4o: [string, string] // skip, type it
  s4live: string // option: fetch the daily ECB rate (opt-in, one request per day)
  ecbDaily: string // summary: "daily ECB rate"
  done: string
  detail: string
  shows: string
  currency: string
  usdOnly: string
  outro: string
  cancelled: string
  names: Record<'cost' | Item, string>
}

export type Item = 'limits' | 'resets' | 'context' | 'model' | 'repo' | 'lines' | 'duration'

export type Lang = {
  code: string
  endonym: string // shown as the pre-selected option
  aliases: string[] // accepted spellings, lower case, endonym and English name included
  stop: string[] // frequent words for detection
  t: Strings
}

const EN: Strings = {
  items: {
    limits: 'Show your usage limits? The 5-hour and 7-day limits in percent, in traffic-light colours (green up to 50 %, yellow △ up to 75 %, red ▲ above). Only on a subscription.',
    resets: 'Show when the limits reset? Adds e.g. "resets in 1h59m" behind each limit.',
    context: 'Show how full the context window is? E.g. "context 38%", in traffic-light colours. When it is full, Claude Code has to compact the conversation.',
    model: 'Show the model? E.g. "Opus 5.5".',
    repo: 'Show the project and git branch? E.g. "my-project · main ✗" (✗ = uncommitted changes). Tokenomics runs three read-only git commands for this, locally; choosing No runs none.',
    lines: 'Show the changed lines? E.g. "+120 / −30 lines": lines added and removed since the last commit. The full list per file: /tokenomics-changes.',
    duration: 'Show the session time? E.g. "1h30m" since the session started.',
  },
  yes: 'Yes',
  no: 'No',
  s3:
    'Show the cost in a second currency as well? Dollars always stay. ' +
    'In the next step you choose the rate: a fixed one you type, or the daily ECB rate (opt-in). ' +
    'Pick one, or type another code (e.g. JPY) under Other.',
  s3usd: 'USD only',
  s4: cur =>
    `Rate for ${cur}: fetch the daily reference rate of the European Central Bank (opt-in: one small internet request per day to ecb.europa.eu, nothing about you is sent), or type a fixed rate under Other (e.g. 0.92).`,
  s4o: ['Skip, USD only', 'I will type it under Other'],
  s4live: 'Daily ECB rate (internet)',
  ecbDaily: 'daily ECB rate',
  done: 'Tokenomics is set up.',
  detail: 'Detail',
  shows: 'Shows',
  currency: 'Currency',
  usdOnly: 'USD only',
  outro: 'Change it any time with /tokenomics-setup. /tokenomics-explain explains the cost figure.',
  cancelled: 'Tokenomics setup cancelled. Nothing was changed.',
  names: { cost: 'cost', limits: 'limits', context: 'context', model: 'model', repo: 'project + git', duration: 'session time', resets: 'reset times', lines: 'changed lines' },
}

const DE: Strings = {
  items: {
    limits: 'Kontingente anzeigen? Das 5-Stunden- und 7-Tage-Kontingent in Prozent, in Ampelfarben (grün bis 50 %, gelb △ bis 75 %, rot ▲ darüber). Nur mit Abo.',
    resets: 'Anzeigen, wann die Kontingente zurückgesetzt werden? Ergänzt z. B. „resets in 1h59m“ hinter jedem Kontingent.',
    context: 'Anzeigen, wie voll das Kontextfenster ist? Z. B. „context 38%“, in Ampelfarben. Ist es voll, muss Claude Code das Gespräch zusammenfassen.',
    model: 'Das Modell anzeigen? Z. B. „Opus 5.5“.',
    repo: 'Projekt und Git-Zweig anzeigen? Z. B. „mein-projekt · main ✗“ (✗ = ungespeicherte Änderungen). Dafür führt Tokenomics lokal drei nur lesende Git-Befehle aus; bei Nein keinen.',
    lines: 'Geänderte Zeilen anzeigen? Z. B. „+120 / −30 lines“: hinzugefügte und entfernte Zeilen seit dem letzten Commit. Die Liste pro Datei: /tokenomics-changes.',
    duration: 'Die Sitzungsdauer anzeigen? Z. B. „1h30m“ seit Beginn der Sitzung.',
  },
  yes: 'Ja',
  no: 'Nein',
  s3:
    'Kosten zusätzlich in einer zweiten Währung zeigen? Dollar bleibt immer. ' +
    'Im nächsten Schritt wählst du den Kurs: einen festen, den du eintippst, oder den täglichen EZB-Kurs (freiwillig). ' +
    'Eine auswählen oder unter Other einen anderen Code eintippen (z. B. JPY).',
  s3usd: 'Nur USD',
  s4: cur =>
    `Kurs für ${cur}: täglich den Referenzkurs der Europäischen Zentralbank holen (freiwillig: eine kleine Internet-Anfrage pro Tag an ecb.europa.eu, es wird nichts über dich gesendet), oder unter Other einen festen Kurs eintippen (z. B. 0.92).`,
  s4o: ['Überspringen, nur USD', 'Ich tippe ihn unter Other ein'],
  s4live: 'Täglicher EZB-Kurs (Internet)',
  ecbDaily: 'täglicher EZB-Kurs',
  done: 'Tokenomics ist eingerichtet.',
  detail: 'Detailstufe',
  shows: 'Zeigt',
  currency: 'Währung',
  usdOnly: 'nur USD',
  outro: 'Jederzeit änderbar mit /tokenomics-setup. /tokenomics-explain erklärt die Kosten-Anzeige.',
  cancelled: 'Einrichtung abgebrochen. Nichts wurde geändert.',
  names: { cost: 'Kosten', limits: 'Kontingente', context: 'Kontext', model: 'Modell', repo: 'Projekt + Git', duration: 'Sitzungsdauer', resets: 'Reset-Zeiten', lines: 'geänderte Zeilen' },
}

const FR: Strings = {
  items: {
    limits: 'Afficher vos limites d’utilisation ? Les limites sur 5 heures et 7 jours en pourcentage, aux couleurs d’un feu tricolore (vert jusqu’à 50 %, jaune △ jusqu’à 75 %, rouge ▲ au-delà). Uniquement avec un abonnement.',
    resets: 'Afficher quand les limites se réinitialisent ? Ajoute par ex. « resets in 1h59m » après chaque limite.',
    context: 'Afficher le remplissage de la fenêtre de contexte ? Par ex. « context 38% », aux couleurs du feu. Quand elle est pleine, Claude Code doit résumer la conversation.',
    model: 'Afficher le modèle ? Par ex. « Opus 5.5 ».',
    repo: 'Afficher le projet et la branche git ? Par ex. « mon-projet · main ✗ » (✗ = modifications non commitées). Tokenomics exécute pour cela trois commandes git en lecture seule, localement ; avec Non, aucune.',
    lines: 'Afficher les lignes modifiées ? Par ex. « +120 / −30 lines » : lignes ajoutées et supprimées depuis le dernier commit. La liste par fichier : /tokenomics-changes.',
    duration: 'Afficher la durée de la session ? Par ex. « 1h30m » depuis le début.',
  },
  yes: 'Oui',
  no: 'Non',
  s3:
    'Afficher aussi le coût dans une autre devise ? Le dollar reste toujours. ' +
    'À l’étape suivante, vous choisissez le taux : un taux fixe que vous tapez, ou le taux BCE quotidien (facultatif). ' +
    'Choisissez-en une ou tapez un autre code (ex. JPY) sous Other.',
  s3usd: 'USD seulement',
  s4: cur =>
    `Taux pour ${cur} : récupérer chaque jour le taux de référence de la Banque centrale européenne (facultatif : une petite requête Internet par jour vers ecb.europa.eu, rien sur vous n’est envoyé), ou taper un taux fixe sous Other (ex. 0.92).`,
  s4o: ['Passer, USD seulement', 'Je le tape sous Other'],
  s4live: 'Taux BCE quotidien (Internet)',
  ecbDaily: 'taux BCE quotidien',
  done: 'Tokenomics est configuré.',
  detail: 'Niveau',
  shows: 'Affiche',
  currency: 'Devise',
  usdOnly: 'USD seulement',
  outro: 'Modifiable à tout moment avec /tokenomics-setup. /tokenomics-explain explique le coût.',
  cancelled: 'Configuration annulée. Rien n’a été modifié.',
  names: { cost: 'coût', limits: 'limites', context: 'contexte', model: 'modèle', repo: 'projet + git', duration: 'durée', resets: 'réinitialisations', lines: 'lignes modifiées' },
}

const ES: Strings = {
  items: {
    limits: '¿Mostrar tus límites de uso? Los límites de 5 horas y 7 días en porcentaje, con colores de semáforo (verde hasta 50 %, amarillo △ hasta 75 %, rojo ▲ por encima). Solo con suscripción.',
    resets: '¿Mostrar cuándo se reinician los límites? Añade p. ej. «resets in 1h59m» tras cada límite.',
    context: '¿Mostrar lo lleno que está el contexto? P. ej. «context 38%», con colores de semáforo. Cuando se llena, Claude Code tiene que resumir la conversación.',
    model: '¿Mostrar el modelo? P. ej. «Opus 5.5».',
    repo: '¿Mostrar el proyecto y la rama git? P. ej. «mi-proyecto · main ✗» (✗ = cambios sin commit). Para ello Tokenomics ejecuta localmente tres comandos git de solo lectura; con No, ninguno.',
    lines: '¿Mostrar las líneas cambiadas? P. ej. «+120 / −30 lines»: líneas añadidas y eliminadas desde el último commit. La lista por archivo: /tokenomics-changes.',
    duration: '¿Mostrar la duración de la sesión? P. ej. «1h30m» desde el inicio.',
  },
  yes: 'Sí',
  no: 'No',
  s3:
    '¿Mostrar también el coste en otra moneda? El dólar siempre se queda. ' +
    'En el siguiente paso eliges el tipo: uno fijo que escribes o el tipo diario del BCE (opcional). ' +
    'Elige una o escribe otro código (p. ej. JPY) en Other.',
  s3usd: 'Solo USD',
  s4: cur =>
    `Tipo para ${cur}: obtener cada día el tipo de referencia del Banco Central Europeo (opcional: una pequeña petición a Internet al día a ecb.europa.eu, no se envía nada sobre ti), o escribir un tipo fijo en Other (p. ej. 0.92).`,
  s4o: ['Omitir, solo USD', 'Lo escribo en Other'],
  s4live: 'Tipo diario del BCE (Internet)',
  ecbDaily: 'tipo diario del BCE',
  done: 'Tokenomics está configurado.',
  detail: 'Nivel',
  shows: 'Muestra',
  currency: 'Moneda',
  usdOnly: 'solo USD',
  outro: 'Cámbialo cuando quieras con /tokenomics-setup. /tokenomics-explain explica el coste.',
  cancelled: 'Configuración cancelada. No se cambió nada.',
  names: { cost: 'coste', limits: 'límites', context: 'contexto', model: 'modelo', repo: 'proyecto + git', duration: 'duración', resets: 'reinicios', lines: 'líneas cambiadas' },
}

const IT: Strings = {
  items: {
    limits: 'Mostrare i limiti di utilizzo? I limiti di 5 ore e 7 giorni in percentuale, con i colori del semaforo (verde fino al 50 %, giallo △ fino al 75 %, rosso ▲ oltre). Solo con abbonamento.',
    resets: 'Mostrare quando i limiti si azzerano? Aggiunge ad es. «resets in 1h59m» dopo ogni limite.',
    context: 'Mostrare quanto è pieno il contesto? Ad es. «context 38%», con i colori del semaforo. Quando è pieno, Claude Code deve riassumere la conversazione.',
    model: 'Mostrare il modello? Ad es. «Opus 5.5».',
    repo: 'Mostrare il progetto e il branch git? Ad es. «mio-progetto · main ✗» (✗ = modifiche non committate). Per questo Tokenomics esegue localmente tre comandi git di sola lettura; con No, nessuno.',
    lines: 'Mostrare le righe modificate? Ad es. «+120 / −30 lines»: righe aggiunte e rimosse dall’ultimo commit. L’elenco per file: /tokenomics-changes.',
    duration: 'Mostrare la durata della sessione? Ad es. «1h30m» dall’inizio.',
  },
  yes: 'Sì',
  no: 'No',
  s3:
    'Mostrare il costo anche in un’altra valuta? Il dollaro resta sempre. ' +
    'Nel passo successivo scegli il cambio: uno fisso che scrivi tu, o il cambio BCE giornaliero (facoltativo). ' +
    'Scegline una o scrivi un altro codice (es. JPY) in Other.',
  s3usd: 'Solo USD',
  s4: cur =>
    `Cambio per ${cur}: scaricare ogni giorno il tasso di riferimento della Banca centrale europea (facoltativo: una piccola richiesta Internet al giorno a ecb.europa.eu, nulla su di te viene inviato), o scrivere un cambio fisso in Other (es. 0.92).`,
  s4o: ['Salta, solo USD', 'Lo scrivo in Other'],
  s4live: 'Cambio BCE giornaliero (Internet)',
  ecbDaily: 'cambio BCE giornaliero',
  done: 'Tokenomics è configurato.',
  detail: 'Livello',
  shows: 'Mostra',
  currency: 'Valuta',
  usdOnly: 'solo USD',
  outro: 'Modificabile in ogni momento con /tokenomics-setup. /tokenomics-explain spiega il costo.',
  cancelled: 'Configurazione annullata. Nulla è stato modificato.',
  names: { cost: 'costo', limits: 'limiti', context: 'contesto', model: 'modello', repo: 'progetto + git', duration: 'durata', resets: 'azzeramenti', lines: 'righe modificate' },
}

const PL: Strings = {
  items: {
    limits: 'Pokazywać limity użycia? Limity 5-godzinny i 7-dniowy w procentach, w kolorach sygnalizacji (zielony do 50 %, żółty △ do 75 %, czerwony ▲ powyżej). Tylko z subskrypcją.',
    resets: 'Pokazywać, kiedy limity się resetują? Dodaje np. „resets in 1h59m” za każdym limitem.',
    context: 'Pokazywać zapełnienie okna kontekstu? Np. „context 38%”, w kolorach sygnalizacji. Gdy jest pełne, Claude Code musi streścić rozmowę.',
    model: 'Pokazywać model? Np. „Opus 5.5”.',
    repo: 'Pokazywać projekt i gałąź git? Np. „moj-projekt · main ✗” (✗ = niezatwierdzone zmiany). Tokenomics uruchamia w tym celu lokalnie trzy polecenia git tylko do odczytu; przy Nie żadnego.',
    lines: 'Pokazywać zmienione linie? Np. „+120 / −30 lines”: linie dodane i usunięte od ostatniego commita. Lista dla każdego pliku: /tokenomics-changes.',
    duration: 'Pokazywać czas sesji? Np. „1h30m” od jej rozpoczęcia.',
  },
  yes: 'Tak',
  no: 'Nie',
  s3:
    'Pokazać koszt także w drugiej walucie? Dolar zostaje zawsze. ' +
    'W następnym kroku wybierasz kurs: stały, który wpisujesz, albo dzienny kurs EBC (opcjonalnie). ' +
    'Wybierz jedną lub wpisz inny kod (np. JPY) w Other.',
  s3usd: 'Tylko USD',
  s4: cur =>
    `Kurs dla ${cur}: codziennie pobierać kurs referencyjny Europejskiego Banku Centralnego (opcjonalnie: jedno małe zapytanie dziennie do ecb.europa.eu, nic o Tobie nie jest wysyłane) albo wpisać stały kurs w Other (np. 4.05).`,
  s4o: ['Pomiń, tylko USD', 'Wpiszę go w Other'],
  s4live: 'Dzienny kurs EBC (internet)',
  ecbDaily: 'dzienny kurs EBC',
  done: 'Tokenomics jest skonfigurowany.',
  detail: 'Poziom',
  shows: 'Pokazuje',
  currency: 'Waluta',
  usdOnly: 'tylko USD',
  outro: 'Zmień w każdej chwili przez /tokenomics-setup. /tokenomics-explain wyjaśnia koszt.',
  cancelled: 'Konfiguracja przerwana. Nic nie zostało zmienione.',
  names: { cost: 'koszt', limits: 'limity', context: 'kontekst', model: 'model', repo: 'projekt + git', duration: 'czas sesji', resets: 'czas resetu', lines: 'zmienione linie' },
}

const NL: Strings = {
  items: {
    limits: 'Je gebruikslimieten tonen? De limieten van 5 uur en 7 dagen in procenten, in stoplichtkleuren (groen tot 50 %, geel △ tot 75 %, rood ▲ daarboven). Alleen met een abonnement.',
    resets: 'Tonen wanneer de limieten resetten? Voegt bijv. "resets in 1h59m" toe achter elke limiet.',
    context: 'Tonen hoe vol het contextvenster is? Bijv. "context 38%", in stoplichtkleuren. Als het vol is, moet Claude Code het gesprek samenvatten.',
    model: 'Het model tonen? Bijv. "Opus 5.5".',
    repo: 'Project en git-branch tonen? Bijv. "mijn-project · main ✗" (✗ = niet-gecommitte wijzigingen). Tokenomics voert daarvoor lokaal drie alleen-lezen git-commando’s uit; bij Nee geen enkele.',
    lines: 'Gewijzigde regels tonen? Bijv. "+120 / −30 lines": toegevoegde en verwijderde regels sinds de laatste commit. De lijst per bestand: /tokenomics-changes.',
    duration: 'De sessieduur tonen? Bijv. "1h30m" sinds de start.',
  },
  yes: 'Ja',
  no: 'Nee',
  s3:
    'Kosten ook in een tweede valuta tonen? De dollar blijft altijd. ' +
    'In de volgende stap kies je de koers: een vaste die je typt, of de dagelijkse ECB-koers (optioneel). ' +
    'Kies er een of typ een andere code (bijv. JPY) onder Other.',
  s3usd: 'Alleen USD',
  s4: cur =>
    `Koers voor ${cur}: dagelijks de referentiekoers van de Europese Centrale Bank ophalen (optioneel: één klein internetverzoek per dag naar ecb.europa.eu, er wordt niets over jou verstuurd), of typ een vaste koers onder Other (bijv. 0.92).`,
  s4o: ['Overslaan, alleen USD', 'Ik typ hem onder Other'],
  s4live: 'Dagelijkse ECB-koers (internet)',
  ecbDaily: 'dagelijkse ECB-koers',
  done: 'Tokenomics is ingesteld.',
  detail: 'Niveau',
  shows: 'Toont',
  currency: 'Valuta',
  usdOnly: 'alleen USD',
  outro: 'Altijd te wijzigen met /tokenomics-setup. /tokenomics-explain legt de kosten uit.',
  cancelled: 'Instellen geannuleerd. Er is niets gewijzigd.',
  names: { cost: 'kosten', limits: 'limieten', context: 'context', model: 'model', repo: 'project + git', duration: 'sessieduur', resets: 'resettijden', lines: 'gewijzigde regels' },
}

const PT: Strings = {
  items: {
    limits: 'Mostrar seus limites de uso? Os limites de 5 horas e 7 dias em porcentagem, nas cores de semáforo (verde até 50 %, amarelo △ até 75 %, vermelho ▲ acima). Só com assinatura.',
    resets: 'Mostrar quando os limites reiniciam? Adiciona por ex. "resets in 1h59m" após cada limite.',
    context: 'Mostrar quão cheio está o contexto? Por ex. "context 38%", nas cores de semáforo. Quando enche, o Claude Code precisa resumir a conversa.',
    model: 'Mostrar o modelo? Por ex. "Opus 5.5".',
    repo: 'Mostrar o projeto e a branch git? Por ex. "meu-projeto · main ✗" (✗ = alterações sem commit). Para isso o Tokenomics executa localmente três comandos git somente leitura; com Não, nenhum.',
    lines: 'Mostrar as linhas alteradas? Por ex. "+120 / −30 lines": linhas adicionadas e removidas desde o último commit. A lista por arquivo: /tokenomics-changes.',
    duration: 'Mostrar a duração da sessão? Por ex. "1h30m" desde o início.',
  },
  yes: 'Sim',
  no: 'Não',
  s3:
    'Mostrar o custo também em outra moeda? O dólar fica sempre. ' +
    'No próximo passo você escolhe a taxa: uma fixa que você digita ou a taxa diária do BCE (opcional). ' +
    'Escolha uma ou digite outro código (ex. JPY) em Other.',
  s3usd: 'Só USD',
  s4: cur =>
    `Taxa para ${cur}: buscar todo dia a taxa de referência do Banco Central Europeu (opcional: uma pequena requisição à internet por dia para ecb.europa.eu, nada sobre você é enviado), ou digitar uma taxa fixa em Other (ex. 0.92).`,
  s4o: ['Pular, só USD', 'Vou digitar em Other'],
  s4live: 'Taxa diária do BCE (internet)',
  ecbDaily: 'taxa diária do BCE',
  done: 'Tokenomics está configurado.',
  detail: 'Nível',
  shows: 'Mostra',
  currency: 'Moeda',
  usdOnly: 'só USD',
  outro: 'Altere quando quiser com /tokenomics-setup. /tokenomics-explain explica o custo.',
  cancelled: 'Configuração cancelada. Nada foi alterado.',
  names: { cost: 'custo', limits: 'limites', context: 'contexto', model: 'modelo', repo: 'projeto + git', duration: 'duração', resets: 'reinícios', lines: 'linhas alteradas' },
}

export const LANGS: Lang[] = [
  { code: 'en', endonym: 'English', aliases: ['english', 'englisch', 'en', 'eng', 'anglais', 'inglés', 'ingles', 'inglese', 'angielski', 'engels', 'inglês'], stop: ['the', 'and', 'is', 'you', 'it', 'to', 'of', 'that', 'this', 'what', 'please', 'with', 'can', 'not'], t: EN },
  { code: 'de', endonym: 'Deutsch', aliases: ['deutsch', 'german', 'de', 'ger', 'allemand', 'alemán', 'aleman', 'tedesco', 'niemiecki', 'duits', 'alemão'], stop: ['und', 'ist', 'nicht', 'das', 'die', 'der', 'ich', 'du', 'es', 'ein', 'eine', 'mit', 'auch', 'aber', 'bitte', 'noch', 'wie', 'wenn', 'dann', 'oder', 'mal', 'jetzt'], t: DE },
  { code: 'fr', endonym: 'Français', aliases: ['français', 'francais', 'french', 'französisch', 'fr', 'francés', 'frances', 'francese', 'francuski', 'frans', 'francês'], stop: ['le', 'la', 'les', 'est', 'et', 'je', 'vous', 'pas', 'une', 'des', 'que', 'pour', 'avec', 'mais', 'merci', "c'est"], t: FR },
  { code: 'es', endonym: 'Español', aliases: ['español', 'espanol', 'spanish', 'spanisch', 'es', 'castellano', 'espagnol', 'spagnolo', 'hiszpański', 'spaans', 'espanhol'], stop: ['el', 'los', 'las', 'es', 'y', 'que', 'por', 'con', 'una', 'pero', 'gracias', 'para', 'muy', 'está', 'esto'], t: ES },
  { code: 'it', endonym: 'Italiano', aliases: ['italiano', 'italian', 'italienisch', 'it', 'italien', 'włoski', 'italiaans'], stop: ['il', 'lo', 'gli', 'è', 'e', 'che', 'non', 'per', 'una', 'con', 'ma', 'grazie', 'sono', 'questo', 'anche'], t: IT },
  { code: 'pl', endonym: 'Polski', aliases: ['polski', 'polish', 'polnisch', 'pl', 'polonais', 'polaco', 'polacco', 'pools', 'polonês'], stop: ['i', 'nie', 'jest', 'to', 'się', 'na', 'że', 'w', 'z', 'jak', 'ale', 'dziękuję', 'proszę', 'czy', 'tak'], t: PL },
  { code: 'nl', endonym: 'Nederlands', aliases: ['nederlands', 'dutch', 'niederländisch', 'holländisch', 'nl', 'néerlandais', 'neerlandés', 'olandese', 'niderlandzki', 'holandês', 'vlaams'], stop: ['de', 'het', 'een', 'en', 'is', 'niet', 'ik', 'je', 'dat', 'van', 'maar', 'ook', 'wel', 'dank', 'graag'], t: NL },
  { code: 'pt', endonym: 'Português', aliases: ['português', 'portugues', 'portuguese', 'portugiesisch', 'pt', 'portugais', 'portugués', 'portoghese', 'portugalski', 'portugees', 'brasileiro'], stop: ['o', 'os', 'as', 'é', 'e', 'que', 'não', 'para', 'com', 'uma', 'mas', 'obrigado', 'você', 'isso', 'muito'], t: PT },
]

export const ENGLISH = LANGS[0]

export function byCode(code: string | undefined): Lang {
  return LANGS.find(l => l.code === code) ?? ENGLISH
}

/** "Deutsch", "german", " GERMAN ", "Deutsch (detected)" -> the language; null if unknown. */
export function parseLanguage(input: string): Lang | null {
  const s = input.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^\p{L}' -]/gu, ' ').trim()
  if (!s) return null
  for (const l of LANGS) if (l.aliases.includes(s)) return l
  for (const word of s.split(/\s+/)) for (const l of LANGS) if (l.aliases.includes(word)) return l
  return null
}

/** Guess the language of earlier messages by frequent words; null when unsure. */
export function detectLanguage(texts: readonly string[]): Lang | null {
  const words = texts.join(' ').toLowerCase().match(/[\p{L}']+/gu) ?? []
  if (words.length < 3) return null
  let best: Lang | null = null
  let bestScore = 0
  for (const l of LANGS) {
    const set = new Set(l.stop)
    let score = 0
    for (const w of words) if (set.has(w)) score++
    if (score > bestScore) {
      bestScore = score
      best = l
    }
  }
  return bestScore >= 2 ? best : null
}
