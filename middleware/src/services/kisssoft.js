const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

const KISSSOFT_API_URL = 'https://www.kisssoft.com/mykisssoft/api/authenticate';
const PRIVATE_KEY = process.env.KISSSOFT_PRIVATE_KEY || 'O2MKmfI4Nze9SjWQbXRr9F2U7hUfhdcd';

function buildKeys() {
  const unixTime = String(Math.floor(Date.now() / 1000));
  const pbk = Buffer.from(unixTime).toString('base64');
  const pvk = crypto.createHash('sha512').update(unixTime + PRIVATE_KEY).digest('hex');
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

  logger.info('KISSsoft API request', { email, url: KISSSOFT_API_URL });

  const response = await axios.get(url.toString(), { timeout: 10000 });
  const data = response.data;

  logger.info('KISSsoft API response', { email, status: data.status });

  return data;
}

module.exports = { authenticateUser };
