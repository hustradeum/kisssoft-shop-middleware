const BLOCKED_COUNTRIES = new Set(['RU', 'BY', 'IR', 'SY', 'KP', 'SD', 'CU', 'VE', 'JP']);

// ISO-3166-2: UA-43 Crimea, UA-14 Donetsk, UA-09 Luhansk
const BLOCKED_UA_ISO = new Set(['UA-43', 'UA-14', 'UA-09']);
const BLOCKED_UA_NAMES = ['crimea', 'donetsk', 'luhansk', 'lugansk'];

function isGeoBlocked(country, state) {
  if (!country) return false;

  const c = country.toUpperCase().trim();
  if (BLOCKED_COUNTRIES.has(c)) return true;

  if (c === 'UA' && state) {
    const s = state.toUpperCase().trim();
    if (BLOCKED_UA_ISO.has(s)) return true;
    const sLower = s.toLowerCase();
    return BLOCKED_UA_NAMES.some((r) => sLower.includes(r));
  }

  return false;
}

module.exports = { isGeoBlocked };
