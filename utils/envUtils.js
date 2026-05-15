const BASE_URL = process.env.BASE_URL ?? (() => { throw new Error('BASE_URL not set'); })();
const API_URL  = process.env.API_URL  ?? (() => { throw new Error('API_URL not set'); })();

export { BASE_URL, API_URL };