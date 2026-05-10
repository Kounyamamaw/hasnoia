import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SeoLandingPage from './pages/SeoLandingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/how-to-export-framer-site" element={<SeoLandingPage variant="howto" />} />
      <Route path="/tostatic-alternative" element={<SeoLandingPage variant="tostatic" />} />
      <Route path="/framer-to-vercel" element={<SeoLandingPage variant="vercel" />} />
      <Route path="/remove-framer-badge" element={<SeoLandingPage variant="badge" />} />
      <Route path="/framer-without-subscription" element={<SeoLandingPage variant="nosub" />} />
      import NotFound from './pages/NotFound';
// ...
<Route path="*" element={<NotFound />} />
    </Routes>
  );
}
