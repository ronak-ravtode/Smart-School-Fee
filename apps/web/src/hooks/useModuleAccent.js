const MODULE_ACCENTS = {
  dashboard: '#8b8fd4',
  students: '#6bc9a9',
  'fee-engine': '#6c7bd8',
  payments: '#5bb98a',
  reconciliation: '#e8977a',
  defaulters: '#d46a7a',
  reports: '#e8b86a',
  settings: '#8a94a5',
};

export function useModuleAccent(module) {
  return MODULE_ACCENTS[module] || '#8b8fd4';
}
