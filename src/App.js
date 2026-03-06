import { useState } from 'react';
import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import HowItWorks from './components/HowItWorks';
import FeedbackFramework from './components/FeedbackFramework';
import ForInvestors from './components/ForInvestors';
import ProofSection from './components/ProofSection';
import ApplicationSection from './components/ApplicationSection';
import Footer from './components/Footer';
import PartnerModal from './components/PartnerModal';
import useScrollReveal from './hooks/useScrollReveal';

export default function App() {
  useScrollReveal();
  const [partnerOpen, setPartnerOpen] = useState(false);

  return (
    <>
      <Cursor />
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <FeedbackFramework />
      <ForInvestors onPartnerClick={() => setPartnerOpen(true)} />
      <ProofSection />
      <ApplicationSection />
      <Footer />
      <PartnerModal
        isOpen={partnerOpen}
        onClose={() => setPartnerOpen(false)}
      />
    </>
  );
}