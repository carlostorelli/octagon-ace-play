/**
 * Converts American odds to a salary value.
 *
 * Logic:
 * - Favorites (negative odds like -300) have higher implied probability → higher salary
 * - Underdogs (positive odds like +250) have lower implied probability → lower salary
 *
 * Salary range: $3,000 – $15,000
 */
export function oddsToSalary(odds: number): number {
  if (odds === 0) return 7000; // neutral

  let impliedProb: number;
  if (odds < 0) {
    // Favorite: implied = |odds| / (|odds| + 100)
    impliedProb = Math.abs(odds) / (Math.abs(odds) + 100);
  } else {
    // Underdog: implied = 100 / (odds + 100)
    impliedProb = 100 / (odds + 100);
  }

  // Map implied probability (0.1 – 0.9) to salary ($3k – $15k)
  const minSalary = 3000;
  const maxSalary = 15000;

  // Clamp probability
  const clampedProb = Math.max(0.05, Math.min(0.95, impliedProb));

  // Linear mapping
  const salary = minSalary + (clampedProb - 0.05) * ((maxSalary - minSalary) / 0.9);

  // Round to nearest 500
  return Math.round(salary / 500) * 500;
}

/**
 * Format odds for display
 */
export function formatOdds(odds: number): string {
  if (odds > 0) return `+${odds}`;
  return String(odds);
}
