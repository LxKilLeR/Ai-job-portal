const { URL } = require('url');

const getBackendBaseUrl = () => {
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_API_URL || '';
  if (!backendUrl) {
    throw new Error('BACKEND_URL is not configured. Set it in Netlify environment variables.');
  }
  return backendUrl.replace(/\/$/, '');
};

exports.handler = async (event) => {
  try {
    const backendBaseUrl = getBackendBaseUrl();
    const requestUrl = new URL(event.rawUrl || `https://example.com${event.path || ''}`);
    let pathname = requestUrl.pathname;

    if (pathname.startsWith('/.netlify/functions/api-proxy')) {
      pathname = pathname.replace('/.netlify/functions/api-proxy', '');
    }

    if (pathname.startsWith('/api')) {
      pathname = pathname.slice(4);
    }

    if (!pathname.startsWith('/')) {
      pathname = `/${pathname}`;
    }

    const targetUrl = `${backendBaseUrl}/api${pathname}${requestUrl.search}`;
    const headers = { ...event.headers };
    delete headers.host;
    delete headers['content-length'];
    delete headers['x-forwarded-for'];
    delete headers['x-forwarded-proto'];
    delete headers['x-nf-client-connection-ip'];

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: event.httpMethod === 'GET' || event.httpMethod === 'HEAD' ? undefined : event.body,
    });

    const responseBody = await response.text();
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ success: false, message: error.message || 'API proxy error' }),
    };
  }
};
