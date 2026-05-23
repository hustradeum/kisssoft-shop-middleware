const BLOCKED_COUNTRIES = new Set(['RU', 'BY', 'IR', 'SY', 'KP', 'SD', 'CU', 'VE', 'JP']);

// Ukraine: only Crimea, Donetsk (Luhansk) regions are blocked
// KISSsoft API returns state as a string — using .includes() for fuzzy match
// since exact string values from the API are unconfirmed
const BLOCKED_UA_REGIONS = ['crimea', 'donetsk', 'luhansk', 'lugansk'];

function isBlocked(country, state) {
  if (!country) return false;

  const countryUpper = country.toUpperCase().trim();

  if (BLOCKED_COUNTRIES.has(countryUpper)) return true;

  if (countryUpper === 'UA' && state) {
    const stateLower = state.toLowerCase().trim();
    return BLOCKED_UA_REGIONS.some((region) => stateLower.includes(region));
  }

  return false;
}

module.exports = { isBlocked };
