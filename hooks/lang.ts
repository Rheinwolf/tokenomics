// Setup languages: detection, name parsing and the setup texts.
// Pure module, no engine access. Add a language by adding one entry to LANGS.

export type Strings = {
  s1: string
  s1o: [string, string, string] // normal, compact, full
  s2: string
  s2o: [string, string, string, string] // limits, context+model, project+git, session time
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
  names: Record<'cost' | 'limits' | 'context' | 'model' | 'repo' | 'duration', string>
}

export type Lang = {
  code: string
  endonym: string // shown as the pre-selected option
  aliases: string[] // accepted spellings, lower case, endonym and English name included
  stop: string[] // frequent words for detection
  t: Strings
}

const EN: Strings = {
  s1:
    'Step 1/4 - How much should the bar show? Compact: cost, limits and context only, no reset times. ' +
    'Normal: adds reset times, model, project + git branch, changed lines (+/-) and session time. ' +
    'Full: also shows the exchange rate used.',
  s1o: ['Normal (recommended)', 'Compact', 'Full'],
  s2:
    'Step 2/4 - Which extras should be visible? The cost figure always shows. ' +
    'Limits = 5h/7d usage (subscriptions only). Context = how full the context window is, plus the model. ' +
    'Project = folder name, git branch and ✗ for uncommitted changes.',
  s2o: ['Limits (5h / 7d)', 'Context + model', 'Project + git', 'Session time'],
  s3:
    'Step 3/4 - Show the cost in a second currency as well? Dollars always stay. ' +
    'In the next step you choose the rate: a fixed one you type, or the daily ECB rate (opt-in). ' +
    'Pick one, or type another code (e.g. JPY) under Other.',
  s3usd: 'USD only',
  s4: cur =>
    `Step 4/4 - Rate for ${cur}: fetch the daily reference rate of the European Central Bank (opt-in: one small internet request per day to ecb.europa.eu, nothing about you is sent), or type a fixed rate under Other (e.g. 0.92).`,
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
  names: { cost: 'cost', limits: 'limits', context: 'context', model: 'model', repo: 'project + git', duration: 'session time' },
}

const DE: Strings = {
  s1:
    'Schritt 1/4 - Wie viel soll die Leiste zeigen? Compact: nur Kosten, Kontingente und Kontext, ohne Reset-Zeiten. ' +
    'Normal: zusätzlich Reset-Zeiten, Modell, Projekt + Git-Zweig, geänderte Zeilen (+/-) und Sitzungsdauer. ' +
    'Full: zeigt außerdem den verwendeten Wechselkurs.',
  s1o: ['Normal (empfohlen)', 'Compact', 'Full'],
  s2:
    'Schritt 2/4 - Welche Extras sollen sichtbar sein? Die Kosten stehen immer drin. ' +
    'Kontingente = 5h/7d-Verbrauch (nur mit Abo). Kontext = wie voll das Kontextfenster ist, dazu das Modell. ' +
    'Projekt = Ordnername, Git-Zweig und ✗ bei ungespeicherten Änderungen.',
  s2o: ['Kontingente (5h / 7d)', 'Kontext + Modell', 'Projekt + Git', 'Sitzungsdauer'],
  s3:
    'Schritt 3/4 - Kosten zusätzlich in einer zweiten Währung zeigen? Dollar bleibt immer. ' +
    'Im nächsten Schritt wählst du den Kurs: einen festen, den du eintippst, oder den täglichen EZB-Kurs (freiwillig). ' +
    'Eine auswählen oder unter Other einen anderen Code eintippen (z. B. JPY).',
  s3usd: 'Nur USD',
  s4: cur =>
    `Schritt 4/4 - Kurs für ${cur}: täglich den Referenzkurs der Europäischen Zentralbank holen (freiwillig: eine kleine Internet-Anfrage pro Tag an ecb.europa.eu, es wird nichts über dich gesendet), oder unter Other einen festen Kurs eintippen (z. B. 0.92).`,
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
  names: { cost: 'Kosten', limits: 'Kontingente', context: 'Kontext', model: 'Modell', repo: 'Projekt + Git', duration: 'Sitzungsdauer' },
}

