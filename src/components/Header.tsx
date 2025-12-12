import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, AlertTriangle, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { 
    address, 
    balance, 
    isConnected, 
    isConnecting, 
    isWrongNetwork,
    connect, 
    disconnect, 
    switchNetwork,
    shortenAddress,
    networkConfig 
  } = useWallet();
  
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="glass-card mx-4 mt-4 px-6 py-4 rounded-2xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-lg">TL</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg -z-10" />
            </div>
            <span className="font-display text-xl font-bold text-gradient">TrustLease</span>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {['Properties', 'Agreements', 'Receipts', 'Disputes'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium"
                whileHover={{ y: -2 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {isWrongNetwork && isConnected && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={switchNetwork}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/20 border border-destructive/50 rounded-xl text-destructive text-sm font-medium hover:bg-destructive/30 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Wrong Network
              </motion.button>
            )}

            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connect}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  'Connect Wallet'
                )}
              </motion.button>
            ) : (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 px-4 py-2 glass-card rounded-xl border border-primary/30 hover:border-primary/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium">{shortenAddress(address!)}</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                    <span>{parseFloat(balance || '0').toFixed(3)}</span>
                    <span className="text-muted-foreground">FLOW</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 glass-card rounded-xl p-2 border border-glass-border"
                  >
                    <div className="p-3 border-b border-border">
                      <p className="text-xs text-muted-foreground">Connected to</p>
                      <p className="text-sm font-medium text-primary">{networkConfig.name}</p>
                    </div>
                    <a
                      href={`${networkConfig.blockExplorer}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Explorer
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2 w-full p-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
