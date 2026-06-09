# Review 007 — "Jouw activiteiten" restructure + dual AI-generation routes

**Date:** 2026-06-09
**Scope:** Panel review of a proposed menu restructure. *"Verras me"* stays the home screen and primary entry. Other *ontdekkingsroutes* become less prominent (possible future setting to toggle them on/off). *"Jouw activiteiten"* gets three buttons: add-your-own, your-list (with edit/delete), and *"Verzin activiteiten voor me"* — which itself splits into two AI-generation routes that the user chooses between:
- A **chat route** (variation on the old *"chat met me"*): AI asks a handful of questions and generates activities for use right now. Intended for the moment the user struggles to switch off.
- A **list-based route**: AI looks at the activities the user has added and the ones they've picked most, then proposes three activities to optionally add to the list. Intended for relaxed moments, alongside self-adding.

Working button labels under consideration: *"ik heb nu iets nodig"* vs. *"laten we activiteiten maken"*.

**Reviewed by:** Three personas (Eline, Fatima, Jeroen) and all three expert lenses (giftedness, neurodivergence, average/below-average cognitive profile). The personas were selected for coverage of the design's stress points: Eline for the gifted-ND, ideation-freeze archetype the dual-route split targets; Fatima for the ND-burnout, low-energy floor; Jeroen for alexithymia and the chat-route's interoceptive ask.

**Questions asked:**
1. Initial reaction.
2. Would they still be using the app after a while?

---

## Headline

**The split between "now" and "relaxed" is a real improvement; the button labels and the chat-route's input modality are the make-or-break details.**

The dual-route AI generation addresses an asymmetry that has been latent in earlier reviews but not directly named: *the moment of needing something* and *the moment of being able to think about what you need* are two different situations, and they require different affordances. Splitting them is endorsed by every voice on the panel.

Three details determine whether the design holds:

1. **Copy.** *"Verzin activiteiten voor me"* reads as work/demand for Fatima and as coercive framing for the PDA-coded ND audience. *"Ik heb nu iets nodig"* / *"laten we activiteiten maken"* is the version that survives the panel. **Commit to the relabel.**
2. **Chat-route input modality.** If the chat route requires typing or asks emotion-labelling questions, it loses Fatima (typing), Jeroen (alexithymia), and the ND-burnout segment in one stroke. Tappable quick-replies with concrete (not emotional) questions is the only version that works.
3. **The inversion.** The list-based route is only meaningful if the user's own list + most-picked items actually feed back into *"Verras me"* as its source of suggestions. If *"Verras me"* stays a separate pool, this is menu restructuring without retention payoff.

The retention picture, conditional on those three details landing: Eline and Jeroen stay through six months; Fatima stays via *"Verras me"* alone and never enters *"Jouw activiteiten"*, which is fine. Without those details: Eline drops in month 4, and the avg/IQ-coded segment never grows a library.

---

## Personas

### Eline (gifted-AuDHD, ideation-freeze)

**Initial:** *"Eindelijk een app die snapt dat het moment-van-nodig en het moment-van-bedenken twee verschillende situaties zijn."* The split between *now* and *later* is the first time she's seen the *"ik kan op zaterdagmiddag wel nadenken, op zondagavond niet"* asymmetry honoured in UI. The *"riff op wat ik al heb toegevoegd + vaakst gekozen"* route is exactly the catalyst-not-personaliser shape she wanted in 006. Eén grote zorg: of de chat-route ook *specifics* accepteert (de fineliners, het soort wandeling) of dat het weer wordt *"hoe voel je je?"* — als dat tweede, is de chat dood voor haar.

**3 maanden:** in, *mits* de relaxed-route minstens drie keer iets opleverde wat ze zelf niet had bedacht én daadwerkelijk deed.
**6 maanden:** in, *mits* haar lijst zichtbaar is gegroeid en *"Verras me"* inmiddels vooral uit *haar* items put. Als *"Verras me"* maand vier nog steeds dezelfde starter-set serveert, sluipt de app eruit.

