const MERCEDES_VITO_COVER = '/images/vehicles/vito/vito-2024-bok.jpg';
const VOLKSWAGEN_CARAVELLE_COVER = 'https://assets.volkswagen.com/is/image/volkswagenag/cv001184pic-vw-caravelle-gallery-01-2x1?Zml0PWNyb3AsMSZmbXQ9cG5nJndpZD04MDAmYWxpZ249MC4wMCwwLjAwJmJmYz1vZmYmYzRiMA=%3D';

export const BUS_DETAILS = {
  bus9: {
    name: 'Mercedes Vito 2024',
    selectLabel: 'Mercedes Vito 2024',
    rentalVisible: true,
    image: MERCEDES_VITO_COVER,
    photos: [
      {
        src: MERCEDES_VITO_COVER,
        alt: 'Mercedes Vito 2024 z zewnątrz',
        label: 'Bok pojazdu'
      },
      {
        src: '/images/vehicles/vito/vito-2024-tyl-bok.jpg',
        alt: 'Mercedes Vito 2024 widoczny od tyłu i boku',
        label: 'Tył i bok'
      },
      {
        src: '/images/vehicles/vito/vito-2024-kokpit.jpg',
        alt: 'Kokpit Mercedesa Vito 2024',
        label: 'Kokpit'
      },
      {
        src: '/images/vehicles/vito/vito-2024-fotele.jpg',
        alt: 'Fotele pasażerskie Mercedesa Vito 2024',
        label: 'Fotele pasażerskie'
      }
    ],
    description: 'Nowoczesny Mercedes Vito 2024 z automatem 9G-tronic, wygodnymi fotelami z V-klasy i dużym bagażnikiem. Dobrze sprawdza się przy wyjazdach rodzinnych, firmowych, transferach i trasach indywidualnych.',
    features: ['2.0 CDI', 'skrzynia automatyczna 9G-tronic', '164 KM', '8 miejsc z kierowcą', 'fotele z V-klasy z systemem szyn przesuwnych i regulacją oparć', 'prawo jazdy kat. B', 'Android Auto + nawigacja', 'duży bagażnik', 'klimatyzacja przód / tył', 'kamera cofania']
  },
  bus8: {
    name: 'Volkswagen Caravelle',
    selectLabel: 'Volkswagen Caravelle',
    rentalVisible: false,
    image: VOLKSWAGEN_CARAVELLE_COVER,
    photos: [
      {
        src: VOLKSWAGEN_CARAVELLE_COVER,
        alt: 'Volkswagen Caravelle z zewnątrz',
        label: 'Widok zewnętrzny'
      },
      {
        src: 'https://images.unsplash.com/photo-1768400554801-2002b63e0591?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
        alt: 'Biały bus z zewnątrz na postoju',
        label: 'Bryła pojazdu'
      },
      {
        src: 'https://images.pexels.com/photos/17455631/pexels-photo-17455631.jpeg?auto=compress&cs=tinysrgb&w=1400',
        alt: 'Wnętrze busa z komfortowymi fotelami pasażerskimi',
        label: 'Wnętrze'
      }
    ],
    description: 'Komfortowy wariant na dłuższe przejazdy, transfery i wyjazdy firmowe, gdzie liczy się wygoda pasażerów oraz elastyczna przestrzeń.',
    features: ['8 miejsc pasażerskich', 'wygodne fotele', 'USB / ładowanie', 'polecany na dłuższe trasy']
  }
};

export const RENTAL_BUS_DETAILS = Object.fromEntries(
  Object.entries(BUS_DETAILS).filter(([, bus]) => bus.rentalVisible !== false)
);

export const DEFAULT_RENTAL_BUS_ID = Object.keys(RENTAL_BUS_DETAILS)[0] || 'bus9';

export function busIdFromLabel(label, busDetails = BUS_DETAILS) {
  return Object.keys(busDetails).find((id) => busDetails[id].selectLabel === label) || DEFAULT_RENTAL_BUS_ID;
}
