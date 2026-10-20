import { once } from 'node:events';
import type { AddressInfo } from 'node:net';

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  cookie?: string;
}

export interface TestServer {
  base: string;
  request: <T = any>(
    path: string,
    options?: { method?: string; body?: unknown; cookie?: string },
  ) => Promise<ApiResponse<T>>;
  loginDemo: () => Promise<string>;
  signup: (name: string, email: string, password: string) => Promise<string>;
  close: () => Promise<void>;
}

/**
 * Boots the Express app against a private in-memory SQLite database.
 * Must set env before importing the server modules.
 */
export async function startTestServer(): Promise<TestServer> {
  process.env.DB_PATH = ':memory:';
  process.env.SEED_ON_START = 'false';
  process.env.NODE_ENV = 'test';
  delete process.env.AI_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const { createApp } = await import('../server/index.ts');
  const { seedDatabase } = await import('../server/seed/index.ts');
  seedDatabase({ quiet: true });

  const app = createApp();
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}/api`;

  const request = async <T = any>(
    path: string,
    options: { method?: string; body?: unknown; cookie?: string } = {},
  ): Promise<ApiResponse<T>> => {
    const response = await fetch(`${base}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.cookie ? { Cookie: options.cookie } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    const setCookie = response.headers.get('set-cookie');
    return {
      status: response.status,
      data: data as T,
      cookie: setCookie ? setCookie.split(';')[0] : undefined,
    };
  };

  const loginDemo = async (): Promise<string> => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: { email: 'demo@studaymentor.app', password: 'Demo@1234' },
    });
    if (response.status !== 200 || !response.cookie) {
      throw new Error(`Demo login failed: ${response.status} ${JSON.stringify(response.data)}`);
    }
    return response.cookie;
  };

  const signup = async (name: string, email: string, password: string): Promise<string> => {
    const response = await request('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    });
    if (response.status !== 201 || !response.cookie) {
      throw new Error(`Signup failed: ${response.status} ${JSON.stringify(response.data)}`);
    }
    return response.cookie;
  };

  return {
    base,
    request,
    loginDemo,
    signup,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export function uniqueEmail(prefix = 'learner'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;
}
