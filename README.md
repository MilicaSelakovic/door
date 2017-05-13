# door

## Install

```
pip2 install git+https://github.com/MilicaSelakovic/door
```
## Uninstall

```
pip2 uninstall door
```

## Run

```
python2 -m door
```

## Samo za Andjelku :)

  http://www.techmuzeacademy.com/simple-ways-to-test-your-rooms-frequency-response

- **Server**
  Server je aplikacija koja pusta zvuk na glavnom racunaru. Zvuk se na osnovu parametara (mape <frekvencija> <amplituda> i duzine trajanja) klijenta generise na serveru i pusta zvuk.

  - implementiran Flask server koji na zahtev pusta zvuk zadate frekvencije (trenutno fiksirano 1000Hz) i zadate duzine (1s)
- **Klijent**
  Klijent je aplikacija koja "slusa" zvuk. Klijentska aplikacija crta dva spektrograma, prvi spektrogram zvuk koji server pusta a drugi je spektrogram zvuka koji klijentska aplikacija "cuje".
  Takodje klijentska aplikacija bi davala poruku da li se pri pomeranju uredjaja dobijaju bolji rezultati ili losiji u odnosu na prethodnu poziciju.
  - IOS
    Aplikacija koja prima zvuk sa mikrofona, racuna FFT ulaza i crta spektrogram.
    Problem: Biblioteka koju smo nasli ne dozvoljava promene. U opsegu 20Hz do 20kHz dobijaju se amplitude 512 ekvidistantnih tacaka. Time imamo malo podataka za nize frekvencije i spektrogram izgleda lose, kao sto se moze videti na slikama.

    [![Slika1.png](https://s24.postimg.org/sucihik5h/Screen_Shot_2017-05-13_at_13.44.49.png)](https://postimg.org/image/cjcel77nl/)
    [![Slika2.png](https://s24.postimg.org/z9bje6qv9/Screen_Shot_2017-05-13_at_13.45.00.png)](https://postimg.org/image/kq4ecrxq9/)
    [![Slika3.png](https://s24.postimg.org/ve85bm7ph/Screen_Shot_2017-05-13_at_13.45.05.png)](https://postimg.org/image/hkjsmkf41/)
  - Android
    Za Android smo pronasli bibloteku Minim preko koje mozemo da odradimo spektralnu analizu ulaza sa mikrofona. Nije jos nista implementirano.
  - Web klijent
    Treca ideja je da klijentska aplikacija bude web aplikacija. U browser-u se crta spektrogram ulaza sa mikrofona.
    
