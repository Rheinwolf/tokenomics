// The /tokenomics-explain text in every setup language. The command list stays the same in all of them.

export const VERSION = '0.4.2'

const COMMANDS = [
  '  /tokenomics-setup     step-by-step setup',
  '  /tokenomics           compact > normal > full',
  '  /tokenomics-explain   this text',
  '  /tokenomics-reset     back to defaults',
]

const TEXTS: Record<string, { title: string; body: string[]; commands: string }> = {
  en: {
    title: 'how the cost figure works',
    body: [
      '- "API cost this session": you pay per token (API billing). The figure is a',
      '  client-side estimate at list prices; your invoice is the final authority.',
      '- "API value this session · covered by subscription": you are on a plan',
      '  (detected because 5h/7d limit data is present). The figure is what this',
      '  session would cost at API list prices. It is NOT billed, your plan price is',
      '  not subtracted, and it covers this session only, so it is not a "saving".',
      '- A trailing * means a model without a known price was counted at another model’s rates.',
      '- Colours: up to 50 % green, up to 75 % yellow (△), above red (▲).',
      '- The second currency (if set) uses your fixed rate; no live rates are fetched.',
      '  Tokenomics only reads local session data and sends nothing.',
    ],
    commands: 'Commands:',
  },
  de: {
    title: 'so funktioniert die Kosten-Anzeige',
    body: [
      '- „API cost this session“: Du zahlst pro Token (API-Abrechnung). Der Wert ist',
      '  eine Schätzung nach Listenpreis; maßgeblich ist deine Rechnung.',
      '- „API value this session · covered by subscription“: Du hast ein Abo',
      '  (erkannt an den 5h/7d-Kontingenten). Der Wert zeigt, was diese Sitzung zum',
      '  API-Listenpreis kosten würde. Er wird NICHT berechnet, dein Abo-Preis ist',
      '  nicht abgezogen, und er gilt nur für diese Sitzung – also keine „Ersparnis“.',
      '- Ein * am Ende heißt: Ein Modell ohne bekannten Preis wurde mit den Preisen eines anderen gezählt.',
      '- Farben: bis 50 % grün, bis 75 % gelb (△), darüber rot (▲).',
      '- Die zweite Währung (falls gewählt) nutzt deinen festen Kurs; nichts wird aus dem Internet geladen.',
      '  Tokenomics liest nur lokale Sitzungsdaten und sendet nichts.',
    ],
    commands: 'Befehle:',
  },
  fr: {
    title: 'comment fonctionne le coût affiché',
    body: [
      '- « API cost this session » : vous payez au token (facturation API). Le montant',
      '  est une estimation au prix catalogue ; seule votre facture fait foi.',
      '- « API value this session · covered by subscription » : vous avez un abonnement',
      '  (détecté grâce aux limites 5h/7j). Le montant indique ce que coûterait cette',
      '  session au prix catalogue de l’API. Il n’est PAS facturé, le prix de votre',
      '  abonnement n’est pas déduit et il ne concerne que cette session : ce n’est pas une « économie ».',
      '- Un * final signifie qu’un modèle sans prix connu a été compté au tarif d’un autre.',
      '- Couleurs : jusqu’à 50 % vert, jusqu’à 75 % jaune (△), au-delà rouge (▲).',
      '- La deuxième devise (si choisie) utilise votre taux fixe ; rien n’est chargé depuis Internet.',
      '  Tokenomics lit uniquement les données locales de la session et n’envoie rien.',
    ],
    commands: 'Commandes :',
  },
  es: {
    title: 'cómo funciona la cifra de coste',
    body: [
      '- «API cost this session»: pagas por token (facturación API). La cifra es una',
      '  estimación a precio de lista; tu factura es la referencia final.',
      '- «API value this session · covered by subscription»: tienes una suscripción',
      '  (detectada por los límites de 5h/7d). La cifra es lo que costaría esta sesión',
      '  a precio de lista de la API. NO se cobra, el precio de tu plan no se resta y',
      '  solo cubre esta sesión, así que no es un «ahorro».',
      '- Un * al final significa que un modelo sin precio conocido se contó con las tarifas de otro.',
      '- Colores: hasta 50 % verde, hasta 75 % amarillo (△), por encima rojo (▲).',
      '- La segunda moneda (si la eliges) usa tu tipo fijo; no se descarga nada de Internet.',
      '  Tokenomics solo lee datos locales de la sesión y no envía nada.',
    ],
    commands: 'Comandos:',
  },
  it: {
    title: 'come funziona la cifra del costo',
    body: [
      '- «API cost this session»: paghi a token (fatturazione API). La cifra è una',
      '  stima a prezzo di listino; fa fede la tua fattura.',
      '- «API value this session · covered by subscription»: hai un abbonamento',
      '  (riconosciuto dai limiti 5h/7g). La cifra è quanto costerebbe questa sessione',
      '  a prezzo di listino API. NON viene addebitata, il prezzo dell’abbonamento non',
      '  è sottratto e vale solo per questa sessione: non è un «risparmio».',
      '- Un * finale significa che un modello senza prezzo noto è stato contato con le tariffe di un altro.',
      '- Colori: fino al 50 % verde, fino al 75 % giallo (△), oltre rosso (▲).',
      '- La seconda valuta (se scelta) usa il tuo cambio fisso; nulla viene scaricato da Internet.',
      '  Tokenomics legge solo dati locali della sessione e non invia nulla.',
    ],
    commands: 'Comandi:',
  },
  pl: {
    title: 'jak działa wyświetlany koszt',
    body: [
      '- „API cost this session”: płacisz za tokeny (rozliczenie API). Kwota to',
      '  szacunek według cennika; wiążąca jest Twoja faktura.',
      '- „API value this session · covered by subscription”: masz subskrypcję',
      '  (rozpoznaną po limitach 5h/7d). Kwota pokazuje, ile ta sesja kosztowałaby',
      '  według cennika API. NIE jest naliczana, cena planu nie jest odejmowana i',
      '  dotyczy tylko tej sesji – to nie jest „oszczędność”.',
      '- Gwiazdka * na końcu oznacza, że model bez znanej ceny policzono według stawek innego.',
      '- Kolory: do 50 % zielony, do 75 % żółty (△), powyżej czerwony (▲).',
      '- Druga waluta (jeśli wybrana) używa Twojego stałego kursu; nic nie jest pobierane z internetu.',
      '  Tokenomics czyta tylko lokalne dane sesji i niczego nie wysyła.',
    ],
    commands: 'Polecenia:',
  },
  nl: {
    title: 'zo werkt het kostenbedrag',
    body: [
      '- "API cost this session": je betaalt per token (API-facturering). Het bedrag',
      '  is een schatting tegen catalogusprijs; je factuur is leidend.',
      '- "API value this session · covered by subscription": je hebt een abonnement',
      '  (herkend aan de 5u/7d-limieten). Het bedrag is wat deze sessie zou kosten',
      '  tegen API-catalogusprijs. Het wordt NIET gefactureerd, je abonnementsprijs is',
      '  niet afgetrokken en het geldt alleen voor deze sessie, dus geen "besparing".',
      '- Een * aan het eind betekent dat een model zonder bekende prijs tegen de tarieven van een ander is geteld.',
      '- Kleuren: tot 50 % groen, tot 75 % geel (△), daarboven rood (▲).',
      '- De tweede valuta (indien gekozen) gebruikt jouw vaste koers; er wordt niets van internet geladen.',
      '  Tokenomics leest alleen lokale sessiegegevens en verstuurt niets.',
    ],
    commands: 'Commando’s:',
  },
  pt: {
    title: 'como funciona o valor de custo',
    body: [
      '- "API cost this session": você paga por token (cobrança da API). O valor é uma',
      '  estimativa pelo preço de tabela; sua fatura é a referência final.',
      '- "API value this session · covered by subscription": você tem uma assinatura',
      '  (detectada pelos limites de 5h/7d). O valor é quanto esta sessão custaria',
      '  pelo preço de tabela da API. NÃO é cobrado, o preço do plano não é descontado',
      '  e vale só para esta sessão, então não é uma "economia".',
      '- Um * no final significa que um modelo sem preço conhecido foi contado com as tarifas de outro.',
      '- Cores: até 50 % verde, até 75 % amarelo (△), acima vermelho (▲).',
      '- A segunda moeda (se escolhida) usa sua taxa fixa; nada é baixado da internet.',
      '  Tokenomics só lê dados locais da sessão e não envia nada.',
    ],
    commands: 'Comandos:',
  },
}

/** The explain text in the given language, English when there is none. */
export function explainText(code: string): string {
  const t = TEXTS[code] ?? TEXTS.en
  return [`Tokenomics ${VERSION}: ${t.title}`, '', ...t.body, '', t.commands, ...COMMANDS].join('\n')
}

export const EXPLAIN_LANGS = Object.keys(TEXTS)
