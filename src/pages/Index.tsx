import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { PropertySubmission } from '@/components/PropertySubmission';
import { ExploreProperties } from '@/components/ExploreProperties';
import { CreateAgreement } from '@/components/CreateAgreement';
import { PayRent } from '@/components/PayRent';
import { RentalReceipts } from '@/components/RentalReceipts';
import { DisputeSection } from '@/components/DisputeSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ExploreProperties />
        <PropertySubmission />
        <CreateAgreement />
        <PayRent />
        <RentalReceipts />
        <DisputeSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