const FR: Strings = {
  s1:
    'Étape 1/4 - Que doit afficher la barre ? Compact : coût, limites et contexte, sans heures de réinitialisation. ' +
    'Normal : ajoute les réinitialisations, le modèle, le projet + branche git, les lignes modifiées (+/-) et la durée de session. ' +
    'Full : affiche aussi le taux de change utilisé.',
  s1o: ['Normal (recommandé)', 'Compact', 'Full'],
  s2:
    'Étape 2/4 - Quels éléments afficher ? Le coût est toujours affiché. ' +
    'Limites = utilisation 5h/7j (abonnement uniquement). Contexte = remplissage de la fenêtre de contexte, plus le modèle. ' +
    'Projet = nom du dossier, branche git et ✗ si modifications non commitées.',
  s2o: ['Limites (5h / 7j)', 'Contexte + modèle', 'Projet + git', 'Durée de session'],
  s3:
    'Étape 3/4 - Afficher aussi le coût dans une autre devise ? Le dollar reste toujours. ' +
    'À l’étape suivante, vous choisissez le taux : un taux fixe que vous tapez, ou le taux BCE quotidien (facultatif). ' +
    'Choisissez-en une ou tapez un autre code (ex. JPY) sous Other.',
  s3usd: 'USD seulement',
  s4: cur =>
    `Étape 4/4 - Taux pour ${cur} : récupérer chaque jour le taux de référence de la Banque centrale européenne (facultatif : une petite requête Internet par jour vers ecb.europa.eu, rien sur vous n’est envoyé), ou taper un taux fixe sous Other (ex. 0.92).`,
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
  names: { cost: 'coût', limits: 'limites', context: 'contexte', model: 'modèle', repo: 'projet + git', duration: 'durée' },
}

const ES: Strings = {
  s1:
    'Paso 1/4 - ¿Cuánto debe mostrar la barra? Compact: solo coste, límites y contexto, sin horas de reinicio. ' +
    'Normal: añade reinicios, modelo, proyecto + rama git, líneas cambiadas (+/-) y duración de la sesión. ' +
    'Full: muestra también el tipo de cambio usado.',
  s1o: ['Normal (recomendado)', 'Compact', 'Full'],
  s2:
    'Paso 2/4 - ¿Qué extras deben verse? El coste siempre se muestra. ' +
    'Límites = uso de 5h/7d (solo con suscripción). Contexto = lo lleno que está el contexto, más el modelo. ' +
    'Proyecto = nombre de la carpeta, rama git y ✗ si hay cambios sin commit.',
  s2o: ['Límites (5h / 7d)', 'Contexto + modelo', 'Proyecto + git', 'Duración'],
  s3:
    'Paso 3/4 - ¿Mostrar también el coste en otra moneda? El dólar siempre se queda. ' +
    'En el siguiente paso eliges el tipo: uno fijo que escribes o el tipo diario del BCE (opcional). ' +
    'Elige una o escribe otro código (p. ej. JPY) en Other.',
  s3usd: 'Solo USD',
  s4: cur =>
    `Paso 4/4 - Tipo para ${cur}: obtener cada día el tipo de referencia del Banco Central Europeo (opcional: una pequeña petición a Internet al día a ecb.europa.eu, no se envía nada sobre ti), o escribir un tipo fijo en Other (p. ej. 0.92).`,
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
  names: { cost: 'coste', limits: 'límites', context: 'contexto', model: 'modelo', repo: 'proyecto + git', duration: 'duración' },
}

const IT: Strings = {
  s1:
    'Passo 1/4 - Quanto deve mostrare la barra? Compact: solo costo, limiti e contesto, senza orari di reset. ' +
    'Normal: aggiunge reset, modello, progetto + branch git, righe modificate (+/-) e durata della sessione. ' +
    'Full: mostra anche il cambio usato.',
  s1o: ['Normal (consigliato)', 'Compact', 'Full'],
  s2:
    'Passo 2/4 - Quali extra mostrare? Il costo è sempre visibile. ' +
    'Limiti = utilizzo 5h/7g (solo abbonamento). Contesto = quanto è pieno il contesto, più il modello. ' +
    'Progetto = nome cartella, branch git e ✗ per modifiche non committate.',
  s2o: ['Limiti (5h / 7g)', 'Contesto + modello', 'Progetto + git', 'Durata sessione'],
  s3:
    'Passo 3/4 - Mostrare il costo anche in un’altra valuta? Il dollaro resta sempre. ' +
    'Nel passo successivo scegli il cambio: uno fisso che scrivi tu, o il cambio BCE giornaliero (facoltativo). ' +
    'Scegline una o scrivi un altro codice (es. JPY) in Other.',
  s3usd: 'Solo USD',
  s4: cur =>
    `Passo 4/4 - Cambio per ${cur}: scaricare ogni giorno il tasso di riferimento della Banca centrale europea (facoltativo: una piccola richiesta Internet al giorno a ecb.europa.eu, nulla su di te viene inviato), o scrivere un cambio fisso in Other (es. 0.92).`,
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
  names: { cost: 'costo', limits: 'limiti', context: 'contesto', model: 'modello', repo: 'progetto + git', duration: 'durata' },
}

