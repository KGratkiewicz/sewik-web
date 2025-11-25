// public/codeMapper.js
// Mapper kodów i słowników SEWIK.
//
// 1) dictionaryDescriptions – NAZWY słowników -> opis (z dictionary.sql)
// 2) codeMaps – konkretne wartości (np. PLEC, STUC_KOD, SZRD_KOD itp.)
// 3) mapCode(columnName, value) – np. "K (Kobieta)" / "ZM (Ofiara śmiertelna)"
// 4) describeDictionary(name) – np. "STNA" -> "Stan nawierzchni"

(function (global) {
  // -------------------------------
  // 1. Słowniki z dictionary.sql
  // -------------------------------
  const dictionaryDescriptions = {
    "CHMZ": "Charakterystyka miejsca zdarzenia",
    "CHMZ1": "Charakterystyka miejsca zdarzenia",
    "GEOD": "Geometria drogi",
    "GEOD1": "Geometria drogi",
    "MONTH": "Dictionary created separately from SEWIK xml files",
    "NADR": "Nawierzchnia drogi",
    "NADR1": "Nawierzchnia drogi",
    "OZPO": "Oznakowanie poziome",
    "OZPO1": "Oznakowanie poziome",
    "RODR": "Rodzaj drogi",
    "RODR1": "Rodzaj drogi",
    "RODZAJ_POJAZDU": "Rodzaj Pojazdu",
    "SEKD": "Słownik kategorii dróg",
    "SKRZ": "Skrzyżowanie",
    "SKRZ1": "Skrzyżowanie",
    "SOBY": "Obywatelstwo",
    "SPAK": "SEWIK - jednostka alk.",
    "SPIC": "Inne cechy pojazdu",
    "SPIC1": "Pojazdy szczególne",
    "SPIC2": "Pojazdy szczególne",
    "SPIP": "Przyczyny pozostale",
    "SPIP1": "Przyczyny pozostale",
    "SPIP2": "Przyczyny pozostale",
    "SPOU": "Przyczyny zachowanie osoby UWR",
    "SPPI": "Przyczyny zachowanie pieszego",
    "SPPI1": "Przyczyny zachowanie pieszego",
    "SPPI2": "Przyczyny zachowanie pieszego",
    "SPSP": "Stan pojazdu",
    "SPSP1": "Stan pojazdu",
    "SPSP2": "Stan pojazdu",
    "SPSZ": "Przyczyny zachowanie",
    "SPSZ1": "Przyczyny zachowanie",
    "SPSZ2": "Przyczyny zachowanie",
    "SRUZ": "Rozstrzygnięcie",
    "SRUZ1": "Rozstrzygnięcie",
    "SRUZ2": "Rozstrzygnięcie",
    "SSRU": "Rodzaj uczestnika",
    "SSRU1": "Rodzaj uczestnika",
    "SSUP": "Uszkodzenia poza pojazdami",
    "SSUP1": "Uszkodzenia poza pojazdami",
    "SSUP2": "Uszkodzenia poza pojazdami",
    "SSWA": "Warunki atmosferyczne",
    "SSWA1": "Warunki atmosferyczne",
    "STNA": "Stan nawierzchni",
    "STNA1": "Stan nawierzchni",
    "STUC": "Stan uczestnika SEWIK",
    "SUSB": "Uczestnicy jazda bez",
    "SUSB1": "Uczestnicy jazda bez",
    "SUSU": "Uczestnicy - uprawnienia do kierowania",
    "SUSU1": "Uczestnicy - uprawnienia do kierowania",
    "SUSU2": "Uczestnicy - uprawnienia do kierowania",
    "SUSW": "Wpływ środków na uczestnika",
    "SUSW1": "Wpływ środków na uczestnika",
    "SUZZ": "Miejsce zamieszkania uczestnika",
    "SYSW": "Sygnalizacja świetlna",
    "SYSW1": "Sygnalizacja świetlna",
    "SZOS": "Oświetlenie",
    "SZOS1": "Oświetlenie",
    "SZRD": "Rodzaj zdarzenia",
    "SZRD1": "Rodzaj zdarzenia",
    "SZRD2": "Rodzaj zdarzenia",
    "WEEKDAY": "Dictionary created separately from SEWIK xml files",
    "YEAR": "Dictionary created separately from SEWIK xml files",
    "ZABU": "Obszar",
    "ZABU1": "Obszar"
  };

  // -------------------------------
  // 2. Konkretne mapowania kodów
  // -------------------------------

  // Słowniki bazowe – używamy ich potem pod wieloma kolumnami
  const baseDicts = {
    PLEC: {
      "K": "Kobieta",
      "M": "Mężczyzna",
      "N": "Nieustalono / brak danych",
    },
    STUC: {
      "RC": "Ranny ciężko",
      "RM": "Ranny lekko",
      "ZM": "Ofiara śmiertelna",
    },
    SOBY: {
      "PL": "Polska",
      "UK": "Wielka Brytania",
    },
    SSRU: {
      "K": "Kierujący",
      "P": "Pasażer",
    },
    SUSU: {
      "SUSU1": "Posiada uprawnienia do kierowania",
      "SUSU2": "Brak uprawnień do kierowania",
    },
    RODZAJ_POJAZDU: {
      "IS208": "Autobus inny",
      "IS207": "Autobus komunikacji publicznej",
      "IS222": "Ciągnik rolniczy",
      "IS230": "Czterokołowiec",
      "IS229": "Czterokołowiec lekki",
      "IS240": "Hulajnoga elektryczna",
      "IS220": "Inny",
      "IS228": "Motocykl inny",
      "IS227": "Motocykl o poj. do 125 cm3",
      "IS202": "Motorower",
      "IS218": "Pociąg",
      "IS225": "Pojazd nieustalony",
      "IS201": "Rower",
      "IS231": "Samochód ciężarowy DMC do 3,5 T",
      "IS232": "Samochód ciężarowy DMC powyżej 3,5 T",
      "IS221": "Samochód osobowy",
      "IS223": "Tramwaj, trolejbus",
      "IS241": "Urządzenie transportu osobistego",
    },
    CHMZ: {
      "10": "Chodnik, droga dla pieszych",
      "A3_2015": "Droga, pas ruchu, śluza dla rowerów",
      "A1": "Jezdnia",
      "A5": "Most, wiadukt, łącznica, tunel",
      "A6_2015": "Parking, plac, MOP",
      "12": "Pas dzielący jezdnie",
      "11": "Pobocze",
      "B1": "Przejazd dla rowerzystów",
      "07": "Przejazd kolejowy niestrzeżony",
      "06": "Przejazd kolejowy strzeżony",
      "A4": "Przejazd tramwajowy, torowisko tramwajowe",
      "01": "Przejście dla pieszych",
      "13": "Przewiązka na drodze dwujezdniowej",
      "02": "Przystanek komunikacji publicznej",
      "A7": "Roboty drogowe, oznakowanie tymczasowe",
      "A2": "Skarpa, rów",
      "14": "Wjazd, wyjazd z posesji, pola",
    },
    GEOD: {
      "01": "Odcinek prosty",
      "03": "Spadek",
      "04": "Wierzchołek wzn.",
      "A1": "Wzniesienie",
      "02": "Zakręt, łuk",
    },
    ZABU: {
      "02": "Obszar niezabudowany",
      "01": "Obszar zabudowany",
    },
    RODR: {
      "01": "Autostrada",
      "03": "Dwie jezdnie jednokierunkowe",
      "02": "Droga ekspresowa",
      "05": "Jednojezdniowa dwukierunkowa",
      "04": "Jednokierunkowa",
    },
    SKRZ: {
      "08": "Skrzyżowanie o ruchu okrężnym",
      "06": "Skrzyżowanie równorzędne",
      "07": "Skrzyżowanie z drogą z pierwszeństwem",
    },
    SYSW: {
      "03": "Brak sygnalizacji świetlnej",
      "01": "Sygnalizacja świetlna – działa",
      "02": "Sygnalizacja świetlna – nie działa",
    },
    SSWA: {
      "01": "Dobre warunki atmosferyczne",
      "07": "Mgła, dym",
      "05": "Opady deszczu",
      "06": "Opady śniegu, gradu",
      "02": "Oślepiające słońce",
      "04": "Pochmurno",
      "03": "Silny wiatr",
    },
    SZOS: {
      "05": "Noc – droga nieoświetlona",
      "03": "Noc – droga oświetlona",
      "01": "Światło dzienne",
      "02": "Świt, zmrok",
    },
    SPIP: {
      "06": "Działanie sygnalizacji świetlnej",
      "A5": "Inne",
      "07": "Nieprawidłowo działająca zapora kolejowa",
      "02_2015": "Niesprawność techniczna pojazdu",
      "A4": "Nieustalone",
      "08": "Obiekty, zwierzęta na drodze",
      "04": "Organizacja ruchu",
      "10": "Oślepienie przez inny pojazd lub słońce",
      "01": "Pożar pojazdu",
      "03": "Stan jezdni",
      "09_2015": "Utrata przytomności, śmierć kierującego",
      "A3": "Z winy pasażera",
      "05": "Zabezpieczenie robót na drodze",
    },
    SZRD: {
      "12": "Inne",
      "A3": "Najechanie na barierę ochronną",
      "A1": "Najechanie na drzewo",
      "08": "Najechanie na dziurę, wybój, garb",
      "04": "Najechanie na pieszego",
      "05": "Najechanie na pojazd unieruchomiony",
      "A2": "Najechanie na słup, znak",
      "07": "Najechanie na zaporę kolejową",
      "09": "Najechanie na zwierzę",
      "10": "Wywrócenie się pojazdu",
      "13": "Zdarzenie z osobą UWR",
      "11": "Zdarzenie z pasażerem",
      "02": "Zderzenie pojazdów boczne",
      "01": "Zderzenie pojazdów czołowe",
      "03": "Zderzenie pojazdów tylne",
    },
    SPSZ: {
      "14": "Gwałtowne hamowanie",
      "B2": "Inne przyczyny",
      "15": "Jazda bez wymaganych świateł",
      "01": "Niedostosowanie prędkości do warunków ruchu",
      "A4": "Nieprawidłowe zawracanie",
      "09": "Nieprawidłowe cofanie",
      "04": "Nieprawidłowe omijanie",
      "A2_2015": "Nieprawidłowe przejeżdżanie przejazdu dla rowerzystów",
      "07": "Nieprawidłowe skręcanie",
      "05": "Nieprawidłowe wymijanie",
      "03": "Nieprawidłowe wyprzedzanie",
      "08": "Nieprawidłowe zatrzymywanie, postój",
      "A3": "Nieprawidłowe zmienianie pasa ruchu",
      "12": "Nieprzestrzeganie znaków i innych sygnałów",
      "11": "Niestosowanie się do sygnalizacji świetlnej",
      "A1_2015": "Nieustąpienie pierwszeństwa pieszemu na przejściu",
      "A11_2015": "Nieustąpienie pierwszeństwa pieszemu przy skręcaniu w drogę poprzeczną",
      "B1": "Nieustąpienie pierwszeństwa pieszemu w innych okolicznościach",
      "02": "Nieustąpienie pierwszeństwa przejazdu",
      "13": "Niezachowanie bezpiecznej odległości między pojazdami",
      "06_2015": "Omijanie pojazdu przed przejściem dla pieszych",
      "A12_2015": "Wyprzedzanie pojazdu przed przejściem dla pieszych",
      "16": "Zmęczenie, zaśnięcie",
    },
    DROGA_PUBLICZNA: {
      "T": "Droga publiczna",
      "N": "Droga niepubliczna",
    }
  };

  // Główna mapa: klucze to NAZWY KOLUMN zwracanych z API lub nazwy słowników,
  // wartości – słowniki z konkretnymi kodami.
  const codeMaps = {
    // Uczestnicy (Osoby)
    "PLEC": baseDicts.PLEC,

    "STUC": baseDicts.STUC,
    "STUC_KOD": baseDicts.STUC,

    "SOBY": baseDicts.SOBY,
    "SOBY_KOD": baseDicts.SOBY,

    "SSRU": baseDicts.SSRU,
    "SSRU_KOD": baseDicts.SSRU,

    "SUSU": baseDicts.SUSU,
    "SUSU_KOD": baseDicts.SUSU,

    // Zdarzenia
    "SZOS": baseDicts.SZOS,
    "SZOS_KOD": baseDicts.SZOS,

    "SZRD": baseDicts.SZRD,
    "SZRD_KOD": baseDicts.SZRD,

    "DROGA_PUBLICZNA": baseDicts.DROGA_PUBLICZNA,

    // Pojazdy
    "RODZAJ_POJAZDU": baseDicts.RODZAJ_POJAZDU,

    // Miejsce, geometria, obszar itd. – przydadzą się w raportach / widokach
    "CHMZ": baseDicts.CHMZ,
    "GEOD": baseDicts.GEOD,
    "ZABU": baseDicts.ZABU,
    "RODR": baseDicts.RODR,
    "SKRZ": baseDicts.SKRZ,
    "SYSW": baseDicts.SYSW,
    "SSWA": baseDicts.SSWA,
    "SPIP": baseDicts.SPIP,
    "SPSZ": baseDicts.SPSZ,

    // Kolumny *_TABK_TYPE – mapujemy nazwę słownika na opis
    "SOBY_TABK_TYPE": {
      "SOBY": dictionaryDescriptions["SOBY"] || "Obywatelstwo"
    },
    "SSRU_TABK_TYPE": {
      "SSRU": dictionaryDescriptions["SSRU"] || "Rodzaj uczestnika",
      "SSRU1": dictionaryDescriptions["SSRU1"] || "Rodzaj uczestnika (wariant 1)"
    },
    "SUSU_TABK_TYPE": {
      "SUSU": dictionaryDescriptions["SUSU"] || "Uprawnienia do kierowania",
      "SUSU1": dictionaryDescriptions["SUSU1"] || "Uprawnienia do kierowania (wariant 1)",
      "SUSU2": dictionaryDescriptions["SUSU2"] || "Uprawnienia do kierowania (wariant 2)"
    },
    "SZOS_TABK_TYPE": {
      "SZOS": dictionaryDescriptions["SZOS"] || "Oświetlenie",
      "SZOS1": dictionaryDescriptions["SZOS1"] || "Oświetlenie (wariant 1)"
    },
    "SZRD_TABK_TYPE": {
      "SZRD": dictionaryDescriptions["SZRD"] || "Rodzaj zdarzenia",
      "SZRD1": dictionaryDescriptions["SZRD1"] || "Rodzaj zdarzenia (wariant 1)",
      "SZRD2": dictionaryDescriptions["SZRD2"] || "Rodzaj zdarzenia (wariant 2)"
    },
    "SPSU_TABK_TYPE": {
      "SPSP": dictionaryDescriptions["SPSP"] || "Stan pojazdu",
      "SPSP1": dictionaryDescriptions["SPSP1"] || "Stan pojazdu (wariant 1)",
      "SPSP2": dictionaryDescriptions["SPSP2"] || "Stan pojazdu (wariant 2)"
    }
  };

  // -------------------------------
  // 3. Funkcje pomocnicze
  // -------------------------------

  function mapCode(columnName, value) {
    if (value === null || value === undefined) return "";

    const key = String(columnName || "").toUpperCase();
    const valStr = String(value);

    const dict = codeMaps[key];
    if (dict && Object.prototype.hasOwnProperty.call(dict, valStr)) {
      const desc = dict[valStr];
      if (desc === null || desc === undefined || desc === "") {
        return valStr;
      }
      // Standardowy format "K (Kobieta)"
      return valStr + " (" + desc + ")";
    }

    // Brak zdefiniowanego tłumaczenia – zwracamy surową wartość
    return valStr;
  }

  function describeDictionary(dictName) {
    if (!dictName) return "";
    const key = String(dictName).toUpperCase();
    return dictionaryDescriptions[key] || key;
  }

  // Wystawiamy na window, żeby było dostępne wszędzie
  global.dictionaryDescriptions = dictionaryDescriptions;
  global.codeMaps = codeMaps;
  global.mapCode = mapCode;
  global.describeDictionary = describeDictionary;

})(window);
