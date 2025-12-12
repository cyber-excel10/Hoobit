import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, DollarSign, Calendar, Loader2, Lock, Sparkles, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { useEscrow } from '@/hooks/useContract';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';

interface AgreementForm {
  propertyId: string;
  landlord: string;           
  depositAmount: string;
  monthlyRent: string;
  startDate: string;
  endDate: string;
  metadataHash?: string;
}

export function CreateAgreement() {
  const { isConnected, address } = useWallet();
  const { createAgreement } = useEscrow();

  const [formData, setFormData] = useState<AgreementForm>({
    propertyId: '',
    landlord: '',
    depositAmount: '',
    monthlyRent: '',
    startDate: '',
    endDate: '',
    metadataHash: 'ipfs://trustlease-demo-metadata',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEscrowAnimation, setShowEscrowAnimation] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#8b5cf6', '#ec4899'],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }

    setIsSubmitting(true);
    setShowEscrowAnimation(true);

    try {
      const startTimestamp = Math.floor(new Date(formData.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formData.endDate).getTime() / 1000);
      const rentInterval = 30 * 24 * 60 * 60; // 30 days

      const result = await createAgreement(
        Number(formData.propertyId),
        formData.landlord,
        formData.monthlyRent,
        rentInterval,
        startTimestamp,
        endTimestamp,
        formData.metadataHash || '',
        formData.depositAmount
      );

      setShowEscrowAnimation(false);
      setShowSuccess(true);
      triggerConfetti();

      toast.success('Agreement Created!', {
        description: `TX: ${result.transactionHash.slice(0, 10)}...`,
      });

      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          propertyId: '',
          landlord: '',
          depositAmount: '',
          monthlyRent: '',
          startDate: '',
          endDate: '',
        });
      }, 5000);

    } catch (error: any) {
      setShowEscrowAnimation(false);
      toast.error('Failed', {
        description: error.message.includes('insufficient')
          ? `Need ${formData.depositAmount} FLOW + gas`
          : error.message || 'Try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="agreements" className="py-24 relative">
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-purple">Create Agreement</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Lock your deposit in secure escrow. Protected by smart contracts, released only when conditions are met.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden"
        >
          {/* Escrow Animation Overlay */}
          <AnimatePresence>
            {showEscrowAnimation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-20"
              >
                <motion.div className="relative">
                  {/* Lock Container */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center"
                  >
                    <Lock className="w-16 h-16 text-primary" />
                  </motion.div>
                  
                  {/* Orbiting Coins */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                      style={{
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{
                        x: [0, 60, 0, -60, 0],
                        y: [-60, 0, 60, 0, -60],
                        scale: [1, 0.8, 1, 0.8, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    >
                      <DollarSign className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  ))}
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 font-display text-xl text-gradient"
                >
                  Locking Deposit in Escrow...
                </motion.p>
                <motion.p className="text-muted-foreground text-sm mt-2">
                  Please confirm the transaction in your wallet
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-20"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  <PartyPopper className="w-20 h-20 text-primary" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 font-display text-3xl font-bold text-gradient"
                >
                  Agreement Created!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mt-2"
                >
                  Deposit securely locked in escrow
                </motion.p>
                
                {/* Floating sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${10 + Math.random() * 80}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Property ID</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    placeholder="Enter verified property ID"
                    className="input-glass pl-11"
                    required
                  />
                </div>
              </div>

               <div>
  <label className="block text-sm font-medium mb-2">Landlord Wallet Address</label>
  <div className="relative">
    <input
      type="text"
      name="landlord"
      value={formData.landlord}
      onChange={handleChange}
      onPaste={(e) => e.stopPropagation()}   // ← Fixes paste issue!
      placeholder="0x1234...5678"
      className="input-glass w-full px-4 py-3 text-sm font-mono"
      autoComplete="off"
      spellCheck={false}
      required
    />
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    Right-click → Paste or Ctrl+V works perfectly
  </p>
</div>

              <div>
                <label className="block text-sm font-medium mb-2">Security Deposit (FLOW)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    placeholder="5000"
                    step="0.01"
                    className="input-glass pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monthly Rent (FLOW)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    placeholder="2500"
                    step="0.01"
                    className="input-glass pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-glass pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="input-glass pl-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Secure Escrow</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your deposit will be locked in a smart contract and can only be released when the rental period ends or through dispute resolution.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <motion.button
                type="submit"
                disabled={isSubmitting || !isConnected}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="btn-primary flex items-center gap-2 min-w-[220px] justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Create Agreement & Lock Deposit
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
