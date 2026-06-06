export type BlockchainNode = 'D3' | 'D4';

const PRODI_NODE_BY_CODE: Record<string, BlockchainNode> = {
  'D3-TI': 'D3',
  'D4-TI': 'D4',
};

const PRODI_NODE_BY_NAME: Record<string, BlockchainNode> = {
  'D3 TEKNIK INFORMATIKA': 'D3',
  'D4 TEKNIK INFORMATIKA': 'D4',
};

export function resolveBlockchainNode(programStudi: {
  kode_prodi: string;
  nama_prodi: string;
}): BlockchainNode {
  const kodeProdi = programStudi.kode_prodi.trim().toUpperCase();
  const namaProdi = programStudi.nama_prodi.trim().toUpperCase();
  const node = PRODI_NODE_BY_CODE[kodeProdi] || PRODI_NODE_BY_NAME[namaProdi];

  if (!node) {
    throw new Error(`Program studi "${programStudi.nama_prodi}" belum dipetakan ke node blockchain.`);
  }

  return node;
}
