export const BUS_DETAILS = {
  bus9: {
    name: 'Mercedes-Benz Vito',
    selectLabel: 'Mercedes-Benz Vito',
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/2024_Mercedes-Benz_Vito_119_CDI_Tourer_Pro.jpg',
    description: 'Nowoczesny bus do wyjazdów lokalnych, rodzinnych i pracowniczych. Dobry wybór na wesela, lotniska i jednodniowe trasy.',
    features: ['9 miejsc z kierowcą', 'klimatyzacja', 'przestrzeń na bagaż', 'wynajem z kierowcą lub według ustaleń']
  },
  bus8: {
    name: 'Volkswagen Caravelle',
    selectLabel: 'Volkswagen Caravelle',
    image: 'https://assets.volkswagen.com/is/image/volkswagenag/cv001184pic-vw-caravelle-gallery-01-2x1?Zml0PWNyb3AsMSZmbXQ9cG5nJndpZD04MDAmYWxpZ249MC4wMCwwLjAwJmJmYz1vZmYmYzRiMA=%3D',
    description: 'Komfortowy wariant na dłuższe przejazdy, transfery i wyjazdy firmowe, gdzie liczy się wygoda pasażerów oraz elastyczna przestrzeń.',
    features: ['8 miejsc pasażerskich', 'wygodne fotele', 'USB / ładowanie', 'polecany na dłuższe trasy']
  }
};

export function busIdFromLabel(label) {
  return Object.keys(BUS_DETAILS).find((id) => BUS_DETAILS[id].selectLabel === label) || 'bus9';
}
