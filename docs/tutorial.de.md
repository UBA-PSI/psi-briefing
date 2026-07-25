# Bau dein erstes Deck in 15 Minuten

*browserslides – ein Framework ohne Abhängigkeiten für in sich geschlossene 16:9-Foliendecks als HTML. [MIT-lizenziert](https://opensource.org/license/mit) (Fonts ausgenommen).*

Diese Anleitung bringt dich von einer leeren Datei zu einer echten Präsentation: eine Titelfolie, eine Inhaltsfolie mit lebendigen Komponenten und ein Balkendiagramm, das direkt im Browser gezeichnet wird. Am Ende weißt du genug, um dein eigenes Deck zu bauen und weiterzugeben.

## Was du baust

Ein kurzes Deck, das direkt aus dem Dateisystem aufgeht – Doppelklick genügt, oder du lieferst es über einen statischen Server aus. Kein `npm install`, kein Bundler, kein Build-Schritt, keine Framework-Laufzeit. Nur drei Dateien, die du zusammenklickst: das Kern-CSS, ein Theme und ein kleines Skript.

### Die Grundidee

Jede Folie ist eine **16:9-Box**. Die Box nutzt CSS-`container-type: size` – das heißt, alles darin wird in *Container-Query-Einheiten* gemessen: `cqw` (1 % der Folienbreite) und `cqh` (1 % der Folienhöhe) statt in Pixeln. Dadurch skaliert das ganze Layout, Überschriftengrößen eingeschlossen, proportional zur Folie.

Der praktische Gewinn: Eine Folie sieht auf einem 13-Zoll-Laptop, einem 4K-Beamer und einem quer gehaltenen Smartphone *identisch* aus. Nichts bricht um, nichts springt. Es ist weniger „pixelgenau" als vielmehr **proportionsgenau** – dasselbe Design, nur größer oder kleiner.

In deinem eigenen Folieninhalt schreibst du fast nie `px`. Greif zu `cqw`/`cqh`, und das Layout folgt der Folie überallhin.

---

## Schritt 1 – Das minimale HTML

Leg eine Datei `mein-deck.html` neben den Ordnern `framework/` und `themes/` an (pass die beiden `href`s an, falls du sie woanders ablegst). Hier ist eine vollständige, lauffähige Startseite – kopier sie unverändert hinein:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mein erstes Deck</title>

<!-- 1) das Framework, dann 2) ein Theme. Die Reihenfolge zählt: Das Theme
     überschreibt nur Tokens, muss also an zweiter Stelle stehen. -->
<link rel="stylesheet" href="framework/browserslides.css">
<link rel="stylesheet" href="themes/bamberg.css">
</head>
<body>

<!-- Eine Folie. Kopier diesen <section>-Block für jede weitere Folie. -->
<section class="frame">
  <div class="slide"><div class="slide-inner">
    <p class="eyebrow">Mein erstes Deck</p>
    <h2>Hallo, browserslides</h2>
    <div class="pagefoot"><span>Mein Deck</span><span class="pagenum"></span></div>
  </div></div>
</section>

<!-- Deck-Chrome: Navigations-Punkte + ein Tastatur-Hinweis. Einmalig, ans Ende. -->
<nav class="dots" aria-label="Folien-Navigation"></nav>
<div class="hint">↓ scrollen · → weiter · Taste drücken</div>

<script src="framework/browserslides.js"></script>
</body>
</html>
```

Öffne die Datei im Browser. Du hast schon eine funktionierende Folie, Navigationspunkte am rechten Rand, Tastatursteuerung und eine Seitenzahl, die sich selbst einträgt.

**Der Aufbau einer Folie** ist immer dieselbe Verschachtelung aus drei Elementen:

```html
<section class="frame">          <!-- eine bildschirmfüllende Bühne, rastet mittig ein -->
  <div class="slide">            <!-- die 16:9-Box; hier werden cqw/cqh zu "% der Folie" -->
    <div class="slide-inner">    <!-- hier lebt dein Inhalt (eine Flex-Spalte) -->
      …
    </div>
  </div>
