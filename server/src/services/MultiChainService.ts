import { BlockchainNode } from '../lib/blockchainNode';

type MultiChainConfig = {
  ip: string;
  port: string;
  username: string;
  password: string;
};

type RpcResponse<T> = {
  result?: T;
  error?: { message?: string } | null;
};

type MultiChainStream = {
  name?: string;
  open?: boolean;
  restrictions?: {
    write?: boolean;
  };
};

export class MultiChainService {
  private getConfig(node: BlockchainNode): MultiChainConfig {
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

  private async callRpc<T>(node: BlockchainNode, method: string, params: unknown[]): Promise<T> {
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
          id: `${method}-${Date.now()}`,
          method,
          params,
        }),
        signal: controller.signal,
      });

      const result = await response.json() as RpcResponse<T>;

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      if (result.result === undefined) {
        throw new Error(`Response ${method} tidak berisi result.`);
      }

      return result.result;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`RPC blockchain ${node} timeout saat menjalankan ${method}.`);
      }
      throw new Error(`RPC blockchain ${node} gagal menjalankan ${method}: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async getNewAddress(node: BlockchainNode): Promise<string> {
    const address = await this.callRpc<string>(node, 'getnewaddress', []);

    if (typeof address !== 'string' || !address) {
      throw new Error('Response getnewaddress tidak berisi alamat blockchain.');
    }

    return address;
  }

  async provisionPublisherAddress(node: BlockchainNode, address: string): Promise<void> {
    const streamName = process.env.AUDIT_STREAM_NAME;
    if (!streamName) {
      throw new Error('AUDIT_STREAM_NAME belum dikonfigurasi.');
    }

    const streams = await this.callRpc<MultiChainStream[]>(node, 'liststreams', [streamName]);
    const stream = streams[0];

    if (!stream) {
      throw new Error(`Stream blockchain "${streamName}" tidak ditemukan.`);
    }

    await this.callRpc<unknown>(node, 'grant', [address, 'send,receive']);

    const isWriteRestricted = stream.open === false || stream.restrictions?.write === true;
    if (isWriteRestricted) {
      await this.callRpc<unknown>(node, 'grant', [address, `${streamName}.write`]);
    }
  }

  async createPublisherAddress(node: BlockchainNode): Promise<string> {
    const address = await this.getNewAddress(node);
    await this.provisionPublisherAddress(node, address);
    return address;
  }

  async publishJson(
    node: BlockchainNode,
    address: string,
    key: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const streamName = process.env.AUDIT_STREAM_NAME;
    if (!streamName) {
      throw new Error('AUDIT_STREAM_NAME belum dikonfigurasi.');
    }

    const txId = await this.callRpc<string>(
      node,
      'publishfrom',
      [address, streamName, key, { json: payload }],
    );

    if (typeof txId !== 'string' || !txId) {
      throw new Error('Response publishfrom tidak berisi transaction ID.');
    }

    return txId;
  }
}
