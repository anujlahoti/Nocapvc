import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactGA from 'react-ga4';
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
import InstagramFeed from './components/InstagramFeed';
import PartnerModal from './components/PartnerModal';
import School from './components/school/School';
import useScrollReveal from './hooks/useScrollReveal';

function MainSite() {
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
      <InstagramFeed />
      <ApplicationSection />
      <Footer />
      <PartnerModal
        isOpen={partnerOpen}
        onClose={() => setPartnerOpen(false)}
      />
    </>
  );
}

export default function App() {
  useEffect(() => {
    ReactGA.initialize(process.env.REACT_APP_GA_ID);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/school/*" element={<School />} />
      </Routes>
    </BrowserRouter>
  );
}