import { Country, State } from '../types/LocationTypes';

const mockCountries: Country[] = [
  {
    name: 'Bolivia',
    code: 'BO',
    phonePrefix: '+591',
    states: [
      { name: 'Beni', code: 'BEN' },
      { name: 'Cochabamba', code: 'CBB' },
      { name: 'Chuquisaca', code: 'CHU' },
      { name: 'La Paz', code: 'LPZ' },
      { name: 'Oruro', code: 'ORU' },
      { name: 'Pando', code: 'PAN' },
      { name: 'Potosí', code: 'POT' },
      { name: 'Santa Cruz', code: 'SCZ' },
      { name: 'Tarija', code: 'TJA' },
    ],
  },
  {
    name: 'Guatemala',
    code: 'GT',
    phonePrefix: '+502',
    states: [
        { name: 'Alta Verapaz', code: 'AVE' },
        { name: 'Baja Verapaz', code: 'BVE' },
        { name: 'Chimaltenango', code: 'CMT' },
        { name: 'Chiquimula', code: 'CQM' },
        { name: 'El Progreso', code: 'EPR' },
        { name: 'Escuintla', code: 'ESC' },
        { name: 'Guatemala', code: 'GUA' },
        { name: 'Huehuetenango', code: 'HUE' },
        { name: 'Izabal', code: 'IZA' },
        { name: 'Jalapa', code: 'JAL' },
        { name: 'Jutiapa', code: 'JUT' },
        { name: 'Petén', code: 'PET' },
        { name: 'Quetzaltenango', code: 'QUE' },
        { name: 'Quiché', code: 'QUI' },
        { name: 'Retalhuleu', code: 'RET' },
        { name: 'Sacatepéquez', code: 'SAC' },
        { name: 'San Marcos', code: 'SMA' },
        { name: 'Santa Rosa', code: 'SRO' },
        { name: 'Sololá', code: 'SOL' },
        { name: 'Suchitepéquez', code: 'SUC' },
        { name: 'Totonicapán', code: 'TOT' },
        { name: 'Zacapa', code: 'ZAC' },
    ],
  },
];

export const getCountries = async (): Promise<Country[]> => {
  return Promise.resolve(mockCountries);
};

export const getStatesByCountry = async (countryCode: string): Promise<State[]> => {
  const country = mockCountries.find(c => c.code === countryCode);
  return Promise.resolve(country ? country.states : []);
}; 