/**
 * Determine the user's body constitution type.
 * Combines BMI (body composition) with goal (intent) for a smarter classification.
 *
 * @param bmi   Body Mass Index
 * @param goal  'lose_weight' | 'gain_weight' | 'maintain' | 'health'
 * @returns     'thin' | 'heavy' | 'balanced'
 */
export function computeConstitution(bmi: number, goal: string): string {
  if (bmi < 18.5) return 'thin';
  if (bmi >= 30) return 'heavy';
  if (bmi >= 25) return 'heavy';
  if (goal === 'lose_weight') return 'heavy';
  if (goal === 'gain_weight') return 'thin';
  return 'balanced';
}