### Fatima (AuDHD, burnout, 9 PM op de bank)

**Initial:** *"Ik begrijp het niet meteen."* Drie knoppen in *"Jouw activiteiten"* is voor haar al een keuzemenu — en de woorden *"verzin"* en *"activiteiten voor me"* lezen als werk. De relabel naar *"ik heb nu iets nodig"* helpt enorm; dát begrijpt ze meteen. Maar de tweede knop (*"laten we activiteiten maken"*) klinkt als een opdracht. Belangrijker nog: ze komt nooit in *"Jouw activiteiten"* terecht — ze opent de app, tapt *"Verras me"*, en sluit hem weer. Zolang die kern intact is, is de rest voor haar onzichtbaar — wat oké is.

**Eén zorg:** als de chat-route haar vragen stelt die typen vereisen, sluit ze af. Tappable of niets.

**3 maanden:** in, *omdat* *"Verras me"* gewoon *"Verras me"* blijft.
**6 maanden:** in alleen als de suggesties op de homepage met de tijd realistischer worden voor háár leven (kort, binnen, stil, geen setup). Als dat niet stilletjes gebeurt achter de schermen, vervaagt de app uit haar dock.

### Jeroen (autistisch, alexithymisch, developer)

**Initial:** logisch geordend, hij snapt het meteen. Twee dingen vallen op. Eén: de *list-based* route is precies de feature die voor hem werkt — observatiedata (wat heb ik toegevoegd, wat kies ik vaak) in plaats van zelfrapportage. Twee: de *chat* route gaat hem nooit lukken als de AI emotionele vragen stelt. Als het concrete vragen zijn (*"binnen of buiten?"*, *"kort of lang?"*, *"alleen of met iemand?"*), wel.

**3 maanden:** in via *"Verras me"* + de relaxed list-based route als zondagavond-ritueel.
**6 maanden:** in *mits* de list-based route niet stiekem afhankelijk is van een goed-gevulde lijst die hij niet heeft. Als de AI hem na maand twee zegt *"voeg eerst meer activiteiten toe"*, valt het systeem voor hem stil.

---

## Expert lenses

### ND-lens

**Initial endorsement, twee waarschuwingen.**

