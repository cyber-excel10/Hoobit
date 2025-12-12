import { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, ExternalLink, Calendar, Hash, Sparkles } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

// Mock NFT receipts
const MOCK_RECEIPTS = [
  {
    id: 1,
    agreementId: 1,
    propertyAddress: '456 Ocean Drive, Miami Beach',
    amount: '2500',
    timestamp: Date.now() - 86400000 * 30,
    tokenURI: 'ipfs://QmXxxxx...yyyy',
    txHash: '0x1234...5678',
  },
  {
    id: 2,
    agreementId: 1,
    propertyAddress: '456 Ocean Drive, Miami Beach',
    amount: '2500',
    timestamp: Date.now() - 86400000 * 60,
    tokenURI: 'ipfs://QmYyyy...zzzz',
    txHash: '0xabcd...efgh',
  },
  {
    id: 3,
    agreementId: 2,
    propertyAddress: '789 Park Avenue, New York',
    amount: '8500',
    timestamp: Date.now() - 86400000 * 15,
    tokenURI: 'ipfs://QmZzzz...aaaa',
    txHash: '0x9876...5432',
  },
];

interface NFTReceipt {
  id: number;
  agreementId: number;
  propertyAddress: string;
  amount: string;
  timestamp: number;
  tokenURI: string;
  txHash: string;
}

export function RentalReceipts() {
  const { isConnected } = useWallet();
  const [receipts] = useState<NFTReceipt[]>(MOCK_RECEIPTS);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // TODO: Replace with actual contract call
  // useEffect(() => {
  //   async function fetchReceipts() {
  //     const agreementIds = await callMethod('getMyAgreements');
  //     const allReceipts = [];
  //     for (const id of agreementIds) {
  //       const receipts = await callMethod('getRentReceipts', [id]);
  //       allReceipts.push(...receipts);
  //     }
  //     setReceipts(allReceipts);
  //   }
  //   if (isConnected) fetchReceipts();
  // }, [isConnected]);

  return (
    <section id="receipts" className="py-24 relative">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-purple">NFT Rent Receipts</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your payment history as NFTs. Immutable proof of every rent payment, stored forever on-chain.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              onHoverStart={() => setHoveredId(receipt.id)}
              onHoverEnd={() => setHoveredId(null)}
              className="glass-card rounded-2xl overflow-hidden relative group"
            >
              {/* NFT Visual */}
              <div className="relative h-48 bg-gradient-to-br from-accent/20 via-primary/10 to-transparent flex items-center justify-center">
                <motion.div
                  animate={hoveredId === receipt.id ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="relative"
                >
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-accent to-neon-pink flex items-center justify-center">
                    <Receipt className="w-12 h-12 text-primary-foreground" />
                  </div>
                  
                  {/* Glow effect on hover */}
                  <motion.div
                    animate={hoveredId === receipt.id ? { opacity: 1 } : { opacity: 0 }}
                    className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl -z-10"
                  />
                </motion.div>

                {/* Sparkles */}
                {hoveredId === receipt.id && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-4 right-6"
                    >
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="absolute bottom-6 left-6"
                    >
                      <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                    </motion.div>
                  </>
                )}

                {/* Token ID Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background/50 backdrop-blur-sm border border-border text-xs font-mono">
                  #{receipt.id.toString().padStart(4, '0')}
                </div>
              </div>

              {/* Receipt Details */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display text-2xl font-bold text-gradient">
                    ${receipt.amount}
                  </div>
                  <div className="verified-badge">
                    <Receipt className="w-3 h-3" />
                    NFT
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                  {receipt.propertyAddress}
                </p>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(receipt.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    <span className="font-mono truncate">{receipt.txHash}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <motion.a
                    href={`https://evm-testnet.flowscan.io/tx/${receipt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View TX
                  </motion.a>
                  <motion.a
                    href={`https://ipfs.io/ipfs/${receipt.tokenURI.replace('ipfs://', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Metadata
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {receipts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 rounded-2xl text-center max-w-md mx-auto"
          >
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">No Receipts Yet</h3>
            <p className="text-muted-foreground">
              Your NFT rent receipts will appear here after making payments.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