const PL: Strings = {
  s1:
    'Krok 1/4 - Ile ma pokazywać pasek? Compact: tylko koszt, limity i kontekst, bez czasu resetu. ' +
    'Normal: dodaje resety, model, projekt + gałąź git, zmienione linie (+/-) i czas sesji. ' +
    'Full: pokazuje też użyty kurs wymiany.',
  s1o: ['Normal (zalecane)', 'Compact', 'Full'],
  s2:
    'Krok 2/4 - Które dodatki mają być widoczne? Koszt jest zawsze widoczny. ' +
    'Limity = zużycie 5h/7d (tylko z subskrypcją). Kontekst = zapełnienie okna kontekstu, plus model. ' +
    'Projekt = nazwa folderu, gałąź git i ✗ przy niezatwierdzonych zmianach.',
  s2o: ['Limity (5h / 7d)', 'Kontekst + model', 'Projekt + git', 'Czas sesji'],
  s3:
    'Krok 3/4 - Pokazać koszt także w drugiej walucie? Dolar zostaje zawsze. ' +
    'W następnym kroku wybierasz kurs: stały, który wpisujesz, albo dzienny kurs EBC (opcjonalnie). ' +
    'Wybierz jedną lub wpisz inny kod (np. JPY) w Other.',
  s3usd: 'Tylko USD',
  s4: cur =>
    `Krok 4/4 - Kurs dla ${cur}: codziennie pobierać kurs referencyjny Europejskiego Banku Centralnego (opcjonalnie: jedno małe zapytanie dziennie do ecb.europa.eu, nic o Tobie nie jest wysyłane) albo wpisać stały kurs w Other (np. 4.05).`,
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
  names: { cost: 'koszt', limits: 'limity', context: 'kontekst', model: 'model', repo: 'projekt + git', duration: 'czas sesji' },
}

const NL: Strings = {
  s1:
    'Stap 1/4 - Hoeveel moet de balk tonen? Compact: alleen kosten, limieten en context, zonder resettijden. ' +
    'Normal: voegt resettijden, model, project + git-branch, gewijzigde regels (+/-) en sessieduur toe. ' +
    'Full: toont ook de gebruikte wisselkoers.',
  s1o: ['Normal (aanbevolen)', 'Compact', 'Full'],
  s2:
    'Stap 2/4 - Welke extra’s moeten zichtbaar zijn? De kosten staan er altijd. ' +
    'Limieten = 5u/7d-gebruik (alleen abonnement). Context = hoe vol het contextvenster is, plus het model. ' +
    'Project = mapnaam, git-branch en ✗ bij niet-gecommitte wijzigingen.',
  s2o: ['Limieten (5u / 7d)', 'Context + model', 'Project + git', 'Sessieduur'],
  s3:
    'Stap 3/4 - Kosten ook in een tweede valuta tonen? De dollar blijft altijd. ' +
    'In de volgende stap kies je de koers: een vaste die je typt, of de dagelijkse ECB-koers (optioneel). ' +
    'Kies er een of typ een andere code (bijv. JPY) onder Other.',
  s3usd: 'Alleen USD',
  s4: cur =>
    `Stap 4/4 - Koers voor ${cur}: dagelijks de referentiekoers van de Europese Centrale Bank ophalen (optioneel: één klein internetverzoek per dag naar ecb.europa.eu, er wordt niets over jou verstuurd), of typ een vaste koers onder Other (bijv. 0.92).`,
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
  names: { cost: 'kosten', limits: 'limieten', context: 'context', model: 'model', repo: 'project + git', duration: 'sessieduur' },
}

const PT: Strings = {
  s1:
    'Passo 1/4 - Quanto a barra deve mostrar? Compact: só custo, limites e contexto, sem horários de reinício. ' +
    'Normal: adiciona reinícios, modelo, projeto + branch git, linhas alteradas (+/-) e duração da sessão. ' +
    'Full: mostra também a taxa de câmbio usada.',
  s1o: ['Normal (recomendado)', 'Compact', 'Full'],
  s2:
    'Passo 2/4 - Quais extras devem aparecer? O custo aparece sempre. ' +
    'Limites = uso 5h/7d (só com assinatura). Contexto = quão cheio está o contexto, mais o modelo. ' +
    'Projeto = nome da pasta, branch git e ✗ para alterações sem commit.',
  s2o: ['Limites (5h / 7d)', 'Contexto + modelo', 'Projeto + git', 'Duração da sessão'],
  s3:
    'Passo 3/4 - Mostrar o custo também em outra moeda? O dólar fica sempre. ' +
    'No próximo passo você escolhe a taxa: uma fixa que você digita ou a taxa diária do BCE (opcional). ' +
    'Escolha uma ou digite outro código (ex. JPY) em Other.',
  s3usd: 'Só USD',
  s4: cur =>
    `Passo 4/4 - Taxa para ${cur}: buscar todo dia a taxa de referência do Banco Central Europeu (opcional: uma pequena requisição à internet por dia para ecb.europa.eu, nada sobre você é enviado), ou digitar uma taxa fixa em Other (ex. 0.92).`,
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
  names: { cost: 'custo', limits: 'limites', context: 'contexto', model: 'modelo', repo: 'projeto + git', duration: 'duração' },
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
