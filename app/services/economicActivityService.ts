export interface EconomicActivityOption {
  label: string;
  value: string;
}

export interface OccupationArea {
  label: string;
  value: string;
}

export interface IncomeRange {
    label: string;
    value: string;
}

const economicActivities: EconomicActivityOption[] = [
    { label: 'Empleado', value: 'employee' },
    { label: 'Empresario / Dueño de negocio', value: 'business_owner' },
    { label: 'Trabajador Independiente / Freelancer', value: 'freelancer' },
    { label: 'Estudiante', value: 'student' },
    { label: 'Jubilado / Pensionado', value: 'retired' },
    { label: 'Desempleado', value: 'unemployed' },
    { label: 'Otro', value: 'other' },
];

const occupationAreas: OccupationArea[] = [
    { label: 'Tecnología de la Información (TI)', value: 'it' },
    { label: 'Finanzas y Banca', value: 'finance' },
    { label: 'Salud y Servicios Médicos', value: 'health' },
    { label: 'Educación', value: 'education' },
    { label: 'Ventas y Marketing', value: 'sales_marketing' },
    { label: 'Ingeniería y Construcción', value: 'engineering' },
    { label: 'Arte, Cultura y Entretenimiento', value: 'arts' },
    { label: 'Gobierno y Sector Público', value: 'government' },
    { label: 'Hotelería y Turismo', value: 'hospitality' },
    { label: 'Otro', value: 'other' },
];

const incomeRangesBolivia: IncomeRange[] = [
    { label: 'Menos de 2,500 Bs', value: '0-2500' },
    { label: '2,501 - 5,000 Bs', value: '2501-5000' },
    { label: '5,001 - 10,000 Bs', value: '5001-10000' },
    { label: '10,001 - 20,000 Bs', value: '10001-20000' },
    { label: 'Más de 20,000 Bs', value: '20001+' },
];

export const getEconomicActivities = async (): Promise<EconomicActivityOption[]> => {
    return Promise.resolve(economicActivities);
};

export const getOccupationAreas = async (): Promise<OccupationArea[]> => {
    return Promise.resolve(occupationAreas);
};

export const getIncomeRanges = async (countryCode: string): Promise<IncomeRange[]> => {
    // For now, only returning Bolivia ranges as per instructions
    if (countryCode === 'BO') {
        return Promise.resolve(incomeRangesBolivia);
    }
    return Promise.resolve([]);
}; 