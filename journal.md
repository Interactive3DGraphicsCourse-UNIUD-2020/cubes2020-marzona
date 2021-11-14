## 1 - Scelta del tema
Come accennato nel readme, il punto di partenza è stata questa [animazione](https://i.pinimg.com/originals/10/2b/e3/102be30f28f1e288229155e255b50bff.gif) ispirata al videogame dark-fantasy Demon's Souls.

Con un concept di partenza chiaro sono stati quindi impostati i goal principali del progetto
* la realizzazzione di un sistema di particelle, composto da cubi, per simulare l'animazione di una fiamma
* l'implementazione di un sistema di animazione dello stesso che prevedesse accensione e spegnimento
* il collegamento di un sistema di illuminazione alla fiamma
* la realizzazione di una torcia o falò da inserire nella scena
* l'implementazione di una funzione di generazione di terreni, composti di cubi, utilizzando la soluzione proposta nella consegna del progetto, con l'obiettivo di realizzare una scena interessante in cui inserire il fuoco

## 2 - Fiamma
Dopo aver visualizzato alcuni degli esempi con particelle proposti sul sito di threejs e dopo aver dato un occhio a possibili soluzioni per implementare un semplice sistema di particellari, mi sono reso conto che il sistema proposto dalla libreria (classe Points, ex. ParticleSystem) utilizza delle particelle bidimensionali.

Consapevole dei possibili problemi di performance derivanti dall'implementazione di un sistema di particelle non basato su punti ma su primitive geometriche, ho dunque provato a pensare ad una struttura che, con un numero di particelle limitato, potesse dare un idea di un fuoco in movimento. Dopo alcuni tentativi ho scelto dunque di effettuare una semplificazione della forma di una fiamma con una goccia/teardrop.

Le particelle cubiche che compongono il fuoco vengono dunque generate in maniera casuale all'interno del volume di una sfera, si muovono verso l'alto e continuano il loro moto fino ad una posizione di altezza massima (calcolata sulla base della distanza dal centro della sfera) dopo la quale vengono nuovamente poste all'interno del volume della sfera di partenza.

Per ottenere un effetto più realistico, al moto lineare verso l'alto delle singole particelle ho associato una velocità di rotazione ed un associazione di valore di 'scale' e colore diffusivo basato sull'altezza (usando una funzione gradiente).

Dopo aver configurato i parametri in maniera ottimale ho collegato all'oggetto una pointlight e aggiunto un animazione di accensione/spegnimento. All'intensità luminosa della luce ho inoltre collegato una funzione seno per ottenere un effetto 'breathing'.

A questo punto ho cercato la soluzione migliore per ottenere un effetto di 'emissione luminosa' e ho dunque scelto di adottare un filtro di post processing (Bloom) per ottenere l'effetto desiderato. Per poter applicare l'effetto bloom alle sole particelle del fuoco e non all'intera scena ho adottato, effettuando alcune modifiche, il sistema presentato in questo [esempio](https://threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html).

## 3 - Generazione del terreno
Ho modificato il codice proposto per generare, a partire da una heightmap, un terreno completamente composto di voxel, utilizzando il fattore di scale solamente per definire la dimensione in wolrd space dei singoli cubi del terreno.
Il generatore utilizza una serie di parametri per associare a ogni cubo un materiale sulla base dell'altezza a cui si trova ( fra terra/sabbia/roccia e erba) e posiziona dell'acqua sopra tutti i blocchi che si trovano sotto il livello del mare.

Per quanto riguarda le ottimizzazioni adottate, avendo fatto da subito, purtroppo, dei test utilizzando delle heightmap molto grandi, ho dovuto immediatamente cercare un modo per evitare di generare molta più geometria di quella necessaria. La soluzione proposta usa quindi dei 'planes' al posto che 'box', evitando la generazione delle facce non visibili o condivise da due cubi vicini ed il metodo 'mergeBufferGeometries' per generare gruppi di geometrie unici per singolo materiale.

Diversi spunti sono stati presi da questo [esempio](https://threejs.org/examples/webgl_geometry_minecraft_ao.html) e da questi due articoli
- https://threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html
- https://threejsfundamentals.org/threejs/lessons/threejs-optimize-lots-of-objects.html

## 3 - Heightmap e vegetazione
Una volta testato il generatore con alcune mappe di prova, ho deciso di costruire un terreno con dimensioni di 32x32 su Magica Voxel. Una volta soddisfatto del risultato, per ottenere una heightmap ho esportato il mio modello come 'sliced PNGs' e ho scritto uno script ad hoc per generare un png in bianco e nero.

Per rendere l'ambiente più interessante ho scritto dunque delle classi per generare la vegetazione, le cui coordinate x,z devono essere fornite insieme al costruttore del generatore di terreni per l'inserimento nella mappa.
Per dover evitare di scriptare anche la generazione del falò ho deciso di realizzare il modello in Magica Voxel e aggiungerlo alla scena.

## 4 - Luci e ombre
Per l'illuminazione globale della scena ho utilizzato le due luci (direzionale e hemilight) proposte nell'esempio, regolandone intensità e colori nel passaggio da notte a giorno, in particolare cambiando il colore del cielo associato alla hemilight e regolando la luce direzionale sulla temperatura colore della luna (4100K).

Le due luci poste nella scena che generano ombra sono la luce direzionale e quella puntiforme associata alla fiamma. Il possibile è stato fatto per regolare le impostazioni delle due shadow cameras per minimizzare gli effetti di shadow acne e peter-panning senza dover utilizzare delle shadowmap eccessivamente grandi. Putroppo avendo una scena costituita di elementi di dimensione molto difforme alcuni artefatti sulle ombre sono ancora visibili.

## 5 - Cosa non è stato portato a termine / future implementazioni
- Alcuni tentativi sono stati effettuati per inserire un FadeIn/FadeOut sull'accensione e spegnimento del fuoco, tuttavia senza buoni risultati. Provare a integrare un'animazione con tweenjs
- L'aggiunta alla scena di un 'cavaliere' in voxel-art con il compito di accendere il fuoco era stata programmata, un modello è stato realizzato in Magica Voxel, tuttavia l'animazione non è ancora stata realizzata
- La generazione della vegetazione potrebbe essere ottimizzata utilizzando instanced meshes

## Aggiornamenti - 7,8 Novembre 2021
- Rivisti velocemente i moduli del progetto. Ora l'installazione di threejs utilizzata è aggiornata (r134) ed è locale.
- Effettuati alcuni primi tentativi per risolvere i problemi di performance.

Ho provato a prendere qualche idea dal libro **Lighting & Rendering - Jeremy Birn** per rivedere il sistema di illuminazione della scena. Ho fatto sia un tentativo di integrare la tecnica "Cascaded Shadow Maps", che a rigor di logica dovrebbe essere la scelta migliore per simulare la luce diretta del sole su una scena come quella realizzata, che una prova con una singola Spotlight per illuminare l'intera scena.


## Aggiornamenti - 12,14 Novembre 2021
Dopo aver constato che il geometry stage era probabilmente la fase della pipeline più pesante per questa scena, ho deciso di rivedere gli script di generazione e placing delle geometrie (terreno e vegetazione).

Cercando di non stravolgere troppo la struttura del progetto, ho riscritto le classi che generano gli oggetti della scena utilizzando la classe _InstancedMesh_.

Questo tipo di soluzione ha ridotto drasticamente la memoria utilizzata (passando da circa 280 geometrie nella scena a 11) ed aumentato notevolmente le performance.

Sul branch "csm" ho cercato di trovare una serie di parametri per le shadow map a cascata che funzionasse bene per tutte le posizioni di camera.

Non sono putroppo riuscito ad ottenere una soluzione soddisfacente e quindi lascio sul master branch la soluzione singola Spotlight + Hemilight. La risoluzione della shadowmap sulla Spotlight è stata impostata a 2K; questo mi sembra al momento il compromesso migliore, considerato che non tutti gli smartphone supportano le texture a 4K.