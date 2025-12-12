import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, FileImage, Loader2, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';

interface DisputeForm {
  agreementId: string;
  description: string;
  evidenceFiles: File[];
}

type DisputeStatus = 'pending' | 'resolving' | 'resolved';

// Mock disputes
const MOCK_DISPUTES = [
  {
    id: 1,
    agreementId: 1,
    description: 'Property condition not as described. Multiple appliances non-functional.',
    status: 'resolving' as DisputeStatus,
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 2,
    agreementId: 2,
    description: 'Security deposit not returned after lease ended.',
    status: 'resolved' as DisputeStatus,
    timestamp: Date.now() - 86400000 * 10,
    resolution: 'in_favor_of_tenant',
  },
];

interface Dispute {
  id: number;
  agreementId: number;
  description: string;
  status: DisputeStatus;
  timestamp: number;
  resolution?: string;
}

export function DisputeSection() {
  const { isConnected } = useWallet();
  const { sendTransaction } = useContract();
  
  const [formData, setFormData] = useState<DisputeForm>({
    agreementId: '',
    description: '',
    evidenceFiles: [],
  });
  
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index),
    }));
  };

  const uploadToIPFS = async (files: File[]): Promise<string> => {
    // TODO: Implement actual IPFS upload
    // Example using web3.storage or Pinata:
    // const client = new Web3Storage({ token: YOUR_TOKEN });
    // const cid = await client.put(files);
    // return cid;

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
    
    return 'QmXxxxx...yyyy'; // Placeholder CID
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (formData.evidenceFiles.length === 0) {
      toast.error('Please upload at least one evidence file');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload evidence to IPFS
      const evidenceHash = await uploadToIPFS(formData.evidenceFiles);
      
      // TODO: Replace with actual contract call
      // await sendTransaction('raiseDispute', [
      //   parseInt(formData.agreementId),
      //   formData.description,
      //   evidenceHash,
      // ]);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add new dispute to list
      setDisputes(prev => [{
        id: prev.length + 1,
        agreementId: parseInt(formData.agreementId),
        description: formData.description,
        status: 'pending',
        timestamp: Date.now(),
      }, ...prev]);
      
      toast.success('Dispute Submitted!', {
        description: 'Our resolution team will review your case within 24-48 hours.',
      });

      setFormData({
        agreementId: '',
        description: '',
        evidenceFiles: [],
      });
    } catch (error: any) {
      toast.error('Failed to submit dispute', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getStatusConfig = (status: DisputeStatus) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pending Review' };
      case 'resolving':
        return { icon: Loader2, color: 'text-accent', bg: 'bg-accent/10', label: 'In Resolution' };
      case 'resolved':
        return { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', label: 'Resolved' };
    }
  };

  return (
    <section id="disputes" className="py-24 relative">
      <div className="container px-4 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Dispute Resolution</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Having issues? Submit a dispute with evidence. Our decentralized arbitration system ensures fair resolution.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submit Dispute Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-6 md:p-8 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-display text-xl font-bold">Raise Dispute</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Agreement ID</label>
                <input
                  type="text"
                  value={formData.agreementId}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreementId: e.target.value }))}
                  placeholder="Enter your agreement ID"
                  className="input-glass"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="input-glass resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Evidence (Images)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB each
                    </p>
                  </label>
                </div>

                {/* Uploaded Files */}
                <AnimatePresence>
                  {formData.evidenceFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-2"
                    >
                      {formData.evidenceFiles.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileImage className="w-4 h-4 text-primary" />
                            <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-background rounded transition-colors"
                          >
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading to IPFS...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting || !isConnected}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Dispute
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Dispute Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="font-display text-xl font-bold mb-6">Your Disputes</h3>

            {disputes.map((dispute, index) => {
              const statusConfig = getStatusConfig(dispute.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-5 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Dispute #{dispute.id}</span>
                      <span className="text-xs text-muted-foreground">
                        Agreement #{dispute.agreementId}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className={`w-3 h-3 ${dispute.status === 'resolving' ? 'animate-spin' : ''}`} />
                      {statusConfig.label}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {dispute.description}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(dispute.timestamp).toLocaleDateString()}
                  </p>

                  {dispute.resolution && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-primary text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Resolved in favor of tenant
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {disputes.length === 0 && (
              <div className="glass-card p-8 rounded-xl text-center">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">No disputes filed</p>
              </div>
            )}

            {/* Resolution Timeline */}
            <div className="glass-card p-5 rounded-xl mt-6">
              <h4 className="font-medium mb-4">Resolution Timeline</h4>
              <div className="relative pl-8 space-y-6">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-muted" />
                
                {[
                  { label: 'Dispute Filed', icon: Send, done: true },
                  { label: 'Evidence Review', icon: FileImage, done: true },
                  { label: 'Arbitration', icon: AlertTriangle, active: true },
                  { label: 'Resolution', icon: CheckCircle2, done: false },
                ].map((step, index) => (
                  <div key={step.label} className="relative flex items-center gap-3">
                    <div className={`absolute -left-5 w-4 h-4 rounded-full flex items-center justify-center
                      ${step.done ? 'bg-primary' : step.active ? 'bg-accent animate-pulse' : 'bg-muted'}`}>
                      <step.icon className={`w-2 h-2 ${step.done || step.active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm ${step.done ? 'text-foreground' : step.active ? 'text-accent' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
