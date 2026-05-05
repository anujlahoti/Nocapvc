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
import FounderSpaceLanding from './pages/founder-space/FounderSpaceLanding';
import Onboarding from './pages/founder-space/Onboarding';
import Profile from './pages/founder-space/Profile';
import Submit from './pages/founder-space/Submit';
import IdeaPage from './pages/founder-space/IdeaPage';
import FeedPage from './pages/founder-space/FeedPage';
import AdminPage from './pages/founder-space/AdminPage';
import ProfessionalJourneySubmit from './pages/founder-space/ProfessionalJourneySubmit';
import ProfessionalJourneyFeed from './pages/founder-space/ProfessionalJourneyFeed';
import ProfessionalJourneyPage from './pages/founder-space/ProfessionalJourneyPage';
import EventsFeed from './pages/founder-space/EventsFeed';
import CreateEvent from './pages/founder-space/CreateEvent';
import EventPage from './pages/founder-space/EventPage';
import ORB1T from './pages/orb1t/ORB1T';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
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
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<MainSite />} />
            <Route path="/school/*" element={<School />} />
            <Route path="/interview" element={<AIInterview />} />
            <Route path="/pe" element={<NoCaPE />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/founder-space" element={<FounderSpaceLanding />} />
            <Route path="/founder-space/onboarding" element={<Onboarding />} />
            <Route path="/founder-space/feed" element={<FeedPage />} />
            <Route path="/founder-space/profile/:uid" element={<Profile />} />
            <Route path="/founder-space/submit" element={<Submit />} />
            <Route path="/founder-space/ideas/:ideaId" element={<IdeaPage />} />
            <Route path="/founder-space/admin" element={<AdminPage />} />
            <Route path="/founder-space/journey/submit" element={<ProfessionalJourneySubmit />} />
            <Route path="/founder-space/journey/feed" element={<ProfessionalJourneyFeed />} />
            <Route path="/founder-space/journey/:journeyId" element={<ProfessionalJourneyPage />} />
            <Route path="/founder-space/events" element={<EventsFeed />} />
            <Route path="/founder-space/events/create" element={<CreateEvent />} />
            <Route path="/founder-space/events/:eventId" element={<EventPage />} />
            <Route path="/orb1t" element={<ORB1T />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}