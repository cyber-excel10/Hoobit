import { motion } from 'framer-motion';
import { Shield, Home, Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export function HeroSection() {
  const features = [
    { icon: Shield, text: 'Verified Properties' },
    { icon: Lock, text: 'Secure Escrow' },
    { icon: Sparkles, text: 'NFT Receipts' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
        
        {/* Gradient Orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-[100px]"
        />
        
        {/* Floating Elements */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container px-4 mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-8"
        >
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm text-muted-foreground">Powered by Flow EVM</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
        >
          <span className="text-foreground">Rent </span>
          <span className="text-gradient">Without </span>
          <br />
          <span className="text-gradient-purple">Fear</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          The first decentralized rental escrow platform. Verified properties, 
          secure deposits, and NFT receipts — all on-chain.
        </motion.p>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-5 py-2.5 glass-card rounded-full"
            >
              <feature.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <motion.a
            href="#properties"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center gap-2 text-lg"
          >
            <Home className="w-5 h-5" />
            Explore Properties
            <ArrowRight className="w-4 h-4" />
          </motion.a>
          <motion.a
            href="#submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center gap-2"
          >
            List Your Property
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { value: '100+', label: 'Verified Properties' },
            { value: '$2M+', label: 'Secured in Escrow' },
            { value: '500+', label: 'Happy Tenants' },
            { value: '0', label: 'Disputes Lost' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -5 }}
              className="glass-card p-4 rounded-xl text-center"
            >
              <p className="font-display text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 text-muted-foreground"
        >
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Audited Smart Contracts</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>KYC Verified Landlords</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>24/7 Dispute Resolution</span>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
