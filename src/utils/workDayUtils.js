/**
 * Utility functions for handling WorkDay enum from backend
 * 
 * Backend enum (C#):
 * [Flags]
 * public enum WorkDay
 * {
 *     None = 0,
 *     Saturday = 1,
 *     Sunday = 2,
 *     Monday = 3,
 *     Tuesday = 4,
 *     Wednesday = 5,
 *     Thursday = 6,
 *     Friday = 7
 * }
 * 
 * Note: Despite [Flags] attribute, the values are sequential (1-7), not bit flags.
 * This means we can only send single day values, not combinations.
 */

// Map day names to enum values
export const dayNameToEnumValue = {
  'saturday': 1,
  'sunday': 2,
  'monday': 3,
  'tuesday': 4,
  'wednesday': 5,
  'thursday': 6,
  'friday': 7,
};

// Map enum values to day names
export const enumValueToDayName = {
  1: 'saturday',
  2: 'sunday',
  3: 'monday',
  4: 'tuesday',
  5: 'wednesday',
  6: 'thursday',
  7: 'friday',
};

// Day order for display (Saturday to Friday)
export const dayOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

/**
 * Convert array of day names to array of enum values
 * @param {string[]} dayNames - Array of day names (e.g., ['monday', 'tuesday'])
 * @returns {number[]} - Array of enum values (e.g., [3, 4])
 */
export const dayNamesToEnumValues = (dayNames) => {
  if (!Array.isArray(dayNames)) return [];
  return dayNames
    .map(dayName => dayNameToEnumValue[dayName?.toLowerCase()])
    .filter(value => value !== undefined && value !== null);
};

/**
 * Convert array of enum values to array of day names
 * @param {number[]} enumValues - Array of enum values (e.g., [3, 4])
 * @returns {string[]} - Array of day names (e.g., ['monday', 'tuesday'])
 */
export const enumValuesToDayNames = (enumValues) => {
  if (!Array.isArray(enumValues)) {
    // If it's a single number, convert to array
    if (typeof enumValues === 'number' && enumValues > 0 && enumValues <= 7) {
      return [enumValueToDayName[enumValues]].filter(Boolean);
    }
    return [];
  }
  return enumValues
    .map(value => enumValueToDayName[value])
    .filter(name => name !== undefined && name !== null);
};

/**
 * Format work days for display
 * @param {number[]|number} workDays - Array of enum values or single enum value
 * @param {Function} t - Translation function
 * @returns {string} - Formatted string (e.g., "Monday, Tuesday, Wednesday")
 */
export const formatWorkDays = (workDays, t) => {
  if (!workDays) return '-';
  
  const dayNames = enumValuesToDayNames(workDays);
  if (dayNames.length === 0) return '-';
  
  const dayLabels = {
    'saturday': t?.('shifts.days.saturday', 'Saturday') || 'Saturday',
    'sunday': t?.('shifts.days.sunday', 'Sunday') || 'Sunday',
    'monday': t?.('shifts.days.monday', 'Monday') || 'Monday',
    'tuesday': t?.('shifts.days.tuesday', 'Tuesday') || 'Tuesday',
    'wednesday': t?.('shifts.days.wednesday', 'Wednesday') || 'Wednesday',
    'thursday': t?.('shifts.days.thursday', 'Thursday') || 'Thursday',
    'friday': t?.('shifts.days.friday', 'Friday') || 'Friday',
  };
  
  // Sort by day order
  const sortedDayNames = dayNames.sort((a, b) => {
    const indexA = dayOrder.indexOf(a);
    const indexB = dayOrder.indexOf(b);
    return indexA - indexB;
  });
  
  return sortedDayNames.map(name => dayLabels[name]).join(', ');
};