Het splitsen van de AI-generatie in twee modi adresseert de monotropie/PDA/burnout-spanning die in 006 onopgelost bleef:
- De **list-based route** is structureel *user-authored* (riff op wat de gebruiker zelf koos) — laag-demand, niet-coërcief, PDA-veilig. Goed.
- De **chat-route** is hoog-demand én vereist beschikbare verbal fluency precies op het moment dat die het laagst is (9 uur 's avonds, depleted). Dit is voor ND-burnout en alexithyme gebruikers de slechtst denkbare combinatie. *Tenzij* de chat tappable quick-replies is in plaats van vrije tekst.

**Tweede zorg:** *"Verzin activiteiten voor me"* is demand-framed copy. *"Ik heb nu iets nodig"* / *"laten we activiteiten maken"* is een grote verbetering — committen aan die labels, niet aan het oude.

**Lange termijn:** de inversion uit 006 (eigen lijst verdringt starter-library) wordt door dit ontwerp ondersteund — mits het most-picked-signaal daadwerkelijk de bron wordt van *"Verras me"*. Als *"Verras me"* een aparte pool blijft, breekt de koppeling en is dit alleen UI-restructuring.

### Giftedness-lens

**Generating-vs-consuming gradient:** de list-based route zit op het juiste deel van de gradient — gebruiker genereert (kiest, voegt toe, gebruikt), AI rifft. Eline-archetypes blijven hier. De chat-route schuift naar *consuming* op precies het moment dat de gebruiker het minst kan onderscheiden of het van haarzelf is — risico op deskilling (*"ik weet niet meer wat me ontspant, ik vraag het de AI"*). Niet fataal, want het is een opt-in route, maar provenance-signalering op de gegenereerde kaarten (*"AI-suggestie op basis van jouw lijst"* vs. *"AI-suggestie op basis van wat je net vertelde"*) is hier noodzakelijk, niet luxe.

**Bounded vs. infinite:** de "drie activiteiten" cap in de relaxed route is precies goed. Niet uitbreiden naar *"toon er meer"*.

### Avg/below-average IQ-lens

**Hier zit het scherpste risico van dit ontwerp.**

Drie knoppen onder *"Jouw activiteiten"* — *"voeg eigen activiteit toe"*, *"jouw lijst"*, *"verzin activiteiten voor me"* — vergt drie keer een metacognitieve operatie waarvan de bestaande review-literatuur zegt dat een aanzienlijk deel van deze populatie ze niet maakt. Belangrijker: de hele *"voeg eerst zelf dingen toe en dan rift de AI erop"*-pijplijn valt stil als de gebruiker niets toevoegt — en authoring is voor deze populatie de bottleneck.

**Wat dit ontwerp impliciet doet:** het promoveert authoring (de twee non-chat-knoppen) en demoteert de chat-route ("alleen voor in-het-moment"). Voor deze populatie is de chat-route — mits tappable, niet typed — *de* groei-mechanisme. Als die wordt geframed als de noodknop voor crisismomenten, gebruikt deze gebruiker hem alleen in crisis, niet als groeibron.

**Aanbeveling:** label de chat-route niet als "voor als je iets nu nodig hebt." Maak hem beschikbaar als gelijkwaardige route, niet als spoedingang. Anders krijgt deze populatie nooit een groeiende lijst — en concludeert *"deze app werkt niet voor mij"*.

**6 maanden voor Lisa-achtige avg-IQ gebruikers:** alleen in als de chat-route hen actief vult, ongeacht of ze ooit zelf op *"voeg toe"* tappen.

---

## Convergentie

- *"Verras me"* onaangetast houden = unaniem juist. Niet aan komen.
- De **split tussen now-route en relaxed-route** is een echte verbetering — adresseert de moment-van-nodig vs. moment-van-bedenken asymmetrie die in 006 latent bleef.
- De **knop-labels** zijn de hefboom. *"Verzin activiteiten voor me"* moet weg. *"Ik heb nu iets nodig"* + *"laten we activiteiten maken"* (of vergelijkbaar) is wat het ontwerp werkbaar maakt voor Fatima en demand-veilig voor de PDA-flank.
- **Chat-route moet tappable zijn**, niet typed — anders verliest het Fatima, Jeroen en het ND-burnout-segment in één klap.
- **List-based route hangt aan een vooronderstelling** (gebruiker heeft activiteiten toegevoegd) die niet voor iedereen geldt. Avg/IQ-lens: maak dit niet de "premium" route die alleen werkt voor de authorers.
- **Provenance op AI-kaarten** (welke route hebben ze gegenereerd) is voor het gifted-archetype niet onderhandelbaar.
- **De inversion** (eigen lijst verdringt starter-library als bron van *"Verras me"*) moet daadwerkelijk geïmplementeerd zijn achter de schermen. Anders is dit ontwerp alleen menu-herordening.

**Retentie zonder die laatste verbinding:** Eline weg in maand 4, Fatima blijft (maar gebruikt alleen *"Verras me"*), Jeroen blijft op gewoonte. **Mét** die verbinding: alle drie blijven, en de relaxed-route wordt waarschijnlijk de meest gebruikte feature na *"Verras me"* voor de panel-helft die niet in crisis is op het moment van openen.

---

## Open tension carried forward

The avg/IQ lens and the giftedness lens pull in opposite directions on the chat-route's framing. The giftedness lens wants it bounded and clearly *not* the default (to protect against deskilling). The avg/IQ lens wants it elevated to equal status (because it's the only growth mechanism that doesn't depend on authoring). This is the same tension as in 006 — authorship-as-spine vs. AI-generation-as-spine — and it is not resolved by this design. It is *softened*, because the user picks the route, but the *labels and prominence* of the two routes still encode a default. Worth naming explicitly before settling on copy.
