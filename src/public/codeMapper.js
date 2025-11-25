//
// Mapper kodów i słowników SEWIK
// Gotowa pełna struktura + wypełnione słowniki z Twoich danych
//

(function (global) {

  // --------------------------------------------------------------
  // 1) Pełna lista słowników SEWIK (z dictionary.sql)
  // --------------------------------------------------------------

  const dictionaryDescriptions = {
    "CHMZ": "Charakterystyka miejsca zdarzenia",
    "CHMZ1": "Charakterystyka miejsca zdarzenia",
    "GEOD": "Geometria drogi",
    "GEOD1": "Geometria drogi",
    "MONTH": "Miesiąc",
    "NADR": "Nawierzchnia drogi",
    "NADR1": "Nawierzchnia drogi",
    "OZPO": "Oznakowanie poziome",
    "OZPO1": "Oznakowanie poziome",
    "RODR": "Rodzaj drogi",
    "RODR1": "Rodzaj drogi",
    "RODZAJ_POJAZDU": "Rodzaj pojazdu",
    "SEKD": "Kategoria drogi",
    "SKRZ": "Skrzyżowanie",
    "SKRZ1": "Skrzyżowanie",
    "SOBY": "Obywatelstwo",
    "SPAK": "Jednostka alk.",
    "SPIC": "Inne cechy pojazdu",
    "SPIC1": "Pojazdy szczególne",
    "SPIC2": "Pojazdy szczególne",
    "SPIP": "Przyczyny pozostałe",
    "SPIP1": "Przyczyny pozostałe",
    "SPIP2": "Przyczyny pozostałe",
    "SPOU": "Zachowanie osoby UWR",
    "SPPI": "Zachowanie pieszego",
    "SPPI1": "Zachowanie pieszego",
    "SPPI2": "Zachowanie pieszego",
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
    "STUC": "Skutek dla uczestnika",
    "SUSB": "Jazda bez...",
    "SUSB1": "Jazda bez...",
    "SUSU": "Uprawnienia do kierowania",
    "SUSU1": "Uprawnienia do kierowania",
    "SUSU2": "Uprawnienia do kierowania",
    "SUSW": "Wpływ środków",
    "SUSW1": "Wpływ środków",
    "SUZZ": "Miejsce zamieszkania uczestnika",
    "SYSW": "Sygnalizacja świetlna",
    "SYSW1": "Sygnalizacja świetlna",
    "SZOS": "Oświetlenie",
    "SZOS1": "Oświetlenie",
    "SZRD": "Rodzaj zdarzenia",
    "SZRD1": "Rodzaj zdarzenia",
    "SZRD2": "Rodzaj zdarzenia",
    "WEEKDAY": "Dzień tygodnia",
    "YEAR": "Rok",
    "ZABU": "Obszar",
    "ZABU1": "Obszar"
  };

  // --------------------------------------------------------------
  // 2) SŁOWNIKI → wartości kodów (uzupełnione z Twoich danych)
  // --------------------------------------------------------------

  const codeMaps = {

    // =======================
    // Najważniejsze słowniki
    // =======================

    "PLEC": {
      "K": "Kobieta",
      "M": "Mężczyzna",
      "N": "Nieustalono / brak danych"
    },

    "STUC": {
      "RC": "Ranny ciężko",
      "RM": "Ranny lekko",
      "ZM": "Ofiara śmiertelna"
    },

    "SSRU": {
      "K": "Kierujący",
      "P": "Pasażer"
    },

    "SOBY": {
      "PL": "Polska",
      "UK": "Wielka Brytania"
    },

    "SUSU": {
      "SUSU1": "Uprawnienia – pewne",
      "SUSU2": "Uprawnienia – brak / nieustalone"
    },

    "SZOS": {},
    "SZOS1": {},

    "SZRD": {},
    "SZRD1": {},
    "SZRD2": {},

    // ======================================
    // Wszystkie pozostałe słowniki SEWIK
    // (na razie puste — gotowe do uzupełnienia)
    // ======================================

    "CHMZ": {}, "CHMZ1": {},
    "GEOD": {}, "GEOD1": {},
    "MONTH": {},
    "NADR": {}, "NADR1": {},
    "OZPO": {}, "OZPO1": {},
    "RODR": {}, "RODR1": {},
    "RODZAJ_POJAZDU": {},
    "SEKD": {},
    "SKRZ": {}, "SKRZ1": {},
    "SPAK": {},
    "SPIC": {}, "SPIC1": {}, "SPIC2": {},
    "SPIP": {}, "SPIP1": {}, "SPIP2": {},
    "SPOU": {},
    "SPPI": {}, "SPPI1": {}, "SPPI2": {},
    "SPSP": {}, "SPSP1": {}, "SPSP2": {},
    "SPSZ": {}, "SPSZ1": {}, "SPSZ2": {},
    "SRUZ": {}, "SRUZ1": {}, "SRUZ2": {},
    "SSUP": {}, "SSUP1": {}, "SSUP2": {},
    "SSWA": {}, "SSWA1": {},
    "STNA": {}, "STNA1": {},
    "SUSB": {}, "SUSB1": {},
    "SUSW": {}, "SUSW1": {},
    "SUZZ": {},
    "SYSW": {}, "SYSW1": {},
    "WEEKDAY": {},
    "YEAR": {},
    "ZABU": {}, "ZABU1": {}
  };

  // --------------------------------------------------------------
  // 3) GŁÓWNA FUNKCJA mapowania
  // --------------------------------------------------------------

  function mapCode(dict, value) {
    if (!dict || value === null || value === undefined) return value;

    const dictName = String(dict).toUpperCase();
    const code = String(value).trim();

    if (!codeMaps[dictName]) return value;

    if (!codeMaps[dictName][code]) return value;

    return `${code} (${codeMaps[dictName][code]})`;
  }

  // --------------------------------------------------------------
  // 4) Opis słownika
  // --------------------------------------------------------------

  function describeDictionary(dictName) {
    if (!dictName) return "";
    const key = String(dictName).toUpperCase();
    return dictionaryDescriptions[key] || key;
  }

  // --------------------------------------------------------------
  // Eksport do window
  // --------------------------------------------------------------

  global.codeMaps = codeMaps;
  global.mapCode = mapCode;
  global.dictionaryDescriptions = dictionaryDescriptions;
  global.describeDictionary = describeDictionary;

})(window);
