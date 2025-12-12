import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, FileText, Link2, Video, Upload, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { usePropertyVerification } from '@/hooks/useContract';

interface FormData {
  propertyAddress: string;
  description: string;
  documentHash: string;
  gpsLink: string;
  videoLink: string;
}

export function PropertySubmission() {
  const { isConnected } = useWallet();
  const { submitProperty } = usePropertyVerification();

  const [formData, setFormData] = useState<FormData>({
    propertyAddress: '',
    description: '',
    documentHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    gpsLink: '6.5244, 3.3792',
    videoLink: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Connect wallet first');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitProperty(
        formData.propertyAddress || '123 Trust Street, Lagos',
        formData.documentHash,
        formData.videoLink,
        formData.gpsLink,
        1, // kycLevel = 1 (Basic)
        '0.1' // fee in FLOW
      );

      setIsSuccess(true);
      toast.success('Property Submitted!', {
        description: 'Verification in progress...',
      });

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);

    } catch (error: any) {
      toast.error('Failed', {
        description: error.message.includes('insufficient')
          ? 'Need 0.1 FLOW + gas'
          : error.message || 'Try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    { name: 'propertyAddress', label: 'Property Address', icon: MapPin, placeholder: '123 Main St, City, Country' },
    { name: 'documentHash', label: 'Document Hash (IPFS)', icon: FileText, placeholder: 'QmXxx...' },
    { name: 'gpsLink', label: 'GPS Location', icon: Link2, placeholder: '6.5244, 3.3792' },
    { name: 'videoLink', label: 'Video Walkthrough (IPFS)', icon: Video, placeholder: 'bafybei...' },
  ];

  return (
    <section id="submit" className="py-24 relative">
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">List Your Property</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Submit your property for verification. Once approved, tenants can rent with confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden"
        >
          {/* Success Overlay — YOUR EXACT DESIGN */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="relative"
                >
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-center"
                >
                  <h3 className="font-display text-2xl font-bold text-gradient mb-2">
                    Property Submitted!
                  </h3>
                  <p className="text-muted-foreground">Verification in progress...</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute top-1/4 left-1/4">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="absolute top-1/3 right-1/4">
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {inputFields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    {field.label}
                  </label>
                  <div className="relative">
                    <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name as keyof FormData]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="input-glass pl-11"
                      required
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2 text-foreground">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your property (amenities, size, special features...)"
                rows={4}
                className="input-glass resize-none"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex justify-center pt-4"
            >
              <motion.button
                type="submit"
                disabled={isSubmitting || !isConnected}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="btn-primary flex items-center gap-2 min-w-[200px] justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit for Verification (0.1 FLOW)
                  </>
                )}
              </motion.button>
            </motion.div>

            {!isConnected && (
              <p className="text-center text-sm text-muted-foreground">
                Please connect your wallet to submit a property
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}