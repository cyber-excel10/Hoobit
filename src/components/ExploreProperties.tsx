import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MapPin, Shield, Eye, X, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { usePropertyVerification } from '@/hooks/useContract';
import { toast } from 'sonner';

interface Property {
  id: string;
  propertyAddress: string;
  documentHash: string;
  string;
  videoHash: string;
  gpsCoordinates: string;
  isVerified: boolean;
  kycLevel: number;
}

export function ExploreProperties() {
  const { address, isConnected } = useWallet();
  const { getLandlordProperties, getPropertyDetails } = usePropertyVerification();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;

    const load = async () => {
      try {
        setLoading(true);
        const ids = await getLandlordProperties(address);
        const list = await Promise.all(
          ids.map(async (id: bigint) => {
            const p = await getPropertyDetails(Number(id));
            return {
              id: id.toString(),
              propertyAddress: p.propertyAddress || 'Unknown Address',
              documentHash: p.documentHash,
              videoHash: p.videoHash,
              gpsCoordinates: p.gpsCoordinates,
              isVerified: p.isVerified,
              kycLevel: Number(p.kycLevel),
            };
          })
        );
        setProperties(list);
      } catch (err) {
        toast.error('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <section className="py-24 text-center">
        <p className="text-lg text-muted-foreground">Connect wallet to view properties</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-24 text-center">
        <p className="text-xl">Loading your verified properties...</p>
      </section>
    );
  }

  return (
    <section id="properties" className="py-24 relative">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Verified Properties</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our collection of verified rental properties. Each listing is thoroughly vetted for your safety.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => setSelectedProperty(property)}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Home className="w-16 h-16 text-primary/60" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                
                {/* Verified Badge */}
                <div className="absolute top-3 left-3">
                  <div className="verified-badge">
                    <Shield className="w-3 h-3" />
                    {property.isVerified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <h3 className="font-semibold text-sm line-clamp-2">{property.propertyAddress}</h3>
                </div>
                
                <p className="text-muted-foreground text-xs line-clamp-2 mb-4">
                  Property ID: {property.id} • KYC Level: {property.kycLevel === 1 ? 'Basic' : 'Enhanced'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-display font-bold text-primary">
                      {property.isVerified ? 'Ready to Rent' : 'Verification Pending'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-primary" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Property Details Modal — YOUR EXACT DESIGN */}
        <AnimatePresence>
          {selectedProperty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
              onClick={() => setSelectedProperty(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-64">
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    <Home className="w-24 h-24 text-white/60" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <button
                    onClick={() => setSelectedProperty(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-4">
                    <div className="verified-badge">
                      <Shield className="w-3 h-3" />
                      {selectedProperty.isVerified ? 'Verified Property' : 'Pending Verification'}
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <h3 className="font-display text-xl font-bold">{selectedProperty.propertyAddress}</h3>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Property ID: <strong>{selectedProperty.id}</strong> • GPS: {selectedProperty.gpsCoordinates}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-card p-4 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">KYC Level</p>
                      <p className="font-bold text-primary">
                        {selectedProperty.kycLevel === 1 ? 'Basic' : 'Enhanced'}
                      </p>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p className="font-bold text-primary">
                        {selectedProperty.isVerified ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="#agreements"
                      onClick={() => setSelectedProperty(null)}
                      className="btn-primary flex-1 text-center py-3"
                    >
                      Create Agreement
                    </a>
                    <a
                      href={`https://ipfs.io/ipfs/${selectedProperty.videoHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center justify-center gap-2 py-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Video Tour
                    </a>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Property submitted successfully
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}