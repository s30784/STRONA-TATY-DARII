export const ROUTE_DETAILS = {
  JW: {
    title: 'Schemat trasy: Jarosław -> Wiedeń',
    mapUrl: 'https://www.google.com/maps/dir/Jaros%C5%82aw/Rzesz%C3%B3w/Krak%C3%B3w/Wiede%C5%84',
    stops: [
      { name: 'Jarosław', desc: 'start kursu, dokładne miejsce do potwierdzenia telefonicznie' },
      { name: 'Przeworsk / Łańcut', desc: 'możliwy odbiór po wcześniejszym ustaleniu' },
      { name: 'Rzeszów', desc: 'dogodne miejsce dosiadki przy trasie' },
      { name: 'Kraków / okolice A4', desc: 'przystanek zależny od konkretnego przejazdu' },
      { name: 'Wiedeń', desc: 'wysiadka w uzgodnionym punkcie lub pod adresem' }
    ]
  },
  WJ: {
    title: 'Schemat trasy: Wiedeń -> Jarosław',
    mapUrl: 'https://www.google.com/maps/dir/Wiede%C5%84/Krak%C3%B3w/Rzesz%C3%B3w/Jaros%C5%82aw',
    stops: [
      { name: 'Wiedeń', desc: 'start kursu, punkt odbioru ustalany przy rezerwacji' },
      { name: 'Okolice granicy AT/CZ lub AT/SK', desc: 'przystanki zależne od przejazdu' },
      { name: 'Kraków / okolice A4', desc: 'możliwa wysiadka po wcześniejszym ustaleniu' },
      { name: 'Rzeszów', desc: 'wygodny punkt wysiadki przy trasie' },
      { name: 'Jarosław', desc: 'koniec kursu lub dowóz po uzgodnieniu' }
    ]
  }
};
