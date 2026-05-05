// frontend/src/pages/SeoLandingPage.jsx
// Pages dédiées pour chaque variante de keyword "framer export"
// Ces pages sont des portes d'entrée SEO qui redirigent vers le tool

// Usage dans App.jsx :
// <Route path="/how-to-export-framer-site" element={<SeoLandingPage variant="howto" />} />
// <Route path="/tostatic-alternative" element={<SeoLandingPage variant="tostatic" />} />
// <Route path="/framer-to-vercel" element={<SeoLandingPage variant="vercel" />} />
// <Route path="/remove-framer-badge" element={<SeoLandingPage variant="badge" />} />
// <Route path="/framer-without-subscription" element={<SeoLandingPage variant="nosub" />} />

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  howto: {
    title: 'How to Export a Framer Site — Step by Step Guide',
    h1: 'How to Export Your Framer Site',
    description: 'Complete guide to export any Framer website to static HTML. No subscription needed. Works with framer.ai, framer.app, and custom domains.',
    keyword: 'how to export framer site',
    content: [
      {
        h2: 'The problem with Framer hosting',
        text: 'Framer requires a paid subscription (€18–€54/month) to keep your site live. Once you cancel, your site goes offline. hasnoia lets you export the entire site as static HTML — host it anywhere for free.',
      },
      {
        h2: 'Step 1: Publish your Framer site',
        text: 'Your Framer site needs to be published at a .framer.ai or .framer.website URL. If it\'s already live, proceed to step 2.',
      },
      {
        h2: 'Step 2: Paste your URL into hasnoia',
        text: 'Go to hasnoia.com, paste your Framer URL (e.g. yoursite.framer.ai), click Export. hasnoia loads your page, waits for React hydration, and captures the fully rendered HTML.',
      },
      {
        h2: 'Step 3: Download the ZIP',
        text: 'In 10–30 seconds you get a ZIP with index.html, all pages (via sitemap), images, fonts, and a sitemap.xml. Framer branding is removed automatically.',
      },
      {
        h2: 'Step 4: Deploy on Vercel (free)',
        text: 'Drag and drop the ZIP folder on vercel.com/new → Deploy. Your site is live in 60 seconds, 0€/month.',
      },
    ],
  },
  tostatic: {
    title: 'ToStatic Alternative — Export Framer Sites Without Extension',
    h1: 'The Best ToStatic Alternative in 2026',
    description: 'hasnoia is a ToStatic alternative that requires no Chrome extension. Paste a Framer URL on our website and download a clean static export instantly.',
    keyword: 'tostatic alternative',
    content: [
      {
        h2: 'ToStatic vs hasnoia',
        text: 'ToStatic requires installing a Chrome extension — a friction point many users skip. hasnoia works directly in your browser: paste a URL, get a ZIP. No installation.',
      },
      {
        h2: 'SEO improvements',
        text: 'hasnoia removes the framer-search-index meta tag (which shows "Framer" in Google results), the generator meta, the canonical pointing to framer.app, and all og:url tags. ToStatic does not clean all of these.',
      },
      {
        h2: 'Pricing comparison',
        text: 'ToStatic charges $9–$29/month. hasnoia offers 1 free export/month and Pro at €9/month — same price for the base plan, with more SEO features included.',
      },
    ],
  },
  vercel: {
    title: 'Export Framer to Vercel — Free Static Hosting Guide',
    h1: 'Deploy Your Framer Site on Vercel for Free',
    description: 'Export your Framer website and deploy it on Vercel at €0/month. No Framer subscription needed. Step-by-step guide.',
    keyword: 'framer to vercel',
    content: [
      {
        h2: 'Why deploy Framer on Vercel?',
        text: 'Vercel\'s free plan hosts unlimited static sites with global CDN, HTTPS, and custom domains. Framer\'s hosting costs €18–€54/month for the same result.',
      },
      {
        h2: 'Export your Framer site',
        text: 'Use hasnoia to export your Framer site to a static ZIP. All pages, images, and fonts are included. The export takes under 30 seconds.',
      },
      {
        h2: 'Deploy on Vercel in 60 seconds',
        text: 'Go to vercel.com → Add New Project → Upload the ZIP folder. Vercel detects it\'s a static site, deploys it, and gives you a live URL instantly.',
      },
    ],
  },
  badge: {
    title: 'Remove Framer Badge — From Your Exported Site',
    h1: 'How to Remove the Framer Badge',
    description: 'The Framer "Built with Framer" badge appears on free and some paid plans. hasnoia automatically removes it when you export your site.',
    keyword: 'remove framer badge',
    content: [
      {
        h2: 'Why does the Framer badge appear?',
        text: 'Framer adds a badge to all sites on free plans and some paid tiers. It links back to framer.com. For client work or professional sites, this looks unprofessional.',
      },
      {
        h2: 'hasnoia removes it automatically',
        text: 'When you export with hasnoia, we inject CSS that hides #__framer-badge-container with display:none. The badge is invisible in the exported version.',
      },
      {
        h2: 'SEO cleanup included',
        text: 'We also remove the framer-search-index meta (shows "Framer" in Google), the meta generator tag, and canonical URLs pointing to framer.app.',
      },
    ],
  },
  nosub: {
    title: 'Use Framer Without Subscription — Export & Self-Host',
    h1: 'Host a Framer Site Without a Framer Subscription',
    description: 'Export your Framer site and host it on Vercel, Netlify or any static host — completely free. No monthly Framer plan required after export.',
    keyword: 'framer without subscription',
    content: [
      {
        h2: 'The Framer subscription trap',
        text: 'Framer charges €18–€54/month just to keep your site online. Cancel the subscription and the site goes dark immediately. hasnoia breaks this dependency.',
      },
      {
        h2: 'Export once, host forever',
        text: 'Export your Framer site with hasnoia. You get a self-contained ZIP with all assets. Deploy it on Vercel (free), Netlify (free), or any web server — and never pay Framer again.',
      },
      {
        h2: 'What is included in the export',
        text: 'All pages via sitemap, all images and fonts downloaded locally, clean SEO metadata, sitemap.xml — everything you need for a production-ready static site.',
      },
    ],
  },
};

