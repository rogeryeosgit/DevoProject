import https from 'https';

// to be removed when deployed to server - workaround for localhost certificate issues
export default function ({ $axios }) {
    $axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
}