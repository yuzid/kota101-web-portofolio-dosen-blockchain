import { BLOCKCHAIN_NODES, BlockchainNode } from '../lib/blockchainNode';

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

export type MultiChainStreamItem = {
  txid: string;
  confirmations: number;
  blockheight?: number;
  blocktime?: number;
  time?: number;
  publishers: string[];
  keys: string[];
  data: {
    json?: Record<string, unknown>;
  };
  valid: boolean;
};

export class MultiChainService {
  private nextNodeIndex = 0;

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

  private hasCompleteConfig(node: BlockchainNode) {
    return Boolean(
      process.env[`${node}_IP`] &&
      process.env[`${node}_RPC_PORT`] &&
      process.env[`${node}_RPC_USERNAME`] &&
      process.env[`${node}_RPC_PASSWORD`],
    );
  }

  private getConfiguredNodes(): BlockchainNode[] {
    const nodes = BLOCKCHAIN_NODES.filter((node) => this.hasCompleteConfig(node));

    if (nodes.length === 0) {
      throw new Error(
        `Konfigurasi blockchain belum lengkap. Isi minimal satu node: ${BLOCKCHAIN_NODES.join(', ')}.`,
      );
    }

    return nodes;
  }

  private getNextNode(): BlockchainNode {
    const nodes = this.getConfiguredNodes();
    const node = nodes[this.nextNodeIndex % nodes.length];
    this.nextNodeIndex = (this.nextNodeIndex + 1) % nodes.length;
    return node;
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

  async publishJson(
    key: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const streamName = process.env.AUDIT_STREAM_NAME;
    if (!streamName) {
      throw new Error('AUDIT_STREAM_NAME belum dikonfigurasi.');
    }

    const txId = await this.callRpc<string>(
      this.getNextNode(),
      'publish',
      [streamName, key, { json: payload }],
    );

    if (typeof txId !== 'string' || !txId) {
      throw new Error('Response publish tidak berisi transaction ID.');
    }

    return txId;
  }

  async getJsonStreamItems(
    key: string,
    count = 100,
  ): Promise<MultiChainStreamItem[]> {
    const streamName = process.env.AUDIT_STREAM_NAME;
    if (!streamName) {
      throw new Error('AUDIT_STREAM_NAME belum dikonfigurasi.');
    }

    const items = await this.callRpc<MultiChainStreamItem[]>(
      this.getNextNode(),
      'liststreamkeyitems',
      [streamName, key, true, count, 0],
    );

    return items
      .filter((item) => item.valid !== false && item.data?.json)
      .sort((a, b) => (b.blocktime || b.time || 0) - (a.blocktime || a.time || 0));
  }
}