export default function SeoLandingPage({ variant }) {
  const data = VARIANTS[variant];
  if (!data) return null;

  useEffect(() => {
    document.title = data.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Link to="/" className="text-sm font-bold text-white tracking-widest">hasnoia</Link>
        <Link to="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
          Try the tool →
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="mb-4 text-xs text-white/30 tracking-widest uppercase">{data.keyword}</div>
        <h1 className="text-4xl font-bold text-white mb-6 leading-tight">{data.h1}</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-12">{data.description}</p>

        {/* CTA principal */}
        <Link
          to="/"
          className="inline-block mb-16 bg-white text-black text-xs font-bold px-8 py-4 rounded-lg tracking-widest uppercase hover:bg-white/90 transition-colors"
        >
          Export your Framer site now — free →
        </Link>

        {/* Contenu SEO */}
        {data.content.map((section, i) => (
          <div key={i} className="mb-10">
            <h2 className="text-lg font-bold text-white mb-3">{section.h2}</h2>
            <p className="text-white/50 text-sm leading-relaxed">{section.text}</p>
          </div>
        ))}

        {/* CTA bas de page */}
        <div className="mt-16 p-6 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-sm text-white/70 mb-4">Ready to export your Framer site?</div>
          <Link
            to="/"
            className="inline-block bg-white text-black text-xs font-bold px-8 py-3 rounded-lg tracking-widest uppercase hover:bg-white/90 transition-colors"
          >
            Start free →
          </Link>
          <div className="mt-3 text-xs text-white/25">1 free export/month · No credit card</div>
        </div>
      </main>
    </div>
  );
}