</section>
```

Ein `<section class="frame">` = eine Folie. Für weitere Folien kopierst du diesen Block. Die `.dots`, der `.hint` und das `<script>` kommen **einmal** ganz ans Ende von `<body>`.

> **Öffnen:** Für alles in dieser Anleitung reicht `file://`. Wenn du später eine Vorschau per Headless-Browser einbaust oder irgendetwas verwendest, das `file://`-URLs nicht mag, starte einen kurzlebigen statischen Server aus dem Deck-Ordner – z. B. `python3 -m http.server 8000` – und ruf `http://localhost:8000/mein-deck.html` auf.

---

## Schritt 2 – Eine Titelfolie

Gib dem Deck einen Auftakt. Eine Titelfolie ist eine normale Folie mit der zusätzlichen Klasse `slide--title` am `.slide`-Element – das Theme färbt sie in der Akzentfarbe und zentriert den Inhalt. Ersetz deinen ersten `<section>` durch diesen hier:

```html
<section class="frame">
  <div class="slide slide--title"><div class="slide-inner">
    <p class="eyebrow">Retrospektive · 2026</p>
    <h1>Ein Portal in elf Wochen live</h1>
    <p class="title-sub">Ein durchgespieltes Beispiel mit browserslides</p>
    <div class="title-strip">
      <div><b>11</b><span>Wochen</span></div>
      <div><b>1&nbsp;280</b><span>Commits</span></div>
      <div><b>1</b><span>HTML-Datei</span></div>
    </div>
    <div class="pagefoot"><span>Mein Deck</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

Was die einzelnen Teile tun:

- `.eyebrow` – der kleine Versal-Vorspann über der Überschrift. Optional, und meist besser weggelassen: auf jeder Folie wird er zur Tapete und kostet jedes Mal eine Zeile Höhe. Nur behalten, wo er etwas sagt, das die Überschrift nicht trägt, etwa eine Schrittnummer in einem langen Ablauf.
- `<h1>` – die große Display-Überschrift. Auf einer Titelfolie steht sie in der Display-Schrift und wird in `cqw` bemessen, läuft also nie über.
- `.title-strip` – eine Reihe kleiner Kennzahl-Blöcke (`<b>` ist die Zahl, `<span>` die Beschriftung). Ideal als „Deck auf einen Blick".

Verwende `&nbsp;` (geschütztes Leerzeichen) innerhalb von Zahlen und kurzen Wendungen, die nicht umbrechen sollen – `1&nbsp;280`, `10&nbsp;Uhr`.

---

## Schritt 3 – Eine Inhaltsfolie mit echten Komponenten

Jetzt eine Datenfolie. Füg sie als neuen `<section>` nach dem Titel ein. Sie zeigt zwei der eingebauten Komponenten – ein **Kennzahlen-Raster** und eine **zweispaltige Timeline** – und führt vor, wie der Folienkörper aufgebaut ist.

```html
<section class="frame">
  <div class="slide"><div class="slide-inner">
        <h2>Plan gegen Wirklichkeit</h2>

    <!-- Kennzahlen-Raster: vier Zellen mit großen Zahlen; die erste ist "Hero". -->
    <div class="facts">
      <div class="fact fact--hero"><b>1&nbsp;280</b><span>Commits im gesamten Projekt</span></div>
      <div class="fact"><b>117</b><span>vergangene Arbeitstage</span></div>
      <div class="fact"><b>34<sup>%</sup></b><span>der Commits vor 10&nbsp;Uhr</span></div>
      <div class="fact"><b>3</b><span>Leute im Kernteam</span></div>
    </div>

    <!-- Zweispaltige Timeline. -->
    <div class="twocol">
      <div>
        <div class="tl-head">Geplant</div>
        <ul class="tl">
          <li><time>Wo 1</time><span>Kickoff &amp; Scope<span class="sub">Eine Seite, im Raum beschlossen</span></span></li>
          <li><time>Wo 3</time><span>Erster Prototyp</span></li>
          <li><time>Wo 11</time><span>Launch</span></li>
        </ul>
      </div>
      <div>
        <div class="tl-head">Wirklichkeit</div>
        <ul class="tl">
          <li><time>Wo 1</time><span>Kickoff, pünktlich</span></li>
          <li><time>Wo 2</time><span>Prototyp früher<span class="sub">Schwung aus einem guten ersten Tag</span></span></li>
          <li><time>Wo 11</time><span>Launch, pünktlich</span></li>
        </ul>
      </div>
    </div>

    <div class="pagefoot"><span>Mein Deck</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

