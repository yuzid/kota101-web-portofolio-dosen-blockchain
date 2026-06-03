type MultiChainNode = 'D3' | 'D4';

type MultiChainConfig = {
  ip: string;
  port: string;
  username: string;
  password: string;
};

export class MultiChainService {
  private getConfig(node: MultiChainNode): MultiChainConfig {
    const config = {
      ip: process.env[`${node}_IP`],
      port: process.env[`${node}_RPC_PORT`],
      username: process.env[`${node}_RPC_USERNAME`],
      password: process.env[`${node}_RPC_PASSWORD`],
    };

    const missing = Object.entries(config)
      .filter(([, value]) => !value)
      .map(([key]) => `${node}_${key === 'ip' ? 'IP' : `RPC_${key.toUpperCase()}`}`);

    if (missing.length > 0) {
      throw new Error(`Konfigurasi blockchain ${node} belum lengkap: ${missing.join(', ')}.`);
    }

    return config as MultiChainConfig;
  }

  async getNewAddress(node: MultiChainNode): Promise<string> {
    const config = this.getConfig(node);
    const rpcUrl = `http://${config.ip}:${config.port}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: `getnewaddress-${Date.now()}`,
          method: 'getnewaddress',
          params: [],
        }),
        signal: controller.signal,
      });

      const result = await response.json() as { result?: unknown; error?: { message?: string } | null };

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      if (typeof result.result !== 'string' || !result.result) {
        throw new Error('Response getnewaddress tidak berisi alamat blockchain.');
      }

      return result.result;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`RPC blockchain ${node} timeout saat membuat address baru.`);
      }
      throw new Error(`Gagal membuat address blockchain ${node}: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
