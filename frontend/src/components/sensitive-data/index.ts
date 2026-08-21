/**
 * Fields that hold PHI: the value stays masked until the user asks for it, and
 * hides itself again shortly after. Both talk to sensitiveDataService.
 */
export { default as SensitiveDataField } from './SensitiveDataField';
export { default as InsuranceSensitiveDataField } from './InsuranceSensitiveDataField';