**Wie das Layout funktioniert.** `.slide-inner` ist eine **Flex-Spalte**: Die Kinder stapeln sich von oben nach unten. Komponenten wie `.facts` und `.twocol` tragen `flex: 1` und wachsen so in den Platz zwischen Überschrift und Fußzeile – die Folie wirkt immer ausgewogen, egal was du hineinsetzt. (In der Praxis gehört *eine* Hauptkomponente pro Inhaltsfolie; zwei, wie hier, gehen auf, wenn beide kompakt sind.)

- **`.facts`** – ein Raster aus vier Zellen mit großen Zahlen. `.fact b` ist die Zahl, `.fact span` die Beschriftung. Gib einer Zelle `.fact--hero`, um sie mit der Akzentfarbe zu fluten. `<sup>` verkleinert eine Einheit wie `%`.
- **`.twocol` + `.tl`** – zwei Spalten, jede eine Timeline-Liste. `.tl-head` ist die Spaltenüberschrift; jedes `<li>` ist ein `<time>`-Label plus Text, und ein verschachteltes `<span class="sub">` ergänzt eine leise zweite Zeile.

**Die Fußzeile.** Jede Folie endet mit `.pagefoot` – links eine Beschriftung, rechts die `.pagenum`. Lass `.pagenum` leer: Das Skript trägt für jede Folie automatisch `n / gesamt` ein, du nummerierst nie von Hand.

---

## Schritt 4 – Ein generiertes Balkendiagramm

Diagramme sind keine Bilder – das Skript zeichnet sie zur Laufzeit als SVG, und sie übernehmen die Farben deines Themes. Zwei Teile: ein leerer Container in der Folie und ein Aufruf am Ende der Seite.

Zuerst der Container. Er braucht eine `id`, damit das Skript ihn findet:

```html
<section class="frame" id="slide-chart">
  <div class="slide"><div class="slide-inner">
        <h2>Commits pro Woche, mit Meilensteinen</h2>
    <div class="chartbox" id="chart-wochen"></div>
    <div class="pagefoot"><span>Mein Deck</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

Dann, *nach* `<script src="framework/browserslides.js"></script>`, dein eigener Skriptblock:

```html
<script>
  Browserslides.barChart('#chart-wochen', {
    ariaLabel: 'Commits pro Woche über elf Wochen, mit drei Meilensteinen',
    max: 220,
    gridlines: [0, 55, 110, 165, 220],
    data: [
      { value: 40,  label: 'W1', color: '--accent-60' },
      { value: 95,  label: 'W2', color: '--accent-60' },
      { value: 70,  label: 'W3', color: '--accent-60' },
      { value: 30,  label: 'W4', color: '--muted' },
      { value: 25,  label: 'W5', color: '--muted' },
      { value: 120, label: 'W6' },
      { value: 180, label: 'W7' },
      { value: 205, label: 'W9' },
      { value: 90,  label: 'W11' }
    ],
    markers: [
      { index: 0, label: 'Kickoff',       level: 0, anchor: 'start' },
      { index: 5, label: 'Feature-Freeze', level: 1, anchor: 'start' },
      { index: 8, label: 'Launch',        level: 0, anchor: 'end'   }
    ]
  });
