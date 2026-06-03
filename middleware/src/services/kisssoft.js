const crypto = require('crypto');
const axios = require('axios');

const KISSSOFT_API_URL = 'https://www.kisssoft.com/mykisssoft/api/authenticate';

function buildKeys() {
  const unixTime = String(Math.floor(Date.now() / 1000));
  const pbk = Buffer.from(unixTime).toString('base64');
  const pvk = crypto
    .createHash('sha512')
    .update(unixTime + process.env.KISSSOFT_PRIVATE_KEY)
    .digest('hex');
  return { pbk, pvk };
}

async function authenticateUser(email, password) {
  const { pbk, pvk } = buildKeys();

  const url = new URL(KISSSOFT_API_URL);
  url.searchParams.set('pbk', pbk);
  url.searchParams.set('pvk', pvk);
  url.searchParams.set('request-type', 'shop');
  url.searchParams.set('email', email);
  url.searchParams.set('password', password);

  const response = await axios.get(url.toString(), {
    timeout: 10000,
    validateStatus: () => true,
  });

  if (response.status >= 500) {
    console.warn(
      `[KISSSOFT-500] ${new Date().toISOString()} email=${email} httpStatus=${response.status}`
    );
    return { status: 'restricted' };
  }

  return response.data;
}

module.exports = { buildKeys, authenticateUser };
