import { motion } from 'framer-motion';
import { Github, Twitter, MessageCircle, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 border-t border-border relative">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.div 
              className="flex items-center gap-3 mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-lg">TL</span>
              </div>
              <span className="font-display text-xl font-bold text-gradient">TrustLease</span>
            </motion.div>
            <p className="text-muted-foreground text-sm max-w-sm">
              The first decentralized rental escrow platform on Flow EVM. 
              Secure deposits, verified properties, and NFT receipts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#properties" className="hover:text-foreground transition-colors">Explore Properties</a></li>
              <li><a href="#submit" className="hover:text-foreground transition-colors">List Property</a></li>
              <li><a href="#agreements" className="hover:text-foreground transition-colors">Create Agreement</a></li>
              <li><a href="#disputes" className="hover:text-foreground transition-colors">Disputes</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://docs.flow.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                  Flow Docs <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
                  Smart Contracts <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">FAQ</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} TrustLease. Built for Flow Hackathon.
          </p>
          
          <div className="flex items-center gap-4">
            <motion.a
              href="https://github.com/cyber-excel10/Hoobit"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <Github className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}