</script>
```

Was die Optionen bedeuten:

- **`data`** – ein Array von Balken. Jeder ist `{ value, label?, color?, tooltip? }`; wenn du nur die Höhe brauchst, tut es auch eine schlichte Zahl.
- **`max`** – der obere Rand der y-Achse. Lässt du es weg, wählt das Diagramm ein sinnvolles rundes Maximum knapp über deinem höchsten Balken.
- **`gridlines`** – die y-Werte, an denen waagrechte Linien und Beschriftungen gezeichnet werden. Weglassen ergibt fünf gleichmäßig verteilte Standardwerte.
- **`markers`** – Meilenstein-Overlays: gestrichelte Linie + Punkt + Label an einem Balken-`index`. `level` staffelt die Labels vertikal, damit sie nicht kollidieren; `anchor` ist `'start'` oder `'end'` für die Seite, auf der der Text sitzt.

**Die Farben kommen gratis aus deinem Theme.** Ohne `color` nutzen die Balken `--accent`. Jedes `color` pro Balken (oder `barColor` fürs ganze Diagramm) akzeptiert entweder eine literale Farbe *oder* einen `"--token"`-Namen – `'--accent-60'`, `'--muted'` – der live aus dem aktiven Theme gelesen wird. Wechselst du das Theme, färbt sich das Diagramm selbst um; du schreibst nie einen Hex-Wert fest ins Diagramm. Es zeichnet sich außerdem bei Größenänderung und nach dem Laden von Web-Fonts neu, bleibt also gestochen scharf.

Weitere nützliche Optionen: `valueLabels: true` schreibt jeden Balkenwert obenauf, `labelEvery: 5` lichtet eine überfüllte x-Achse aus, `yLabels: false` blendet die Zahlenachse aus.

---

## Schritt 5 – Themen setzen

Ein **Theme ist nichts als ein `:root { … }`-Block, der Design-Tokens überschreibt** – Farben und Schriften. Das Framework verankert keine Farben fest; jede Komponente liest Tokens wie `--accent`, `--ink`, `--paper`. Ein ganzes Deck neu einzufärben ist deshalb eine Änderung in einer Zeile.

**Probier sofort einen anderen Look.** Tausch den Theme-`<link>`:

```html
<link rel="stylesheet" href="framework/browserslides.css">
<link rel="stylesheet" href="themes/midnight.css">   <!-- war: themes/bamberg.css -->
```

`midnight.css` dreht auch die Neutraltöne um – `--paper` wird dunkel, `--ink` hell – und weil nichts auf Weiß oder Schwarz festgenagelt ist, wird das gesamte Deck, Diagramme inklusive, mit dunkel.

**Bau dein eigenes Theme.** Kopier `themes/bamberg.css` nach `themes/mein-theme.css` und ändere ein paar Tokens. Das Wesentliche:

```css
:root {
  /* Deine Marken-Akzentfarbe plus eine Tönungsrampe von 80 bis 20.
     Diagramme, Überschriften, Linien und Flächen greifen alle darauf zu. */
  --accent:     #7a2e2e;
  --accent-80:  #97595a;
  --accent-60:  #b18485;
  --accent-40:  #cbafb0;
  --accent-20:  #e5d9da;
  --accent-ink: #ffffff;   /* Text, der auf --accent liegt */

  /* Zwei Schrift-Rollen: eine Display-Schrift für Überschriften,
     eine Body-Schrift für Fließtext. */
  --font-display: "Playfair Display", Georgia, serif;
  --font-body:    "Inter", system-ui, -apple-system, sans-serif;
}
```

Die Tönungsrampe (`--accent-80 … --accent-20`) lohnt es sich sauber zu treffen: Sie ist die Akzentfarbe, schrittweise Richtung Weiß gemischt, und sie gibt Kennzahl-Zellen, Timelines und Diagrammbalken ihre Bandbreite. Wähl fünf gleichmäßig aufhellende Stufen.

**Schriften.** Die Standardschriften des Frameworks sind **Systemschriften** – ein Deck rendert also offline identisch, ohne ein einziges geladenes Byte. Ein Theme darf echte Schriften *benennen* (Bamberg wünscht sich Copse + Open Sans); sind sie nicht verfügbar, fällt der Stack auf die System-Serifen/-Grotesk zurück, und das Deck läuft weiter. Um die echten Schriften mitzuliefern, bettest du sie ein (nächster Schritt).

---

## Schritt 6 – Fürs Teilen in sich geschlossen machen

Während du baust, sind drei verlinkte Dateien praktisch. Um das Deck *jemandem in die Hand zu geben* – per Mail, auf einem USB-Stick, hinter einem Login – willst du **eine HTML-Datei, die offline läuft**, ohne einen Asset-Ordner, den man verlieren kann.

Das Rezept:

1. **CSS einbetten** – füg `browserslides.css` und dein Theme in einen `<style>`-Block im `<head>` ein und ersetz damit die beiden `<link>`s.
2. **JS einbetten** – füg `browserslides.js` in einen `<script>`-Block ein und ersetz damit `<script src=…>`.
3. **Schriften und Bilder als base64 einbetten** – statt eine `.woff2` oder eine `.png` zu verlinken, kodierst du sie und legst sie als `data:`-URI direkt ins CSS/HTML.

Machst du das, hat die Datei null externe Verweise: Sie geht aus `file://` auf, vom Stick, von überall, für immer, ohne Netz.

