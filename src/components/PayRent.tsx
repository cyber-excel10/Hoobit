import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, Home, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';

// Mock active agreements
const MOCK_AGREEMENTS = [
  {
    id: 1,
    propertyAddress: '456 Ocean Drive, Miami Beach, FL',
    monthlyRent: '2500',
    nextRentDue: Date.now() + 86400000 * 5, // 5 days from now
    isActive: true,
  },
  {
    id: 2,
    propertyAddress: '789 Park Avenue, New York, NY',
    monthlyRent: '8500',
    nextRentDue: Date.now() + 86400000 * 12, // 12 days from now
    isActive: true,
  },
];

interface Agreement {
  id: number;
  propertyAddress: string;
  monthlyRent: string;
  nextRentDue: number;
  isActive: boolean;
}

export function PayRent() {
  const { isConnected } = useWallet();
  const { sendTransaction } = useContract();
  
  const [agreements, setAgreements] = useState<Agreement[]>(MOCK_AGREEMENTS);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [countdowns, setCountdowns] = useState<{ [key: number]: string }>({});

  // TODO: Replace with actual contract call
  // useEffect(() => {
  //   async function fetchAgreements() {
  //     const ids = await callMethod('getMyAgreements');
  //     const agreements = await Promise.all(ids.map(id => callMethod('getAgreement', [id])));
  //     setAgreements(agreements);
  //   }
  //   if (isConnected) fetchAgreements();
  // }, [isConnected]);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: { [key: number]: string } = {};
      
      agreements.forEach(agreement => {
        const diff = agreement.nextRentDue - Date.now();
        
        if (diff <= 0) {
          newCountdowns[agreement.id] = 'Due Now!';
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            newCountdowns[agreement.id] = `${days}d ${hours}h ${minutes}m`;
          } else {
            newCountdowns[agreement.id] = `${hours}h ${minutes}m`;
          }
        }
      });
      
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, [agreements]);

  const handlePayRent = async (agreementId: number, amount: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setPayingId(agreementId);

    try {
      // TODO: Replace with actual contract call
      // const amountWei = ethers.parseEther(amount);
      // await sendTransaction('payRent', [agreementId], { value: amountWei });

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Rent Paid Successfully!', {
        description: 'NFT receipt has been minted to your wallet.',
      });

      // Update next due date
      setAgreements(prev => prev.map(a => 
        a.id === agreementId 
          ? { ...a, nextRentDue: a.nextRentDue + 30 * 24 * 60 * 60 * 1000 }
          : a
      ));
    } catch (error: any) {
      toast.error('Failed to pay rent', {
        description: error.message || 'Please try again',
      });
    } finally {
      setPayingId(null);
    }
  };

  const getDaysUntilDue = (dueDate: number) => {
    const diff = dueDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 0) return 'text-destructive';
    if (days <= 3) return 'text-orange-500';
    if (days <= 7) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <section id="rent" className="py-24 relative">
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Pay Monthly Rent</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay on top of your payments. Each payment mints an NFT receipt as proof.
          </p>
        </motion.div>

        <div className="space-y-6">
          {agreements.map((agreement, index) => {
            const daysUntil = getDaysUntilDue(agreement.nextRentDue);
            const urgencyColor = getUrgencyColor(daysUntil);
            
            return (
              <motion.div
                key={agreement.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Property Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Home className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{agreement.propertyAddress}</h3>
                      <p className="text-sm text-muted-foreground">Agreement #{agreement.id}</p>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="flex flex-col items-center md:items-end">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      Next Payment Due
                    </div>
                    <div className={`font-display text-2xl font-bold ${urgencyColor}`}>
                      {countdowns[agreement.id] || '...'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(agreement.nextRentDue).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Amount & Pay Button */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-display text-xl font-bold text-primary">
                        ${agreement.monthlyRent}
                      </p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: payingId === agreement.id ? 1 : 1.02 }}
                      whileTap={{ scale: payingId === agreement.id ? 1 : 0.98 }}
                      disabled={payingId !== null || !isConnected}
                      onClick={() => handlePayRent(agreement.id, agreement.monthlyRent)}
                      className="btn-primary min-w-[120px] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {payingId === agreement.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Paying...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          Pay Rent
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Payment Period</span>
                    <span>{30 - Math.max(0, daysUntil)} of 30 days</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${((30 - Math.max(0, daysUntil)) / 30) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {agreements.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">No Active Agreements</h3>
              <p className="text-muted-foreground">
                You don't have any active rental agreements yet.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
