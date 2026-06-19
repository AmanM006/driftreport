import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { endpoint, pendoKey, method = 'GET', body } = await request.json();

    if (!endpoint || !pendoKey) {
      return NextResponse.json(
        { error: 'Missing endpoint or pendoKey in request body.' },
        { status: 400 }
      );
    }

    // Sanitize endpoint path
    const cleanEndpoint = endpoint.replace(/^\/+/, '');

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'x-pendo-integration-key': pendoKey,
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`https://app.pendo.io/api/v1/${cleanEndpoint}`, fetchOptions);

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Pendo API error: ${response.statusText}. Details: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error in pendo-proxy:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