Von Hand musst du das nicht tun. Der vorgesehene Ort für die Helferskripte ist das **`tools/`**-Verzeichnis:

- **`tools/embed-fonts.mjs`** – kodiert deine `.woff2`-/`.png`-Assets als base64 und bettet sie ein.
- **`tools/inline-deck.mjs`** – faltet das verlinkte CSS und JS ins HTML und erzeugt die einzelne, in sich geschlossene Datei.

Lass diese über dein Arbeits-Deck laufen, um das teilbare Ergebnis zu bekommen, und editier weiter an der verlinkten Fassung.

---

## Schritt 7 – Woran es hängt, ob es gut aussieht

Die Layout-Engine liefert einen skalierenden 16:9-Rahmen. Ob das Ergebnis komponiert oder
hingeworfen wirkt, entscheiden die folgenden Punkte – und genau die gehen zuerst schief.

**Größe.** `--type-scale` in `:root` skaliert alle Fließ- und Label-Größen auf einmal (Display-Größen
bleiben fest, Überschriften brechen also nicht). Folien werden aus einigen Metern Entfernung gelesen –
im Zweifel größer. Passt eine Folie nur in kleinerer Schrift, ist zu viel drauf: teilen statt verkleinern.

**Den Rahmen füllen.** `.cols` streckt sich auf volle Höhe, packt den Inhalt aber nach oben – eine Folie
mit zwei kurzen Panels bleibt halb leer. Das **nicht** durch Strecken der Kästen beheben: ein auf volle
Höhe gezogenes Panel rahmt nur die Leere ein. Mit Inhalt lösen – mehr aus der Quelle holen, oder die
Folie mit einer `.punch`-Zeile schließen, die ihre Kernaussage benennt.

**Vertikale Ausrichtung – drei verschiedene Fragen:**

| Frage | Modifier |
| --- | --- |
| Sitzt die ganze Zeile zu hoch? | `.cols--center` |
| Hängen ungleich lange Spalten oben? | `.cols--middle` |
| Wirkt eine gleich hohe Zelle kopflastig? | `.net--middle` |

