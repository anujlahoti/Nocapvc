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
import School from './components/School/School';
import AIInterview from './components/AIInterview';
import NoCaPE from './components/NoCap_PE';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import useScrollReveal from './hooks/useScrollReveal';

function MainSite() {
  useScrollReveal();
  var [partnerOpen, setPartnerOpen] = useState(false);

  return (
    <>
      <Cursor />
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <FeedbackFramework />
      <ForInvestors onPartnerClick={function() { setPartnerOpen(true); }} />
      <ProofSection />
      <InstagramFeed />
      <ApplicationSection />
      <Footer />
      <PartnerModal
        isOpen={partnerOpen}
        onClose={function() { setPartnerOpen(false); }}
      />
    </>
  );
}

export default function App() {
  useEffect(function() {
    ReactGA.initialize(process.env.REACT_APP_GA_ID);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/school/*" element={<School />} />
        <Route path="/interview" element={<AIInterview />} />
        <Route path="/pe" element={<NoCaPE />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </BrowserRouter>
  );
}