**Call-outs.** Ein getöntes `.panel--hl` in einer Textspalte ist um sein eigenes Padding eingerückt.
`.panel--flush` zieht es nach links, sodass sein Text mit der Spalte fluchtet; `.panel--marker` lässt die
Fläche ganz weg und markiert die Stelle mit einem Balken wie von einem Textmarker.

**Typografie.** Text auf getönter Fläche nutzt `--highlight-ink` / `--highlight-ink-em` – fast schwarz,
aber im Farbton des Hintergrunds. Nie Akzentblau auf Gelb. Versalien-Sperrung bei `0.08–0.11em` halten;
darüber liest sich ein Wort nicht mehr als Wort. Halbgeviertstrich `–` verwenden, nie den Geviertstrich.
Deutsche Anführungszeichen sind `„…“`, das schließende ist **nie** ein gerades `"`. Links aus dem Deck
heraus brauchen `target="_blank" rel="noopener"`.

**Nie die Breite einer inhaltsabhängigen Spalte fest verdrahten.** `grid-template-columns: 7cqw 1fr` ist
eine Annahme darüber, wie lang die Labels werden – und zerlegt alles Längere. Stattdessen
`minmax(7cqw, max-content)` mit `subgrid` auf den Zeilen: die Spur passt sich dem längsten Label an und
alle Zeilen bleiben bündig.


## Navigation & Tipps

Sobald das Skript auf der Seite ist, steuert sich das Deck selbst:

- **Bewegen:** `→` `↓` `Leertaste` `Bild ab` gehen vorwärts; `←` `↑` `Bild auf` zurück; `Pos1`/`Ende` springen zur ersten/letzten Folie. Schlichtes Scrollen geht auch, und jede Folie **rastet** mittig ein.
- **Navigationspunkte:** Die `.dots`-Leiste rechts zeigt deine Position und ist anklickbar. Sie wird automatisch aus deinen Folien gebaut – die Zahl der Punkte entspricht immer der Zahl der `.frame`-Sektionen.
- **Seitenzahlen:** Jedes leere `.pagenum` wird beim Laden mit `n / gesamt` gefüllt. Umnummerieren ist nie deine Aufgabe.
- **Reduzierte Bewegung:** Verlangt das Betriebssystem des Betrachters reduzierte Bewegung, springt das Scrollen statt zu animieren, und Übergänge entfallen. Wird automatisch berücksichtigt.
- **Smartphones:** Im Hochformat auf kleinem Display schlägt ein wegklickbarer Hinweis vor, das Gerät zu drehen – das Deck ist fürs Querformat gemacht.

Ein paar Regeln halten alles berechenbar:

- **Ein `<section class="frame">` pro Folie.** Punkte, Seitenzahlen und Tastatur-Navigation zählen alle die `.frame`-Elemente.
- **Editier nie eine im Browser gespeicherte Kopie des Decks als Quelle.** Das Skript *generiert* Diagramme, Punkte und Seitenzahlen beim Laden ins DOM – ein „Seite speichern unter …"-Abzug hat diese Ausgabe fest eingebacken; öffnest du ihn erneut, bekämst du Dubletten. Editier immer die originale Quelldatei.

---

## Wie es weitergeht

Du hast eine Handvoll Komponenten benutzt; es gibt viele mehr – Bildergalerien, annotierte Screenshots, Prozess-Schritte, Vorher/Nachher-Deltas, Chat-Blasen, Kapitel-Trenner, Dokument-Attrappen, aufklappbare Detail-Ebenen, Querverweis-Vorschauen und weiteres.

Alle sind, mit Copy-&-Paste-Markup, im **[`docs/cookbook.md`](cookbook.md)** katalogisiert. Die Datei **[`examples/example-deck.html`](../examples/example-deck.html)** ist ein vollständiges Deck, das die meisten davon vorführt – lies ihren Quelltext parallel zum Kochbuch.

Viel Freude beim Bauen.
