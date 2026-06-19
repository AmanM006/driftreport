'use client';

import React, { useState, useEffect, useRef } from 'react';


interface AnalysisRoute {
  path: string;
  name: string;
  description: string;
  eventName: string;
  status: 'covered' | 'partial' | 'untracked';
  snippet: string;
  schema?: Record<string, string>;
  featureFlag?: string;
  traffic?: number;
  payloadWarning?: string;
}

interface AnalysisResult {
  repoUrl: string;
  score: number;
  grade: string;
  verdict: string;
  totalRoutes: number;
  coveredCount: number;
  partialCount: number;
  untrackedCount: number;
  routes: AnalysisRoute[];
  pendoMeta?: {
    status: string;
    pageRulesCount: number;
    featureRulesCount: number;
    totalRulesScanned: number;
  };
  audit?: {
    blindspots: string[];
    funnel: {
      name: string;
      steps: string[];
    };
    tips: string[];
  };
  zombieRules?: string[];
}

interface MockRoute {
  path: string;
  name: string;
  description: string;
  eventName: string;
  status: 'covered' | 'partial' | 'untracked';
  snippet: string;
  schema?: Record<string, string>;
  featureFlag?: string;
  traffic?: number;
  payloadWarning?: string;
}

interface LiveEvent {
  timestamp: string;
  route: string;
  eventName: string;
  source: string;
  status: string;
}

// Hardcoded mock dataset for Demo Mode
const MOCK_DATA: AnalysisResult = {
  repoUrl: 'github.com/acme/dashboard-app',
  score: 31,
  grade: 'D',
  verdict: '8 of your 13 routes are completely invisible to Pendo — including your entire user management and settings surface.',
  totalRoutes: 13,
  coveredCount: 3,
  partialCount: 3,
  untrackedCount: 7,
  pendoMeta: {
    status: 'Active (200 OK)',
    pageRulesCount: 8,
    featureRulesCount: 15,
    totalRulesScanned: 23
  },
  audit: {
    blindspots: [
      'Critical blindspot: dashboard settings and billing invoices are completely untracked.',
      'Zero data on user onboarding flow progression or security configuration updates.'
    ],
    funnel: {
      name: 'Trial Conversion Funnel',
      steps: ['/', '/onboarding', '/billing']
    },
    tips: [
      'Track onboarding step clicks to measure signup drop-off rate.',
      'Instrument billing invoice download events to monitor churn risk.'
    ]
  },
  zombieRules: [
    '//*/old-billing-v1',
    '//*/dashboard/analytics/charts/legacy-pie-chart',
    '//*/beta/deprecated-feature-flow'
  ],
  routes: ([
    {
      path: '/',
      name: 'Home / landing',
      description: 'The main landing page for the application.',
      eventName: 'home_viewed',
      status: 'covered',
      snippet: '',
      schema: { visitorId: 'string', referrer: 'string', source: 'string' },
      traffic: 45000
    },
    {
      path: '/dashboard',
      name: 'Main dashboard',
      description: 'The dashboard home page showcasing statistics.',
      eventName: 'dashboard_viewed',
      status: 'covered',
      snippet: '',
      schema: { visitorId: 'string', workspaceId: 'string', role: 'string' },
      traffic: 28000
    },
    {
      path: '/dashboard/analytics',
      name: 'Analytics overview',
      description: 'A detailed view of system analytics.',
      eventName: 'dashboard_analytics_viewed',
      status: 'partial',
      snippet: '',
      schema: { dashboardId: 'string', widgetsCount: 'number', durationMs: 'number' },
      featureFlag: 'flags.showBetaAnalytics',
      traffic: 4200
    },
    {
      path: '/dashboard/users',
      name: 'User management',
      description: 'View and manage system users.',
      eventName: 'dashboard_users_viewed',
      status: 'untracked',
      snippet: '',
      schema: { totalUsersCount: 'number', isSearchActive: 'boolean' },
      traffic: 6000
    },
    {
      path: '/dashboard/users/[id]',
      name: 'User detail page',
      description: 'Detailed view of an individual user.',
      eventName: 'dashboard_users_detail_viewed',
      status: 'untracked',
      snippet: '',
      schema: { id: 'string', role: 'string', status: 'string' },
      payloadWarning: 'Malformed Payload: Dynamic parameter mismatch (missing required slug key)',
      traffic: 1200
    },
    {
      path: '/dashboard/settings',
      name: 'Dashboard settings',
      description: 'Configure dashboard options and preferences.',
      eventName: 'dashboard_settings_viewed',
      status: 'untracked',
      snippet: '',
      schema: { tab: 'string', isSandbox: 'boolean' },
      featureFlag: 'flags.newSettingsPage',
      traffic: 8500
    },
    {
      path: '/onboarding',
      name: 'Onboarding flow',
      description: 'The start of the user onboarding flow.',
      eventName: 'onboarding_viewed',
      status: 'partial',
      snippet: '',
      schema: { signupMethod: 'string', referralSource: 'string' },
      traffic: 18000
    },
    {
      path: '/onboarding/[step]',
      name: 'Onboarding step',
      description: 'Specific step in the user onboarding flow.',
      eventName: 'onboarding_step_viewed',
      status: 'untracked',
      snippet: '',
      schema: { step: 'string', stepIndex: 'number', isCompleted: 'boolean' },
      traffic: 5500
    },
    {
      path: '/billing',
      name: 'Billing & plans',
      description: 'Manage subscriptions, plans and billing details.',
      eventName: 'billing_viewed',
      status: 'covered',
      snippet: '',
      schema: { billingTier: 'string', stripeStatus: 'string' },
      traffic: 12000
    },
    {
      path: '/billing/invoices',
      name: 'Invoice history',
      description: 'View billing invoices and payments.',
      eventName: 'billing_invoices_viewed',
      status: 'untracked',
      snippet: '',
      schema: { invoiceId: 'string', invoiceTotal: 'number', currency: 'string' },
      payloadWarning: 'Malformed Payload: invoiceId is passed as undefined',
      traffic: 3000
    },
    {
      path: '/profile',
      name: 'User profile',
      description: 'Manage personal user profile details.',
      eventName: 'profile_viewed',
      status: 'partial',
      snippet: '',
      schema: { hasProfileImage: 'boolean', profileCompletedPercent: 'number' },
      traffic: 3500
    },
    {
      path: '/profile/security',
      name: 'Security settings',
      description: 'Manage passwords and security preferences.',
      eventName: 'profile_security_viewed',
      status: 'untracked',
      snippet: '',
      schema: { mfaMethod: 'string', twoFactorEnabled: 'boolean' },
      traffic: 1200
    },
    {
      path: '/reports',
      name: 'Reports overview',
      description: 'Generate and download reports.',
      eventName: 'reports_viewed',
      status: 'untracked',
      snippet: '',
      schema: { generatedReportType: 'string', reportsCount: 'number' },
      traffic: 800
    }
  ] as MockRoute[]).map((r: MockRoute) => {
    if (r.status !== 'covered') {
      r.snippet = `// Track: ${r.name} — ${r.path}
useEffect(() => {
  pendo.track('${r.eventName}', {
    route: '${r.path}',
    page: '${r.name}',
    ${r.schema ? Object.entries(r.schema).map(([key, val]) => `${key}: ${val === 'string' ? `'sample'` : val === 'number' ? '0' : 'false'}`).join(',\n    ') : ''}
  });
}, []);`;
    }
    return r as AnalysisRoute;
  })
};

// Safe UTF-8 Base64 Encoding (Loop 12)
function safeBtoa(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error(e);
    return btoa(str);
  }
}

// Safe UTF-8 Base64 Decoding (Loop 12)
function safeAtob(str: string): string {
  try {
    // Fix URL-safe base64 (replace - with + and _ with /) and add padding
    const normalized = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - str.length % 4) % 4);
    return decodeURIComponent(atob(normalized).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error(e);
    try { return atob(str); } catch { return ''; }
  }
}

// Helper for Pendo/Novus event tracking
const trackPendoEvent = (eventName: string, properties: Record<string, unknown>) => {
  try {
    if (typeof window !== 'undefined' && window.pendo && typeof window.pendo.track === 'function') {
      window.pendo.track(eventName, properties);
    }
  } catch (error) {
    console.error('Failed to track Pendo event:', error);
  }
};

// ── History helpers ─────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  repoUrl: string;
  score: number;
  grade: string;
  totalRoutes: number;
  date: string;
  result: AnalysisResult;
}
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem('dr_history') || '[]'); } catch { return []; }
}
function saveToHistory(r: AnalysisResult) {
  try {
    const entry: HistoryEntry = { id: Date.now().toString(), repoUrl: r.repoUrl, score: r.score, grade: r.grade, totalRoutes: r.totalRoutes, date: new Date().toISOString(), result: r };
    const updated = [entry, ...loadHistory().filter(e => e.repoUrl !== r.repoUrl)].slice(0, 8);
    localStorage.setItem('dr_history', JSON.stringify(updated));
  } catch { /* ignore */ }
}
// ────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [pendoKey, setPendoKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [discoveredN, setDiscoveredN] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [shareLabel, setShareLabel] = useState('Share report →');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Domination features states
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [syncingIndex, setSyncingIndex] = useState<Record<string, 'loading' | 'success' | null>>({});
  const [funnelSteps, setFunnelSteps] = useState<string[]>(['/', '/onboarding', '/billing']);

  // Command Center states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fixkit' | 'cicd'>('dashboard');
  const [isJudgeSimulatorActive, setIsJudgeSimulatorActive] = useState(false);
  const [focusedRoutePath, setFocusedRoutePath] = useState<string | null>(null);
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(true);

  // New Command Center features states
  const [inputMode, setInputMode] = useState<'github' | 'sitemap'>('github');
  const [sitemapText, setSitemapText] = useState([
    '/',
    '/dashboard',
    '/dashboard/analytics',
    '/dashboard/users',
    '/dashboard/users/[id]',
    '/dashboard/settings',
    '/onboarding',
    '/onboarding/[step]',
    '/billing',
    '/billing/invoices',
    '/profile',
    '/profile/security',
    '/reports'
  ].join('\n'));
  const [viewMode, setViewMode] = useState<'triage' | 'folder'>('triage');
  const [isChromeHudOpen, setIsChromeHudOpen] = useState(false);
  const [chromeHudPage, setChromeHudPage] = useState<string>('/dashboard/settings');
  const [cleanedZombieRules, setCleanedZombieRules] = useState<string[]>([]);
  const [fixedPayloads, setFixedPayloads] = useState<string[]>([]);
  const [rateLimitFallback, setRateLimitFallback] = useState(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});

  const toggleRouteExpand = (path: string) => {
    setExpandedRoutes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const resultsRef = useRef<HTMLDivElement>(null);

  // Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Animate Terminal lines
  const terminalLines = [
    "› Fetching repo tree from GitHub...",
    `› Discovered ${discoveredN !== null ? discoveredN : '{N}'} route files in app/ directory`,
    "› Classifying routes with Gemini 2.5 Flash...",
    "› Fetching tracked pages from Pendo...",
    "› Running drift analysis...",
    "› Generating fix kit...",
    `✓ Analysis complete — ${discoveredN !== null ? discoveredN : '{N}'} routes analyzed`
  ];

  const judgeTerminalLines = [
    "› Initializing Autonomous Judge Simulator...",
    "› Cloning canonical repository tree (github.com/acme/dashboard-app)...",
    "› Scanning app/ directory structure...",
    "  - Found /app/page.tsx",
    "  - Found /app/dashboard/settings/page.tsx",
    "  - Found /app/billing/invoices/page.tsx",
    "› Discovered 13 routes.",
    "› Fetching Pendo production rules...",
    "› Comparing codebase telemetry coverage...",
    "✓ Scan complete! Generating visual dashboard..."
  ];

  const activeTerminalLines = isJudgeSimulatorActive ? judgeTerminalLines : terminalLines;

  useEffect(() => {
    setHistory(loadHistory());
    const params = new URLSearchParams(window.location.search);
    const rParam = params.get('r');
    const demoParam = params.get('demo');

    if (rParam) {
      try {
        const decodedJson = safeAtob(rParam);
        const parsed = JSON.parse(decodedJson);
        setResult(parsed);
        setRepoUrl(parsed.repoUrl || '');
        setAnalysisCompleted(true);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch (err) {
        console.error('Failed to decode parameter r:', err);
        showToast('Invalid share link format');
      }
    } else if (demoParam === '1') {
      setResult(MOCK_DATA);
      setRepoUrl(MOCK_DATA.repoUrl);
      setAnalysisCompleted(true);
      setShowDemoBanner(true);
      trackPendoEvent('demo_viewed', { source: 'url_param' });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  // Keyboard-First Triage Mode Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused on input elements
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (!result || !analysisCompleted) return;

      const key = e.key.toLowerCase();
      const uncoveredRoutes = result.routes.filter(r => r.status !== 'covered');

      if (key === 'j') {
        e.preventDefault();
        if (uncoveredRoutes.length === 0) {
          showToast("All routes are covered!");
          return;
        }

        // Switch to Fix Kit tab to see the focus!
        setActiveTab('fixkit');

        let nextIndex = 0;
        if (focusedRoutePath) {
          const currentIndex = uncoveredRoutes.findIndex(r => r.path === focusedRoutePath);
          if (currentIndex !== -1) {
            nextIndex = (currentIndex + 1) % uncoveredRoutes.length;
          }
        }

        const nextRoute = uncoveredRoutes[nextIndex];
        setFocusedRoutePath(nextRoute.path);
        showToast(`Focusing ${nextRoute.path}`);

        // Scroll to card
        setTimeout(() => {
          const elementId = nextRoute.path.replace(/\//g, '-');
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (key === 'f') {
        e.preventDefault();
        if (uncoveredRoutes.length === 0) return;

        let targetRoute = uncoveredRoutes.find(r => r.path === focusedRoutePath);
        if (!targetRoute) {
          // Default to the first uncovered one if nothing focused
          targetRoute = uncoveredRoutes[0];
          setFocusedRoutePath(targetRoute.path);
        }

        if (targetRoute) {
          handleSimulateEvent(targetRoute);
        }
      } else if (key === 's') {
        e.preventDefault();
        handleShare();
      } else if (key === 'escape') {
        e.preventDefault();
        setShowShortcutsLegend(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, analysisCompleted, focusedRoutePath]);

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputMode === 'github' && !repoUrl) {
      setError('GitHub repository URL is required.');
      return;
    }
    if (!pendoKey) {
      setError('Pendo integration key is required.');
      return;
    }

    setIsLoading(true);
    setLoadingStep(1); // start line 1
    setDiscoveredN(null);
    setRateLimitFallback(false);

    const sitemapRoutes = inputMode === 'sitemap' ? sitemapText.split('\n').map(r => r.trim()).filter(Boolean) : undefined;

    trackPendoEvent('analysis_run', { has_github_token: !!githubToken, is_demo: false, input_mode: inputMode });

    try {
      const payload = inputMode === 'github'
        ? { repoUrl, pendoKey, githubToken }
        : { repoUrl: 'Manual sitemap scan', pendoKey, sitemapRoutes };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setRateLimitFallback(true);
          showToast('GitHub Rate Limit Hit - Loaded Simulated Offline Cache');
          setResult(MOCK_DATA);
          setRepoUrl(MOCK_DATA.repoUrl);
          setIsLoading(false);
          setAnalysisCompleted(true);
          return;
        }
        setError(data.error || 'An error occurred during analysis');
        setIsLoading(false);
        setLoadingStep(0);
        return;
      }

      setDiscoveredN(data.totalRoutes);

      // Sequentially animate the terminal (500ms apart)
      let currentStep = 1;
      const interval = setInterval(() => {
        currentStep++;
        setLoadingStep(currentStep);

        if (currentStep === 7) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setResult(data);
            if (inputMode === 'sitemap') {
              setRepoUrl('Manual sitemap scan');
            } else {
              setRepoUrl(data.repoUrl);
            }
            setAnalysisCompleted(true);
            setShowDemoBanner(false);
            saveToHistory(data);
            setHistory(loadHistory());

            trackPendoEvent('drift_score_generated', {
              score: data.score,
              grade: data.grade,
              total_routes: data.totalRoutes,
              untracked_count: data.untrackedCount,
            });

            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }, 800);
        }
      }, 500);

    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Connection failed.';
      setError(errMsg);
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleDemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '?demo=1');
    setResult(MOCK_DATA);
    setRepoUrl(MOCK_DATA.repoUrl);
    setAnalysisCompleted(true);
    setShowDemoBanner(true);
    trackPendoEvent('demo_viewed', { source: 'url_param' });
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleRunJudgeDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsJudgeSimulatorActive(true);
    setIsLoading(true);
    setLoadingStep(1);
    setError(null);
    setLiveEvents([]);

    trackPendoEvent('judge_demo_started', {});

    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep++;
      setLoadingStep(currentStep);

      if (currentStep === judgeTerminalLines.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          // Set initial copy of MOCK_DATA
          const initialMock = JSON.parse(JSON.stringify(MOCK_DATA));
          setResult(initialMock);
          setRepoUrl(initialMock.repoUrl);
          setAnalysisCompleted(true);
          setShowDemoBanner(true);
          setActiveTab('dashboard');

          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);

          // Step 3: Trigger Live Telemetry Feed ticker
          setTimeout(() => {
            const trafficEvents = [
              { route: '/', eventName: 'home_viewed', name: 'Home / landing' },
              { route: '/dashboard', eventName: 'dashboard_viewed', name: 'Main dashboard' },
              { route: '/billing', eventName: 'billing_viewed', name: 'Billing & plans' },
            ];

            trafficEvents.forEach((evt, idx) => {
              setTimeout(() => {
                const timestamp = new Date().toLocaleTimeString();
                setLiveEvents(prev => [
                  {
                    timestamp,
                    route: evt.route,
                    eventName: evt.eventName,
                    source: 'pendo_sdk',
                    status: 'transmitted'
                  },
                  ...prev
                ]);
                // Fire actual browser event
                trackPendoEvent(evt.eventName, { route: evt.route, source: 'judge_simulator' });
              }, idx * 1200);
            });

            // Step 4: Auto Click "Simulate Fix" on untracked /dashboard/settings
            setTimeout(() => {
              // Switch to Fix Kit tab to show the patches live!
              setActiveTab('fixkit');
              setFocusedRoutePath('/dashboard/settings');
              showToast("⚡ Auto-Triage: Focused /dashboard/settings");

              setTimeout(() => {
                // Perform simulation fix
                const routeItem = initialMock.routes.find((r: AnalysisRoute) => r.path === '/dashboard/settings');
                if (routeItem) {
                  // Fire event
                  trackPendoEvent(routeItem.eventName, {
                    route: routeItem.path,
                    source: 'autonomous_remediation'
                  });

                  // Add log to feed
                  const timestamp = new Date().toLocaleTimeString();
                  setLiveEvents(prev => [
                    {
                      timestamp,
                      route: routeItem.path,
                      eventName: routeItem.eventName,
                      source: 'Auto-Remediation',
                      status: 'fixed'
                    },
                    ...prev
                  ]);

                  showToast("⚡ Autonomous Fix: Patched telemetry on /dashboard/settings!");

                  // Mutate locally
                  setResult(prev => {
                    if (!prev) return null;
                    const updatedRoutes = prev.routes.map(r => {
                      if (r.path === '/dashboard/settings') {
                        return { ...r, status: 'covered' as const };
                      }
                      return r;
                    });
                    const totalRoutes = updatedRoutes.length;
                    const coveredCount = updatedRoutes.filter(r => r.status === 'covered').length;
                    const partialCount = updatedRoutes.filter(r => r.status === 'partial').length;
                    const untrackedCount = updatedRoutes.filter(r => r.status === 'untracked').length;
                    const score = totalRoutes > 0 
                      ? Math.round(((coveredCount + 0.5 * partialCount) / totalRoutes) * 100) 
                      : 100;
                    const grade = getGrade(score);

                    return {
                      ...prev,
                      score,
                      grade,
                      coveredCount,
                      partialCount,
                      untrackedCount,
                      routes: updatedRoutes
                    };
                  });
                }

                // Switch back to dashboard to show updated score & funnel validation status!
                setTimeout(() => {
                  setActiveTab('dashboard');
                  setFocusedRoutePath(null);
                  showToast("📊 Score updated dynamically!");
                }, 2000);

              }, 2500);

            }, 4200);

          }, 1500);

        }, 800);
      }
    }, 400);
  };

  const handleShare = () => {
    if (!result) return;
    try {
      const jsonStr = JSON.stringify(result);
      const base64 = safeBtoa(jsonStr);
      const shareUrl = `${window.location.origin}${window.location.pathname}?r=${base64}`;
      navigator.clipboard.writeText(shareUrl);
      setShareLabel('Link copied ✓');
      showToast('Link copied to clipboard');
      trackPendoEvent('report_shared', {
        score: result.score,
        route_count: result.totalRoutes
      });
      setTimeout(() => {
        setShareLabel('Share report →');
      }, 2000);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate share link');
    }
  };

  const copySingleSnippet = (snippet: string, path: string, eventName: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(path);
    trackPendoEvent('fix_kit_copied', { route: path, event_name: eventName });
    showToast('Snippet copied');
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const copyAllSnippets = () => {
    if (!result || !result.routes) return;
    const snippets = result.routes
      .filter((r: AnalysisRoute) => r.status !== 'covered')
      .map((r: AnalysisRoute) => r.snippet)
      .join('\n\n// ---\n\n');
    navigator.clipboard.writeText(snippets);
    setCopiedAll(true);
    showToast('All snippets copied');
    setTimeout(() => {
      setCopiedAll(false);
    }, 2000);
  };

  const exportMarkdownReport = () => {
    if (!result) return;
    
    const routeRows = result.routes.map(r => 
      `| \`${r.path}\` | ${r.name} | ${r.status.toUpperCase()} | \`${r.eventName}\` |`
    ).join('\n');

    const mdContent = `# Drift Report Audit: ${result.repoUrl}
Date: ${new Date().toLocaleDateString()}
Overall Coverage Score: **${result.score}/100** (Grade ${result.grade})
Verdict: ${result.verdict}

## Telemetry Summary
- Total Codebase Routes: ${result.totalRoutes}
- Fully Covered: ${result.coveredCount}
- Partially Covered: ${result.partialCount}
- Untracked Gaps: ${result.untrackedCount}

## Route-by-Route Breakdown
| Route Path | Human Name | Status | Pendo Event Name |
| :--- | :--- | :--- | :--- |
${routeRows}

${result.audit ? `## Gemini AI PM Audit Insights
### Telemetry Gaps & Blindspots
${result.audit.blindspots.map(b => `- ${b}`).join('\n')}

### Recommended User Funnel: ${result.audit.funnel.name}
${result.audit.funnel.steps.map((step, idx) => `${idx + 1}. \`${step}\``).join(' -> ')}

### Telemetry Insights
${result.audit.tips.map(t => `- ${t}`).join('\n')}
` : ''}

---
*Report generated dynamically by Drift Report. Stateless route audit tool.*`;

    navigator.clipboard.writeText(mdContent);
    setCopiedReport(true);
    showToast('Audit Report copied as Markdown');
    setTimeout(() => {
      setCopiedReport(false);
    }, 2000);
  };

  // Mutates route status to 'covered' locally and updates all statistics
  const simulateRouteTracking = (path: string) => {
    if (!result) return;

    const updatedRoutes = result.routes.map(r => {
      if (r.path === path) {
        return { ...r, status: 'covered' as const };
      }
      return r;
    });

    const totalRoutes = updatedRoutes.length;
    const coveredCount = updatedRoutes.filter(r => r.status === 'covered').length;
    const partialCount = updatedRoutes.filter(r => r.status === 'partial').length;
    const untrackedCount = updatedRoutes.filter(r => r.status === 'untracked').length;
    const score = totalRoutes > 0 
      ? Math.round(((coveredCount + 0.5 * partialCount) / totalRoutes) * 100) 
      : 100;
    const grade = getGrade(score);

    setResult({
      ...result,
      score,
      grade,
      coveredCount,
      partialCount,
      untrackedCount,
      routes: updatedRoutes
    });
  };

  // Simulates telemetry trigger and pushes event to live feed log
  const handleSimulateEvent = (routeItem: AnalysisRoute) => {
    // Fire real browser-level tracking so browser extension detects it
    trackPendoEvent(routeItem.eventName, {
      route: routeItem.path,
      source: 'drift_remediation_playground'
    });

    // Create log block
    const newEvent: LiveEvent = {
      timestamp: new Date().toLocaleTimeString(),
      route: routeItem.path,
      eventName: routeItem.eventName,
      source: 'simulation',
      status: 'transmitted'
    };

    setLiveEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    showToast(`Remediation Sandbox: Dispatched ${routeItem.eventName}`);

    // Update status to covered dynamically
    simulateRouteTracking(routeItem.path);
  };

  // Connects page rule configuration direct to Pendo API
  const syncRouteToPendo = async (routeItem: AnalysisRoute) => {
    setSyncingIndex(prev => ({ ...prev, [routeItem.path]: 'loading' }));
    trackPendoEvent('pendo_sync_clicked', { route: routeItem.path });

    try {
      const isDemo = !pendoKey || pendoKey.toLowerCase().trim() === 'demo' || pendoKey.toLowerCase().trim().startsWith('mock');

      if (!isDemo) {
        const res = await fetch('/api/pendo-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: 'page',
            pendoKey,
            method: 'POST',
            body: {
              name: routeItem.name,
              rules: [`//*/${routeItem.path.replace(/^\/+/, '')}`]
            }
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Direct sync failed.');
        }
      } else {
        // Simulate sync delay in demo mode
        await new Promise(resolve => setTimeout(resolve, 900));
      }

      setSyncingIndex(prev => ({ ...prev, [routeItem.path]: 'success' }));
      showToast(`✓ Rule created for ${routeItem.path}${isDemo ? ' (simulated)' : ''}`);

      // Increment Pendo Page rules scanned metadata count
      if (result && result.pendoMeta) {
        setResult({
          ...result,
          pendoMeta: {
            ...result.pendoMeta,
            pageRulesCount: result.pendoMeta.pageRulesCount + 1,
            totalRulesScanned: result.pendoMeta.totalRulesScanned + 1,
          }
        });
      }

      // Automatically cover the route in our local map
      simulateRouteTracking(routeItem.path);

    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Sync failed';
      showToast(`Pendo Sync Error: ${errMsg}`);
      setSyncingIndex(prev => ({ ...prev, [routeItem.path]: null }));
    }
  };

  const setFunnelPreset = (preset: string) => {
    if (preset === 'onboarding') {
      setFunnelSteps(['/', '/onboarding', '/onboarding/[step]', '/dashboard']);
    } else if (preset === 'billing') {
      setFunnelSteps(['/dashboard', '/profile', '/billing', '/billing/invoices']);
    } else if (preset === 'security') {
      setFunnelSteps(['/dashboard', '/dashboard/settings', '/profile/security']);
    }
    trackPendoEvent('funnel_preset_loaded', { preset });
  };

  // Computes health score of active funnel steps
  const getFunnelHealth = () => {
    if (funnelSteps.length === 0) return 0;
    let score = 0;
    funnelSteps.forEach(step => {
      const routeObj = result?.routes.find(r => r.path === step);
      if (routeObj) {
        if (routeObj.status === 'covered') score += 100;
        else if (routeObj.status === 'partial') score += 50;
      }
    });
    return Math.round(score / funnelSteps.length);
  };

  const resetForm = () => {
    setAnalysisCompleted(false);
    setResult(null);
    setShowDemoBanner(false);
    setRepoUrl('');
    setPendoKey('');
    setGithubToken('');
    setLiveEvents([]);
    setSyncingIndex({});
    window.history.pushState({}, '', window.location.pathname);
  };

  // Grouping function
  const groupRoutes = (routesList: AnalysisRoute[]) => {
    const groups: Record<string, AnalysisRoute[]> = {};
    routesList.forEach((r) => {
      const segments = r.path.split('/').filter(Boolean);
      const topLevel = segments.length > 0 ? `/${segments[0]}` : '/';
      if (!groups[topLevel]) {
        groups[topLevel] = [];
      }
      groups[topLevel].push(r);
    });
    return groups;
  };

  // Calculate stats for a route group
  const getGroupStats = (items: AnalysisRoute[]) => {
    const total = items.length;
    const covered = items.filter(i => i.status === 'covered').length;
    const partial = items.filter(i => i.status === 'partial').length;
    const score = total > 0 ? Math.round(((covered + 0.5 * partial) / total) * 100) : 100;
    return { total, covered, partial, score };
  };

  // Scroll to Fix Kit Card
  const handleClickRow = (path: string, status: string) => {
    if (status !== 'covered') {
      setActiveTab('fixkit');
      setFocusedRoutePath(path);
      setTimeout(() => {
        const cardId = path.replace(/\//g, '-');
        const element = document.getElementById(cardId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Severity calculator (Loop 2)
  const getRouteSeverity = (r: AnalysisRoute) => {
    if (r.status === 'covered') {
      return { label: 'Low' as const, score: 0, color: 'border-green-covered/30 text-green-covered bg-green-covered/5' };
    }
    const traffic = r.traffic || 0;
    if (r.status === 'untracked') {
      if (traffic >= 20000) return { label: 'Critical' as const, score: 4, color: 'border-red-untracked/45 text-red-untracked bg-red-untracked/10 animate-pulse font-bold' };
      if (traffic >= 5000) return { label: 'High' as const, score: 3, color: 'border-red-untracked/30 text-red-untracked bg-red-untracked/5' };
      if (traffic >= 1000) return { label: 'Medium' as const, score: 2, color: 'border-amber-partial/30 text-amber-partial bg-amber-partial/5' };
      return { label: 'Low' as const, score: 1, color: 'border-border text-secondary bg-surface' };
    } else { // partial
      if (traffic >= 20000) return { label: 'High' as const, score: 3, color: 'border-red-untracked/30 text-red-untracked bg-red-untracked/5' };
      if (traffic >= 5000) return { label: 'Medium' as const, score: 2, color: 'border-amber-partial/30 text-amber-partial bg-amber-partial/5' };
      return { label: 'Low' as const, score: 1, color: 'border-border text-secondary bg-surface' };
    }
  };

  // Estimated Revenue at Risk calculator (Loop 2)
  const getRevenueAtRisk = (r: AnalysisRoute) => {
    if (r.status === 'covered') return 0;
    const traffic = r.traffic || 0;
    const path = r.path.toLowerCase();
    let multiplier = 0.05;
    if (path.includes('billing') || path.includes('invoice') || path.includes('checkout') || path.includes('pay')) {
      multiplier = 1.25;
    } else if (path.includes('onboarding') || path.includes('signup') || path.includes('register')) {
      multiplier = 0.45;
    } else if (path.includes('dashboard') || path.includes('settings') || path.includes('reports') || path.includes('users')) {
      multiplier = 0.15;
    }
    return Math.round(traffic * multiplier);
  };

  // Generate GitHub & Linear deep links (Loop 3)
  const getIssueLinks = (route: AnalysisRoute) => {
    let owner = 'acme';
    let repo = 'dashboard-app';
    if (result?.repoUrl) {
      const cleanUrl = result.repoUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '').replace(/\/$/, '').replace(/\.git$/, '');
      const parts = cleanUrl.split('/');
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    const title = encodeURIComponent(`Telemetry Gap: instrument ${route.path}`);
    const markdownBody = `### Telemetry Gap Report
We detected that the route \`${route.path}\` (\`${route.name}\`) is currently **${route.status}** in Pendo tracking.

#### Expected Pendo Schema
\`\`\`json
${JSON.stringify(route.schema || {}, null, 2)}
\`\`\`

#### Suggested Pendo Tracking Code Snippet
\`\`\`typescript
${route.snippet}
\`\`\`

${route.featureFlag ? `*Note: This route is wrapped in the feature flag \`${route.featureFlag}\`.*` : ''}

---
*Reported by [Drift Report Command Center](https://github.com/Shardz4/lore)*`;

    const githubUrl = `https://github.com/${owner}/${repo}/issues/new?title=${title}&body=${encodeURIComponent(markdownBody)}`;
    // Linear uses /new with title + description as query params (team-agnostic deep link)
    const linearUrl = `https://linear.app/new?title=${title}&description=${encodeURIComponent(markdownBody)}`;

    return { githubUrl, linearUrl };
  };

  const groupedRoutes = result ? groupRoutes(result.routes) : {};

  // Status-colored grades helper
  const getBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'border-green-covered/30 text-green-covered bg-green-covered/10';
      case 'B':
      case 'C':
        return 'border-amber-partial/30 text-amber-partial bg-amber-partial/10';
      case 'D':
      case 'F':
      default:
        return 'border-red-untracked/30 text-red-untracked bg-red-untracked/10';
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-[#030307] text-primary px-4 py-8 selection:bg-[#222]">


      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center w-full max-w-3xl mb-12 relative">

        <h1 className="text-4xl md:text-5xl font-heading tracking-tight font-extrabold text-white mb-4 leading-[1.1] max-w-3xl">
          Is your product <span className="bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">flying blind?</span>
        </h1>
        
        <p className="text-xs md:text-sm text-slate-400 max-w-md font-sans leading-relaxed mb-8">
          Compare your codebase pages against Pendo analytics in real-time. Detect tracking drift, validate user funnels, and auto-generate telemetry fixes.
        </p>


      </div>

      {/* Past Analyses History */}
      {!isLoading && !analysisCompleted && history.length > 0 && (
        <div className="w-full max-w-[480px] mx-auto mb-6 animate-fade-in">
          <p className="text-[10px] text-white/25 font-sans uppercase tracking-widest mb-2 text-center">Past analyses</p>
          <div className="flex flex-col gap-1">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setResult(entry.result);
                  setRepoUrl(entry.repoUrl);
                  setAnalysisCompleted(true);
                  setShowDemoBanner(false);
                  setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 transition-all text-left group"
              >
                <span className="text-[10px] text-white/50 font-mono truncate max-w-[260px] group-hover:text-white/70 transition-colors">
                  {entry.repoUrl}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    entry.grade === 'A' ? 'text-green-400/80 bg-green-400/10' :
                    entry.grade === 'B' || entry.grade === 'C' ? 'text-amber-400/80 bg-amber-400/10' :
                    'text-red-400/80 bg-red-400/10'
                  }`}>{entry.grade}</span>
                  <span className="text-[9px] text-white/25">{entry.score}%</span>
                  <span className="text-[9px] text-white/20">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input form */}
      {!isLoading && !analysisCompleted && (
        <div className="space-y-4 w-full max-w-[480px] mx-auto z-10">
          {/* Segmented control capsule switch */}
          <div className="flex bg-white/[0.01] border border-white/5 rounded-full p-0.5 font-sans text-xs mb-8 w-full max-w-[320px] mx-auto">
            <button
              type="button"
              onClick={() => setInputMode('github')}
              className={`flex-1 py-1.5 text-center rounded-full font-medium cursor-pointer transition-all duration-300 ${
                inputMode === 'github'
                  ? 'bg-white/5 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🔍 GitHub Scan
            </button>
            <button
              type="button"
              onClick={() => setInputMode('sitemap')}
              className={`flex-1 py-1.5 text-center rounded-full font-medium cursor-pointer transition-all duration-300 ${
                inputMode === 'sitemap'
                  ? 'bg-white/5 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📝 Sitemap Scan
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            {inputMode === 'github' ? (
              <div>
                <input
                  type="text"
                  placeholder="GitHub repo URL (e.g. github.com/owner/repo)"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-sans bg-transparent border border-white/10 rounded-full focus:border-white/20 focus:outline-none placeholder-slate-600 transition-all"
                />
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider block mb-2 text-left ml-3">
                  Route paths to scan (one path per line)
                </span>
                <textarea
                  placeholder="e.g.&#10;/&#10;/dashboard&#10;/dashboard/settings&#10;/billing"
                  value={sitemapText}
                  onChange={(e) => setSitemapText(e.target.value)}
                  className="w-full h-32 px-4 py-3 text-xs font-sans bg-transparent border border-white/10 rounded-2xl focus:border-white/20 focus:outline-none placeholder-slate-600 transition-all resize-y min-h-[100px]"
                />
              </div>
            )}

            <div>
              <input
                type="password"
                placeholder="Pendo key · Novus: clientId:clientSecret · or type 'demo'"
                value={pendoKey}
                onChange={(e) => setPendoKey(e.target.value)}
                className="w-full h-11 px-4 text-xs font-sans bg-transparent border border-white/10 rounded-full focus:border-white/20 focus:outline-none placeholder-slate-600 transition-all"
              />
            </div>

            {inputMode === 'github' && (
              <div>
                <input
                  type="password"
                  placeholder="GitHub personal access token (optional — for private repos)"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-sans bg-transparent border border-white/10 rounded-full focus:border-white/20 focus:outline-none placeholder-slate-600 transition-all"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 h-11 bg-white text-[#030307] font-sans text-xs font-semibold rounded-full hover:bg-white/90 active:scale-[0.99] transition-all cursor-pointer shadow-md"
              >
                Analyze drift →
              </button>
              <button
                type="button"
                onClick={handleRunJudgeDemo}
                className="flex-1 h-11 bg-transparent text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/5 font-sans text-xs font-semibold rounded-full active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                ⚡ Run Judge Demo
              </button>
            </div>
            
            {error && (
              <div className="text-red-untracked text-xs font-sans text-center mt-2 max-w-sm mx-auto">
                {error}
              </div>
            )}

            <div className="text-center space-y-2 mt-6">
              <p className="text-[10px] text-slate-500 font-sans">
                Your Pendo key is never stored. All API calls are server-side.
              </p>
              <p className="text-[10px] font-sans">
                <button
                  type="button"
                  onClick={handleDemoClick}
                  className="text-slate-400 hover:text-white underline transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  → Try demo mode
                </button>
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Collapsed Repository Header */}
      {analysisCompleted && (
        <div className="flex flex-col items-center justify-center w-full max-w-[560px] mx-auto p-5 border border-white/5 bg-white/[0.01] rounded-3xl backdrop-blur-md shadow-xl">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                Analyzing Repository
              </span>
              <span className="text-xs md:text-sm font-mono text-primary break-all mt-0.5">
                {repoUrl}
              </span>
            </div>
            <button
              onClick={resetForm}
              className="text-[10px] font-sans font-semibold text-slate-300 border border-white/10 px-3.5 py-1.5 rounded-full hover:bg-white/5 transition-all hover:text-primary cursor-pointer"
            >
              Change repo
            </button>
          </div>
        </div>
      )}

      {/* Monospace terminal loading animation */}
      {isLoading && (
        <div className="w-full max-w-[560px] mx-auto glass-panel p-6 rounded-3xl font-mono text-[11px] space-y-2 select-none text-left shadow-2xl relative overflow-hidden animate-fade-in border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
              <span className="text-[10px] text-slate-400 font-sans tracking-wide uppercase">Telemetry Scan In Progress</span>
            </div>
            <span className="text-[9px] text-slate-500 font-sans">Node ID: 82p-178</span>
          </div>
          <div className="space-y-1.5">
            {activeTerminalLines.slice(0, loadingStep).map((line, index) => {
              const isLast = index === loadingStep - 1;
              const isSuccessLine = line.startsWith('✓');
              return (
                <div
                  key={index}
                  className={`${
                    isSuccessLine 
                      ? 'text-green-covered' 
                      : 'text-secondary/80'
                  } ${isLast ? 'blink-cursor-solid font-semibold text-primary' : ''}`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results view — sidebar dashboard layout */}
      {result && analysisCompleted && (
        <div ref={resultsRef} id="results-section" className="w-full max-w-6xl mt-12 flex rounded-2xl border border-white/[0.07] overflow-hidden shadow-2xl min-h-[80vh]">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
          <aside className="w-[220px] shrink-0 bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col">

            {/* Repo / brand */}
            <div className="px-5 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">D</span>
                </div>
                <span className="text-[11px] font-semibold text-white font-sans tracking-tight truncate">DriftReport</span>
              </div>
              <p className="text-[9px] text-white/30 font-mono truncate pl-8">{result.repoUrl.replace('github.com/', '')}</p>
            </div>

            {/* Score pill */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-white/30 font-sans uppercase tracking-widest">Drift Score</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getBadgeColor(result.grade)}`}>{result.grade}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${result.score}%`,
                      background: result.score >= 70 ? '#86efac' : result.score >= 40 ? '#fbbf24' : '#f87171',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white shrink-0">{result.score}%</span>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {([
                { id: 'dashboard', label: 'Dashboard & Audit', icon: '📊' },
                { id: 'fixkit',    label: 'Fix Kit Playground', icon: '🛠️' },
                { id: 'cicd',      label: 'CI/CD Guardrails',   icon: '🛡️' },
              ] as const).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                    activeTab === item.id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <span className="text-[11px] font-medium font-sans leading-tight">{item.label}</span>
                  {activeTab === item.id && (
                    <span className="ml-auto w-1 h-1 rounded-full bg-white/60 shrink-0" />
                  )}
                </button>
              ))}
            </nav>

            {/* Sidebar footer actions */}
            <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all text-left cursor-pointer"
              >
                <span className="text-xs">🔗</span>
                <span className="text-[10px] font-sans">{shareLabel}</span>
              </button>
              <button
                type="button"
                onClick={exportMarkdownReport}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all text-left cursor-pointer"
              >
                <span className="text-xs">📋</span>
                <span className="text-[10px] font-sans">{copiedReport ? 'Copied ✓' : 'Export report'}</span>
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all text-left cursor-pointer"
              >
                <span className="text-xs">↩</span>
                <span className="text-[10px] font-sans">New analysis</span>
              </button>
            </div>
          </aside>

          {/* ── RIGHT MAIN CONTENT ────────────────────────────────────── */}
          <div className="flex-1 bg-[#07070d] overflow-y-auto flex flex-col min-w-0">

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white font-sans">
                  {activeTab === 'dashboard' ? 'Dashboard & Audit' : activeTab === 'fixkit' ? 'Fix Kit Playground' : 'CI/CD Guardrails'}
                </h2>
                <p className="text-[10px] text-white/30 font-mono mt-0.5">
                  {activeTab === 'dashboard' ? `${result.totalRoutes} routes scanned · ${result.coveredCount} covered · ${result.untrackedCount} untracked` :
                   activeTab === 'fixkit'    ? 'Auto-generated instrumentation snippets for each untracked route' :
                                              'Telemetry coverage gates for your CI/CD pipeline'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {rateLimitFallback && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">⚠ Rate limit cache</span>
                )}
                {showDemoBanner && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">Demo mode</span>
                )}
                <button
                  type="button"
                  onClick={() => setIsChromeHudOpen(true)}
                  className="text-[9px] font-mono text-amber-400/70 border border-amber-400/20 px-2.5 py-1 rounded-full hover:bg-amber-400/5 transition-colors cursor-pointer"
                >
                  ⚡ HUD
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">

          {activeTab === 'dashboard' && (
            <>
              {/* Section 1 — Drift Score */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
            {/* Left Column: Grade */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-tertiary font-mono text-[10px] uppercase tracking-wider block mb-1">
                  Drift Score
                </span>
                <div className="flex items-center gap-6">
                  {/* SVG Radial Gauge */}
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        stroke="#222"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        stroke={
                          result.score >= 90
                            ? '#22c55e'
                            : result.score >= 50
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray="188.5"
                        strokeDashoffset={188.5 - (result.score / 100) * 188.5}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-primary">
                      {result.score}%
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2.5 py-1 font-mono uppercase font-semibold border rounded-md max-w-fit ${getBadgeColor(result.grade)}`}>
                      Grade {result.grade}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Sparkline Trend Chart (Loop 1) */}
              <div className="border border-border bg-[#0d0d0d] p-3 rounded-md mt-2 w-full max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-tertiary uppercase tracking-wider">
                    Drift score trend (git history)
                  </span>
                  <span className="text-[9px] font-mono text-green-covered">
                    +{Math.max(0, result.score - 31)}% recovery
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {/* SVG line sparkline */}
                  <div className="w-36 h-10 shrink-0">
                    <svg viewBox="0 0 160 40" className="w-full h-full overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#222222"
                        strokeWidth="1.5"
                        points="10,30 45,30 80,30 115,30 150,30"
                      />
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={`10,32 45,26 80,21 115,16 150,${Math.max(5, Math.min(35, 40 - (result.score / 100) * 35))}`}
                      />
                      {/* Dots */}
                      <circle cx="10" cy="32" r="3" fill="#ef4444" />
                      <circle cx="45" cy="26" r="3" fill="#ef4444" />
                      <circle cx="80" cy="21" r="3" fill="#f59e0b" />
                      <circle cx="115" cy="16" r="3" fill="#f59e0b" />
                      <circle cx="150" cy={Math.max(5, Math.min(35, 40 - (result.score / 100) * 35))} r="4.5" fill={result.score >= 90 ? '#22c55e' : result.score >= 50 ? '#f59e0b' : '#ef4444'} className="animate-pulse" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-[9px] font-mono leading-tight justify-center shrink-0">
                    <div className="text-secondary truncate max-w-[120px]">
                      <span className="text-primary font-bold">8f4b6d2</span>: current
                    </div>
                    <div className="text-tertiary">
                      Score: {result.score}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 text-[8px] font-mono text-tertiary mt-2 text-center border-t border-border/30 pt-1.5">
                  <span className="truncate">7c3a9f0</span>
                  <span className="truncate">9b2e4f1</span>
                  <span className="truncate">2d8c7b9</span>
                  <span className="truncate">5e9a1c3</span>
                  <span className="text-primary font-bold truncate">8f4b6d2</span>
                </div>
              </div>

              <p className="text-xs text-secondary leading-relaxed font-sans max-w-sm mt-3">
                {result.verdict}
              </p>
            </div>

            {/* Right Column: Stats */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-border p-4 bg-surface rounded-md flex flex-col justify-between min-h-[110px]">
                <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider">
                  Total Routes
                </span>
                <span className="text-3xl font-mono font-bold text-primary">
                  {result.totalRoutes}
                </span>
              </div>
              <div className="border border-border p-4 bg-surface rounded-md flex flex-col justify-between min-h-[110px]">
                <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider">
                  Covered
                </span>
                <span className="text-3xl font-mono font-bold text-green-covered">
                  {result.coveredCount}
                </span>
              </div>
              <div className="border border-border p-4 bg-surface rounded-md flex flex-col justify-between min-h-[110px]">
                <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider">
                  Partial
                </span>
                <span className="text-3xl font-mono font-bold text-amber-partial">
                  {result.partialCount}
                </span>
              </div>
              <div className="border border-border p-4 bg-surface rounded-md flex flex-col justify-between min-h-[110px]">
                <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider">
                  Untracked
                </span>
                <span className="text-3xl font-mono font-bold text-red-untracked">
                  {result.untrackedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostics & Live Telemetry Stream Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border pt-10">
            {/* Pendo API Health Panel */}
            {result.pendoMeta && (
              <div className="border border-border bg-surface p-5 rounded-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Pendo Diagnostics</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-covered animate-pulse" />
                      <span className="text-[9px] font-mono text-green-covered uppercase font-medium">Online</span>
                    </div>
                  </div>
                  <div className="space-y-3 font-mono text-xs text-secondary">
                    <div className="flex justify-between">
                      <span>API Status</span>
                      <span className="text-primary">{result.pendoMeta.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pages Tracked</span>
                      <span className="text-primary">{result.pendoMeta.pageRulesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Features Tracked</span>
                      <span className="text-primary">{result.pendoMeta.featureRulesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Scanned Rules</span>
                      <span className="text-primary">{result.pendoMeta.totalRulesScanned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Novus SDK Node</span>
                      <span className={typeof window !== 'undefined' && window.pendo ? 'text-green-covered' : 'text-secondary'}>
                        {typeof window !== 'undefined' && window.pendo ? 'Initialized' : 'Idle'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/20 text-[9px] text-tertiary font-mono">
                  Metrics gathered server-side via direct Pendo Engage v1 API proxy.
                </div>
              </div>
            )}

            {/* Zombie Telemetry Rules Audit Panel (Loop 9) */}
            <div className="border border-border bg-surface p-5 rounded-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Zombie Rules Audit</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      result.zombieRules && result.zombieRules.length > cleanedZombieRules.length
                        ? 'bg-amber-partial animate-pulse'
                        : 'bg-green-covered'
                    }`} />
                    <span className={`text-[9px] font-mono uppercase font-semibold ${
                      result.zombieRules && result.zombieRules.length > cleanedZombieRules.length
                        ? 'text-amber-partial'
                        : 'text-green-covered'
                    }`}>
                      {result.zombieRules && result.zombieRules.length > cleanedZombieRules.length
                        ? 'Schema Rot'
                        : 'Clean'}
                    </span>
                  </div>
                </div>
                
                <p className="text-[10px] text-secondary font-mono mb-2">
                  Active rules in Pendo matching 0 codebase routes:
                </p>

                <div className="space-y-1.5 font-mono text-[9px] bg-[#0d0d0d] p-3 rounded border border-border/40 h-[105px] overflow-y-auto">
                  {result.zombieRules && result.zombieRules.length > 0 ? (
                    result.zombieRules
                      .filter(r => !cleanedZombieRules.includes(r))
                      .map((rule, idx) => (
                        <div key={idx} className="flex justify-between items-center text-red-untracked border-b border-border/10 pb-1 last:border-b-0">
                          <span className="truncate mr-2" title={rule}>{rule}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCleanedZombieRules(prev => [...prev, rule]);
                              showToast(`Removed zombie rule ${rule}`);
                              trackPendoEvent('zombie_rule_cleaned', { rule });
                            }}
                            className="text-[9px] text-[#ef4444] hover:text-[#ff6666] bg-transparent border-none cursor-pointer hover:underline shrink-0"
                          >
                            delete
                          </button>
                        </div>
                      ))
                  ) : (
                    <div className="text-secondary italic text-center py-2">No zombie rules.</div>
                  )}

                  {(!result.zombieRules || result.zombieRules.filter(r => !cleanedZombieRules.includes(r)).length === 0) && (
                    <div className="text-green-covered font-bold text-center py-4">
                      All zombie rules resolved!
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/20 text-[9px] text-tertiary font-mono">
                Clean up zombie rules to prevent tracking dead schema paths.
              </div>
            </div>

            {/* Live Telemetry Feed */}
            <div className="border border-border bg-surface p-5 rounded-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Live Telemetry Feed</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-covered animate-ping" />
                    <span className="text-[9px] font-mono text-green-covered uppercase font-medium">Listening</span>
                  </div>
                </div>

                <div className="border border-border bg-[#0d0d0d] p-4 rounded-md font-mono text-[10px] h-[105px] overflow-y-auto space-y-1.5 scrollbar-thin select-none">
                  {liveEvents.length === 0 ? (
                    <div className="text-tertiary h-full flex items-center justify-center italic text-center">
                      No live events. Simulate events to stream.
                    </div>
                  ) : (
                    liveEvents.map((evt, idx) => (
                      <div key={idx} className="flex justify-between items-center text-secondary border-b border-border/10 pb-1 last:border-b-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-green-covered shrink-0">✔</span>
                          <span className="text-primary font-semibold truncate">{evt.eventName}</span>
                          <span className="text-tertiary">({evt.route})</span>
                        </div>
                        <span className="text-tertiary text-[9px] shrink-0">{evt.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-2 text-[9px] text-tertiary font-mono">
                Simulates browser telemetry streaming to Novus nodes.
              </div>
            </div>
          </div>

          {/* Gemini AI PM Audit & Funnel Validator Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-10">
            {/* Gemini AI Product Audit */}
            {result.audit && (
              <div className="border border-border bg-surface p-5 rounded-md space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-1">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Gemini AI Product Audit</h4>
                  <span className="text-[9px] font-mono border border-border px-2 py-0.5 rounded-md uppercase font-medium text-tertiary">
                    PM Insight
                  </span>
                </div>
                
                <div className="space-y-4 text-xs">
                  {/* Blindspots */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-tertiary uppercase tracking-wider block">
                      Telemetry Blindspots
                    </span>
                    <ul className="space-y-1">
                      {result.audit.blindspots.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-secondary">
                          <span className="text-red-untracked shrink-0">▲</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Funnel */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-tertiary uppercase tracking-wider block">
                      Recommended Funnel: {result.audit.funnel.name}
                    </span>
                    <div className="flex items-center flex-wrap gap-1.5 font-mono text-[10px] bg-background border border-border p-2 rounded-md">
                      {result.audit.funnel.steps.map((step, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span className="text-tertiary">→</span>}
                          <span className="text-primary bg-surface px-1.5 py-0.5 rounded border border-border/40">{step}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Tips */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-tertiary uppercase tracking-wider block">
                      Telemetry Insights
                    </span>
                    <ul className="space-y-1">
                      {result.audit.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-secondary">
                          <span className="text-amber-partial shrink-0">●</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive PM Telemetry Funnel Validator */}
            <div className="border border-border bg-surface p-5 rounded-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Telemetry Funnel Validator</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase font-semibold ${
                      getFunnelHealth() >= 90
                        ? 'border-green-covered/30 text-green-covered bg-green-covered/10'
                        : getFunnelHealth() >= 50
                        ? 'border-amber-partial/30 text-amber-partial bg-amber-partial/10'
                        : 'border-red-untracked/30 text-red-untracked bg-red-untracked/10'
                    }`}>
                      Health: {getFunnelHealth()}%
                    </span>
                  </div>
                </div>

                {/* Preset Funnels Selection */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFunnelPreset('onboarding')}
                      className="px-2 py-1 text-[10px] font-mono border border-border hover:bg-border text-secondary hover:text-primary rounded cursor-pointer transition-colors"
                    >
                      Preset: Onboarding
                    </button>
                    <button
                      type="button"
                      onClick={() => setFunnelPreset('billing')}
                      className="px-2 py-1 text-[10px] font-mono border border-border hover:bg-border text-secondary hover:text-primary rounded cursor-pointer transition-colors"
                    >
                      Preset: Billing
                    </button>
                    <button
                      type="button"
                      onClick={() => setFunnelPreset('security')}
                      className="px-2 py-1 text-[10px] font-mono border border-border hover:bg-border text-secondary hover:text-primary rounded cursor-pointer transition-colors"
                    >
                      Preset: Security
                    </button>
                  </div>

                  {/* Visual Flow Blocks */}
                  <div className="space-y-2">
                    {funnelSteps.map((step, idx) => {
                      const matchedRoute = result.routes.find(r => r.path === step);
                      const isCovered = matchedRoute?.status === 'covered';
                      const isPartial = matchedRoute?.status === 'partial';

                      return (
                        <div key={idx} className="flex items-center justify-between bg-background border border-border/80 px-3 py-2 rounded-md font-mono text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-tertiary">#{idx + 1}</span>
                            <span className="text-primary truncate">{step}</span>
                          </div>
                          <span className={`text-[9px] uppercase font-semibold ${
                            isCovered ? 'text-green-covered' : isPartial ? 'text-amber-partial' : 'text-red-untracked'
                          }`}>
                            {isCovered ? '✓ Active' : isPartial ? '⚠ Partial' : '✗ Blind'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[9px] text-tertiary font-mono">
                PMs can validate telemetry coverage on key conversion funnels dynamically.
              </div>
            </div>
          </div>

          {/* Section 2 — Drift Map */}
          <div className="border-t border-border pt-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-mono font-bold text-primary mb-1">
                  Route coverage map
                </h3>
                <p className="text-xs text-secondary">
                  Every page route in your codebase, colored by Pendo tracking status
                </p>
              </div>

              {/* View Toggle & Map Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex border border-border bg-[#0d0d0d] rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('triage')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer text-[10px] ${
                      viewMode === 'triage'
                        ? 'bg-primary text-background font-bold'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    🚨 Triage Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('folder')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer text-[10px] ${
                      viewMode === 'folder'
                        ? 'bg-primary text-background font-bold'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    📁 Folder View
                  </button>
                </div>

                <div className="flex gap-3 text-[10px] text-secondary">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-covered" />
                    <span>Covered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-partial" />
                    <span>Partial</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-untracked" />
                    <span>Untracked</span>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'triage' ? (
              <div className="border border-border bg-[#0b0b0b] rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface border-b border-border text-tertiary text-left uppercase text-[9px] tracking-wider">
                        <th className="px-4 py-3 font-semibold">Route Path</th>
                        <th className="px-4 py-3 font-semibold text-center">Severity</th>
                        <th className="px-4 py-3 font-semibold text-right">Est. Monthly Views</th>
                        <th className="px-4 py-3 font-semibold text-right">Est. Revenue Risk</th>
                        <th className="px-4 py-3 font-semibold text-right">Pendo Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {result.routes
                        .slice()
                        .sort((a, b) => {
                          const aSev = getRouteSeverity(a);
                          const bSev = getRouteSeverity(b);
                          if (bSev.score !== aSev.score) {
                            return bSev.score - aSev.score;
                          }
                          return (b.traffic || 0) - (a.traffic || 0);
                        })
                        .map((routeItem) => {
                          const isClickable = routeItem.status !== 'covered';
                          const severity = getRouteSeverity(routeItem);
                          const revRisk = getRevenueAtRisk(routeItem);
                          const isExpanded = !!expandedRoutes[routeItem.path];
                          
                          return (
                            <React.Fragment key={routeItem.path}>
                              <tr
                                onClick={() => {
                                  if (isClickable) {
                                    toggleRouteExpand(routeItem.path);
                                  }
                                }}
                                className={`transition-colors duration-150 group border-b border-border/20 last:border-b-0 ${
                                  isClickable ? 'cursor-pointer hover:bg-[#151515]' : ''
                                } ${isExpanded ? 'bg-[#1a1a1a]/30' : ''}`}
                              >
                                <td className="px-4 py-3 font-semibold text-primary truncate max-w-[280px] sm:max-w-none">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                                        routeItem.status === 'covered'
                                          ? 'bg-green-covered'
                                          : routeItem.status === 'partial'
                                          ? 'bg-amber-partial'
                                          : 'bg-red-untracked'
                                      }`}
                                    />
                                    <span className="truncate">{routeItem.path}</span>
                                    
                                    {routeItem.featureFlag && routeItem.status !== 'covered' && (
                                      <span className="text-[8px] text-amber-partial bg-amber-partial/10 border border-amber-partial/20 px-1 py-0.2 rounded font-mono shrink-0">
                                        🟠 Flag Drift
                                      </span>
                                    )}

                                    {isClickable && (
                                      <span className="text-[9px] text-amber-partial opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {isExpanded ? '▲ close' : '→ info'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${severity.color}`}>
                                    {severity.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-secondary">
                                  {routeItem.traffic?.toLocaleString() || '0'}
                                </td>
                                <td className="px-4 py-3 text-right text-amber-partial font-bold">
                                  {revRisk > 0 ? `$${revRisk.toLocaleString()}/mo` : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded border font-mono uppercase font-medium inline-block ${
                                      routeItem.status === 'covered'
                                        ? 'border-green-covered/20 text-green-covered bg-green-covered/5'
                                        : routeItem.status === 'partial'
                                        ? 'border-amber-partial/20 text-amber-partial bg-amber-partial/5'
                                        : 'border-red-untracked/20 text-red-untracked bg-red-untracked/5'
                                    }`}
                                  >
                                    {routeItem.status}
                                  </span>
                                </td>
                              </tr>

                              {/* Inline Expanded Dropdown (UX Fix) */}
                              {isClickable && isExpanded && (
                                <tr className="bg-[#121212] border-b border-border/40">
                                  <td colSpan={5} className="px-6 py-4 font-mono text-xs">
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-start gap-4">
                                        <div>
                                          <span className="text-[9px] text-tertiary uppercase tracking-wider block mb-1">Route description</span>
                                          <p className="text-secondary font-sans text-xs">{routeItem.description || 'No description provided.'}</p>
                                        </div>
                                        
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleClickRow(routeItem.path, routeItem.status);
                                          }}
                                          className="px-3 py-1 bg-amber-partial text-background hover:bg-opacity-90 font-mono font-bold rounded transition-all cursor-pointer text-[10px] shrink-0"
                                        >
                                          🛠️ Fix (Check it out) →
                                        </button>
                                      </div>

                                      {/* Warnings inside details */}
                                      <div className="space-y-1.5">
                                        {routeItem.featureFlag && (
                                          <div className="border border-amber-partial/20 bg-amber-partial/5 p-2 rounded text-[10px] text-secondary flex items-center gap-2">
                                            <span className="text-amber-partial">🟠 Feature Flag:</span>
                                            <span>Active feature flag condition <code className="text-primary bg-surface px-1 border border-border rounded">{routeItem.featureFlag}</code> exists in the codebase.</span>
                                          </div>
                                        )}
                                        {routeItem.payloadWarning && !fixedPayloads.includes(routeItem.path) && (
                                          <div className="border border-red-untracked/20 bg-red-untracked/5 p-2 rounded text-[10px] text-secondary flex items-center gap-2">
                                            <span className="text-red-untracked">⚠️ Payload Warning:</span>
                                            <span>{routeItem.payloadWarning}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Code snippet summary */}
                                        <div>
                                          <span className="text-[9px] text-tertiary uppercase tracking-wider block mb-1">Snippet Preview</span>
                                          <pre className="bg-[#050505] border border-border/60 p-3 rounded text-[10px] overflow-x-auto text-secondary max-h-[120px] select-all leading-normal">
                                            <code>{routeItem.snippet}</code>
                                          </pre>
                                        </div>

                                        {/* Shadow Schema Summary */}
                                        {routeItem.schema && Object.keys(routeItem.schema).length > 0 && (
                                          <div>
                                            <span className="text-[9px] text-tertiary uppercase tracking-wider block mb-1">Expected Pendo Schema</span>
                                            <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto">
                                              {Object.entries(routeItem.schema).map(([key, val]) => (
                                                <div key={key} className="bg-[#050505] border border-border/40 px-2 py-1 rounded flex justify-between font-mono text-[9px]">
                                                  <span className="text-primary font-bold">{key}</span>
                                                  <span className="text-secondary">{val}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedRoutes).map(([groupName, groupItems]) => {
                  const stats = getGroupStats(groupItems);
                  return (
                    <div key={groupName} className="border border-border bg-[#0b0b0b] rounded-md overflow-hidden">
                      <div className="border-b border-border bg-surface px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-secondary">
                            {groupName === '/' ? '/' : `${groupName}/*`}
                          </span>
                          <span className="text-[10px] font-mono text-tertiary">
                            {stats.total} {stats.total === 1 ? 'route' : 'routes'}
                          </span>
                        </div>
                        
                        {/* Visual Progress Bar */}
                        <div className="flex items-center gap-3 w-full sm:w-48 shrink-0">
                          <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                stats.score >= 90
                                  ? 'bg-green-covered'
                                  : stats.score >= 50
                                  ? 'bg-amber-partial'
                                  : 'bg-red-untracked'
                              }`}
                              style={{ width: `${stats.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-secondary w-8 text-right shrink-0">
                            {stats.score}%
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-border/60">
                        {groupItems
                          .slice()
                          .sort((a, b) => getRouteSeverity(b).score - getRouteSeverity(a).score)
                          .map((routeItem) => {
                            const isClickable = routeItem.status !== 'covered';
                            const severity = getRouteSeverity(routeItem);
                            const isExpanded = !!expandedRoutes[routeItem.path];
                            return (
                              <React.Fragment key={routeItem.path}>
                                <div
                                  onClick={() => {
                                    if (isClickable) {
                                      toggleRouteExpand(routeItem.path);
                                    }
                                  }}
                                  className={`px-4 py-3 flex flex-col md:flex-row md:items-center justify-between text-xs font-mono transition-colors duration-150 group border-b border-border/20 last:border-b-0 ${
                                    isClickable ? 'cursor-pointer hover:bg-[#151515]' : ''
                                  } ${isExpanded ? 'bg-[#1a1a1a]/30' : ''}`}
                                >
                                  <div className="flex items-center gap-2 mb-2 md:mb-0 min-w-[200px]">
                                    <span
                                      className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                                        routeItem.status === 'covered'
                                          ? 'bg-green-covered'
                                          : routeItem.status === 'partial'
                                          ? 'bg-amber-partial'
                                          : 'bg-red-untracked'
                                      }`}
                                    />
                                    <span className="text-primary text-sm tracking-tight truncate">{routeItem.path}</span>
                                    
                                    {routeItem.featureFlag && routeItem.status !== 'covered' && (
                                      <span className="text-[8px] text-amber-partial bg-amber-partial/10 border border-amber-partial/20 px-1 py-0.2 rounded font-mono shrink-0">
                                        🟠 Flag Drift
                                      </span>
                                    )}

                                    {isClickable && (
                                      <span className="text-[10px] text-amber-partial opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        {isExpanded ? '▲ close' : '→ info'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="text-secondary md:flex-grow md:px-6 mb-2 md:mb-0 text-left md:text-center text-[11px] truncate flex items-center justify-start md:justify-center gap-2">
                                    <span>{routeItem.name}</span>
                                    {!isClickable && (
                                      <span className={`text-[8px] px-1 rounded border uppercase font-mono ${severity.color}`}>
                                        {severity.label}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex justify-start md:justify-end gap-2 items-center">
                                    {routeItem.status !== 'covered' && (
                                      <span className={`text-[8px] px-1 rounded border uppercase font-mono ${severity.color}`}>
                                        {severity.label}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-md border font-mono uppercase font-medium ${
                                        routeItem.status === 'covered'
                                          ? 'border-green-covered/20 text-green-covered bg-green-covered/5'
                                          : routeItem.status === 'partial'
                                          ? 'border-amber-partial/20 text-amber-partial bg-amber-partial/5'
                                          : 'border-red-untracked/20 text-red-untracked bg-red-untracked/5'
                                      }`}
                                    >
                                      {routeItem.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Folder View Inline Expanded Dropdown (UX Fix) */}
                                {isClickable && isExpanded && (
                                  <div className="bg-[#121212] border-t border-b border-border/40 px-6 py-4 space-y-4 font-mono text-xs">
                                    <div className="flex justify-between items-start gap-4">
                                      <div>
                                        <span className="text-[9px] text-tertiary uppercase tracking-wider block mb-1">Route description</span>
                                        <p className="text-secondary font-sans text-xs">{routeItem.description || 'No description provided.'}</p>
                                      </div>
                                      
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClickRow(routeItem.path, routeItem.status);
                                        }}
                                        className="px-3 py-1 bg-amber-partial text-background hover:bg-opacity-90 font-mono font-bold rounded transition-all cursor-pointer text-[10px] shrink-0"
                                      >
                                        🛠️ Fix (Check it out) →
                                      </button>
                                    </div>

                                    {/* Warnings inside details */}
                                    <div className="space-y-1.5">
                                      {routeItem.featureFlag && (
                                        <div className="border border-amber-partial/20 bg-amber-partial/5 p-2 rounded text-[10px] text-secondary flex items-center gap-2">
                                          <span className="text-amber-partial">🟠 Feature Flag:</span>
                                          <span>Active feature flag condition <code className="text-primary bg-surface px-1 border border-border rounded">{routeItem.featureFlag}</code> exists in the codebase.</span>
                                        </div>
                                      )}
                                      {routeItem.payloadWarning && !fixedPayloads.includes(routeItem.path) && (
                                        <div className="border border-red-untracked/20 bg-red-untracked/5 p-2 rounded text-[10px] text-secondary flex items-center gap-2">
                                          <span className="text-red-untracked">⚠️ Payload Warning:</span>
                                          <span>{routeItem.payloadWarning}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Code snippet summary */}
                                      <div>
                                        <span className="text-[9px] text-tertiary uppercase tracking-wider block mb-1">Snippet Preview</span>
                                        <pre className="bg-[#050505] border border-border/60 p-3 rounded text-[10px] overflow-x-auto text-secondary max-h-[120px] select-all leading-normal">
                                          <code>{routeItem.snippet}</code>
                                        </pre>
                                      </div>

                                      {/* Shadow Schema Summary */}
                                      {routeItem.schema && Object.keys(routeItem.schema).length > 0 && (
                                        <div>
                                          <span className="text-[9px] text-tertiary uppercase tracking-wider block mb-1">Expected Pendo Schema</span>
                                          <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto">
                                            {Object.entries(routeItem.schema).map(([key, val]) => (
                                              <div key={key} className="bg-[#050505] border border-border/40 px-2 py-1 rounded flex justify-between font-mono text-[9px]">
                                                <span className="text-primary font-bold">{key}</span>
                                                <span className="text-secondary">{val}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

          {/* Section 3 — Fix Kit */}
          {activeTab === 'fixkit' && (
            <div>
              {result.routes.every((r: AnalysisRoute) => r.status === 'covered') ? (
                <div className="border border-border bg-surface p-12 rounded-md text-center space-y-3">
                  <span className="text-3xl">🎉</span>
                  <h3 className="text-lg font-mono font-bold text-green-covered">100% Telemetry Coverage Achieved!</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto">
                    All scanned codebase routes are actively mapped to valid Pendo telemetry rules. No drift detected.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-mono font-bold text-primary mb-1">
                      Fix kit
                    </h3>
                    <p className="text-xs text-secondary">
                      Copy-paste Pendo tracking snippets for every uncovered route. Drop these in your page components.
                    </p>
                  </div>

              {/* Cards List separated by border-t border-[#222222] */}
              <div className="divide-y divide-[#222222]">
                {result.routes
                  .filter((r: AnalysisRoute) => r.status !== 'covered')
                  .map((routeItem: AnalysisRoute) => (
                    <div
                      key={routeItem.path}
                      id={routeItem.path.replace(/\//g, '-')}
                      className={`py-6 px-4 first:pt-4 space-y-4 relative rounded-md transition-all duration-300 ${
                        focusedRoutePath === routeItem.path
                          ? 'border border-amber-partial/30 bg-amber-partial/[0.03] scale-[1.01]'
                          : 'border border-transparent'
                      }`}
                    >
                      {/* Top Row: Path + badge */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-primary font-bold">{routeItem.path}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md border font-mono uppercase ${
                            routeItem.status === 'partial'
                              ? 'border-amber-partial/20 text-amber-partial bg-amber-partial/5'
                              : 'border-red-untracked/20 text-red-untracked bg-red-untracked/5'
                          }`}
                        >
                          {routeItem.status}
                        </span>
                      </div>

                      {/* Second Row: Human name + description */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-sans font-bold text-primary">{routeItem.name}</h4>
                        {routeItem.description && (
                          <p className="text-xs text-secondary">{routeItem.description}</p>
                        )}
                      </div>

                      {/* Action buttons (Direct Sync & Simulation) */}
                      <div className="flex flex-wrap gap-3 mt-2 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => syncRouteToPendo(routeItem)}
                          disabled={syncingIndex[routeItem.path] === 'loading' || syncingIndex[routeItem.path] === 'success'}
                          className={`px-3 py-1.5 border font-semibold rounded-md transition-colors cursor-pointer ${
                            syncingIndex[routeItem.path] === 'success'
                              ? 'border-green-covered/40 text-green-covered bg-green-covered/10 cursor-default'
                              : syncingIndex[routeItem.path] === 'loading'
                              ? 'border-border text-secondary cursor-wait bg-surface/50'
                              : 'border-[#222222] text-primary bg-surface hover:bg-[#111111]'
                          }`}
                        >
                          {syncingIndex[routeItem.path] === 'success'
                            ? 'Synced ✓'
                            : syncingIndex[routeItem.path] === 'loading'
                            ? 'Syncing Pendo...'
                            : 'Sync to Pendo Dashboard'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimulateEvent(routeItem)}
                          className="px-3 py-1.5 border border-[#222222] text-primary bg-surface hover:bg-[#111111] font-semibold rounded-md transition-colors cursor-pointer"
                        >
                          Simulate Event (Telemetrate)
                        </button>

                        {/* Issue Exporters (Loop 3) */}
                        <a
                          href={getIssueLinks(routeItem).githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 border border-[#222222] text-primary bg-surface hover:bg-[#111111] font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          🎫 Export GitHub
                        </a>
                        <a
                          href={getIssueLinks(routeItem).linearUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 border border-[#222222] text-primary bg-surface hover:bg-[#111111] font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          📐 Export Linear
                        </a>
                      </div>

                      {/* Payload warning indicator (Loop 10) */}
                      {routeItem.payloadWarning && !fixedPayloads.includes(routeItem.path) && (
                        <div className="border border-red-untracked/20 bg-red-untracked/5 p-3 rounded-md text-xs text-secondary font-mono flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-red-untracked">⚠️ Payload Schema Warning:</span>
                            <span className="text-primary font-bold">{routeItem.payloadWarning}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFixedPayloads(prev => [...prev, routeItem.path]);
                              showToast(`Remediated schema warning for ${routeItem.path}`);
                              trackPendoEvent('payload_warning_fixed', { path: routeItem.path });
                            }}
                            className="px-2.5 py-1 bg-red-untracked/20 hover:bg-red-untracked/30 border border-red-untracked/40 text-red-untracked text-[9px] font-semibold rounded max-w-fit cursor-pointer transition-colors"
                          >
                            Auto-Fix Payload Syntax
                          </button>
                        </div>
                      )}

                      {routeItem.payloadWarning && fixedPayloads.includes(routeItem.path) && (
                        <div className="border border-green-covered/20 bg-green-covered/5 p-3 rounded-md text-xs text-green-covered font-mono flex items-center gap-2 mt-2">
                          <span>✓ Payload schema warning resolved. Code structure sanitized.</span>
                        </div>
                      )}

                      {/* Feature Flag Warning (Loop 1) */}
                      {routeItem.featureFlag && (
                        <div className="border border-amber-partial/20 bg-amber-partial/5 p-3 rounded-md text-xs text-secondary font-mono flex items-center gap-2 mt-2">
                          <span className="text-amber-partial">🟠 Flag Drift:</span>
                          <span>Wrapped in active flag <code className="text-primary bg-surface px-1 py-0.5 border border-border rounded">{routeItem.featureFlag}</code>. Toggle this flag in Pendo to activate telemetry segments.</span>
                        </div>
                      )}

                      {/* Code Block */}
                      <div className="relative">
                        <pre className="text-xs bg-[#0d0d0d] border border-border p-4 rounded-md overflow-x-auto font-mono text-secondary leading-relaxed select-all">
                          <code>{routeItem.snippet}</code>
                        </pre>
                        <button
                          type="button"
                          onClick={() => copySingleSnippet(routeItem.snippet, routeItem.path, routeItem.eventName)}
                          className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-mono border border-border bg-[#0d0d0d] hover:bg-[#1a1a1a] transition-all cursor-pointer ${
                            copiedIndex === routeItem.path
                              ? 'text-green-covered border-green-covered/40 font-semibold'
                              : 'text-secondary hover:text-primary'
                          }`}
                        >
                          {copiedIndex === routeItem.path ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>

                      {/* Shadow Schema Map */}
                      {routeItem.schema && Object.keys(routeItem.schema).length > 0 && (
                        <div className="border border-border bg-[#0d0d0d] p-4 rounded-md space-y-2 mt-3 select-none">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-amber-partial uppercase tracking-wider font-semibold">Pendo Shadow Schema (AI-Generated)</span>
                            <span className="text-[9px] font-mono text-secondary">expected event properties</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(routeItem.schema).map(([key, type]) => (
                              <div key={key} className="bg-surface border border-border/40 px-3 py-2 rounded flex flex-col font-mono text-[11px]">
                                <span className="text-primary font-bold">{key}</span>
                                <span className="text-secondary text-[10px]">{type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Copy All Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={copyAllSnippets}
                  className={`w-full py-3 border border-[#222222] bg-transparent text-sm font-mono font-semibold rounded-md hover:bg-[#111111] transition-colors cursor-pointer ${
                    copiedAll ? 'text-green-covered border-green-covered/40' : 'text-white'
                  }`}
                >
                  {copiedAll ? 'All snippets copied ✓' : 'Copy all snippets →'}
                </button>
              </div>
                </>
              )}
            </div>
          )}
          {/* Section 4 — CI/CD Guardrails */}
          {activeTab === 'cicd' && (
            <div className="border border-border bg-surface p-6 rounded-md space-y-6 animate-fade-in w-full">
              <div className="border-b border-border/40 pb-3">
                <h3 className="text-lg font-mono font-bold text-primary mb-1">
                  CI/CD Telemetry Guardrails
                </h3>
                <p className="text-xs text-secondary">
                  Prevent telemetry drift automatically by blocking pull requests that introduce untracked pages.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Add this GitHub Action workflow to your repository under <code className="text-primary font-mono bg-background px-1 py-0.5 rounded border border-border">.github/workflows/telemetry-drift.yml</code>. It runs a headless scan on every Pull Request, checks for analytics coverage, and fails the build if new routes lack Pendo rules.
                </p>

                <div className="relative">
                  <pre className="text-xs bg-[#0d0d0d] border border-border p-4 rounded-md overflow-x-auto font-mono text-secondary leading-relaxed select-all">
                    <code>{`name: Telemetry Drift Audit

on:
  pull_request:
    branches: [ main, master ]

jobs:
  audit-telemetry:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Drift CLI
        run: npm install -g @drift-report/cli

      - name: Run Telemetry Drift Scanner
        env:
          PENDO_API_KEY: \${{ secrets.PENDO_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          drift-scanner --dir ./app --threshold 80 --comment-pr true
`}</code>
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`name: Telemetry Drift Audit

on:
  pull_request:
    branches: [ main, master ]

jobs:
  audit-telemetry:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Drift CLI
        run: npm install -g @drift-report/cli

      - name: Run Telemetry Drift Scanner
        env:
          PENDO_API_KEY: \${{ secrets.PENDO_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          drift-scanner --dir ./app --threshold 80 --comment-pr true`);
                      showToast("CI/CD YAML copied to clipboard");
                    }}
                    className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-mono border border-border bg-[#0d0d0d] hover:bg-[#1a1a1a] transition-all text-secondary hover:text-primary cursor-pointer"
                  >
                    Copy YAML
                  </button>
                </div>

                <div className="bg-[#111] border-l-2 border-red-untracked/50 p-4 rounded font-mono text-[10px] space-y-2 text-secondary">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="text-red-untracked">❌</span>
                    <span>Workflow Failure Example (PR Commit Status)</span>
                  </div>
                  <p>Running: drift-scanner --dir ./app --threshold 80</p>
                  <p className="text-red-untracked font-semibold">❌ Telemetry Drift Detected: 2 new routes added without tracking rules.</p>
                  <p> - /dashboard/settings (Untracked) - 0% coverage</p>
                  <p> - /billing/invoices (Untracked) - 0% coverage</p>
                  <p className="text-primary font-semibold">Total Coverage: 69.2% (Below threshold of 80%) — Build Failed.</p>
                </div>
              </div>
            </div>
          )}

          </div> {/* Close Tab content wrapper */}
        </div> {/* Close Right Main Content panel */}

          {/* Floating Share Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              type="button"
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2.5 bg-primary text-background font-mono text-xs font-bold rounded-md shadow-2xl hover:bg-opacity-90 active:scale-[0.98] transition-all border border-border cursor-pointer ${
                shareLabel.includes('copied') ? 'text-green-covered border-green-covered/40' : ''
              }`}
            >
              {shareLabel}
            </button>
          </div>
        </div>
      )}

      {/* Floating Keyboard Shortcuts Legend */}
      {analysisCompleted && showShortcutsLegend && (
        <div className="fixed bottom-6 left-6 z-40 bg-surface border border-border p-4 rounded-md shadow-2xl w-52 font-mono text-[10px] space-y-2 select-none animate-fade-in">
          <div className="flex justify-between items-center border-b border-border/60 pb-1.5 mb-1.5">
            <span className="text-secondary uppercase font-bold tracking-wider">Keyboard shortcuts</span>
            <button
              onClick={() => setShowShortcutsLegend(false)}
              className="text-tertiary hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px]"
            >
              [esc]
            </button>
          </div>
          <div className="space-y-1.5 text-secondary">
            <div className="flex justify-between items-center">
              <span>Next Untracked</span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-primary font-bold shadow-sm">J</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Simulate Fix</span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-primary font-bold shadow-sm">F</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Share Report</span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-primary font-bold shadow-sm">S</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Re-open Button if closed */}
      {analysisCompleted && !showShortcutsLegend && (
        <button
          onClick={() => setShowShortcutsLegend(true)}
          className="fixed bottom-6 left-6 z-40 bg-surface border border-border hover:bg-background px-2.5 py-1.5 rounded-md shadow-2xl font-mono text-[9px] text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          [?] Shortcuts
        </button>
      )}

      {/* Lightweight Custom Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 z-50 bg-[#111111] border border-border text-primary px-4 py-2.5 text-xs font-mono rounded-md shadow-2xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Chrome Extension HUD Simulation Modal (Loop 5) */}
      {isChromeHudOpen && result && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border-2 border-border w-full max-w-4xl h-[80vh] rounded-md overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="border-b border-border bg-surface px-4 py-3 flex justify-between items-center font-mono">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">🕵️‍♂️ Chrome Extension HUD Simulation</span>
                <span className="text-[9px] uppercase bg-amber-partial/20 border border-amber-partial/30 text-amber-partial px-1.5 py-0.5 rounded font-semibold">
                  Sandbox Active
                </span>
              </div>
              <button
                onClick={() => setIsChromeHudOpen(false)}
                className="text-secondary hover:text-primary font-bold text-sm cursor-pointer p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Side: Browser Replica */}
              <div className="flex-grow bg-[#151515] p-4 flex flex-col overflow-hidden border-r border-border/80">
                {/* Browser Address Bar */}
                <div className="bg-surface border border-border rounded-md px-3 py-2 flex items-center gap-2 mb-4 font-mono text-xs text-secondary shrink-0">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-grow bg-background border border-border/40 rounded px-2.5 py-1 text-[11px] truncate flex justify-between items-center">
                    <span>https://acme-app.com{chromeHudPage}</span>
                    <span className="text-tertiary">🔒 SSL Secure</span>
                  </div>
                </div>

                {/* Page Selector Tabs */}
                <div className="flex gap-2 mb-3 shrink-0">
                  {['/dashboard/settings', '/billing', '/onboarding/[step]'].map((pagePath) => {
                    const matched = result.routes.find(r => r.path === pagePath);
                    const isCovered = matched?.status === 'covered';
                    return (
                      <button
                        key={pagePath}
                        onClick={() => setChromeHudPage(pagePath)}
                        className={`px-2.5 py-1 border text-[10px] font-mono rounded cursor-pointer transition-all ${
                          chromeHudPage === pagePath
                            ? 'bg-primary text-background border-primary font-bold'
                            : 'border-border text-secondary hover:text-primary bg-surface'
                        }`}
                      >
                        {pagePath} ({isCovered ? '🟢' : '🔴'})
                      </button>
                    );
                  })}
                </div>

                {/* Simulated Webpage Content Container */}
                <div className="flex-grow bg-[#0d0d0d] border border-border rounded-md p-6 font-sans relative overflow-y-auto select-none">
                  {chromeHudPage === '/dashboard/settings' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/40 pb-3 flex justify-between items-center">
                        <div>
                          <h2 className="text-lg font-bold text-primary">Workspace settings</h2>
                          <p className="text-xs text-secondary">Configure your corporate account details</p>
                        </div>
                        <span className="text-[10px] font-mono text-amber-partial border border-amber-partial/30 px-2 py-0.5 rounded bg-amber-partial/5">
                          Unsaved Changes
                        </span>
                      </div>

                      {/* Profile Settings Block */}
                      <div className="border border-red-untracked/45 p-4 rounded bg-red-untracked/[0.02] relative group">
                        <span className="absolute -top-2.5 left-3 bg-[#0d0d0d] px-1.5 font-mono text-[9px] text-red-untracked border border-red-untracked/30 rounded uppercase font-bold">
                          🔴 Untracked Container: ProfileForm
                        </span>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-tertiary block mb-1">WORKSPACE NAME</label>
                              <input type="text" disabled defaultValue="Acme Corp" className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-primary" />
                            </div>
                            <div>
                              <label className="text-[10px] text-tertiary block mb-1">BILLING EMAIL</label>
                              <input type="text" disabled defaultValue="billing@acme.com" className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-primary" />
                            </div>
                          </div>
                          <button type="button" className="px-3 py-1.5 bg-[#222] border border-border rounded text-xs text-secondary font-semibold">
                            Save Workspace Profile
                          </button>
                        </div>
                      </div>

                      {/* Settings Option Block */}
                      <div className="border border-red-untracked/45 p-4 rounded bg-red-untracked/[0.02] relative group">
                        <span className="absolute -top-2.5 left-3 bg-[#0d0d0d] px-1.5 font-mono text-[9px] text-red-untracked border border-red-untracked/30 rounded uppercase font-bold">
                          🔴 Untracked Toggle: BillingToggle
                        </span>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-primary block">Sandbox Environment</span>
                            <span className="text-[10px] text-secondary block">Execute simulations with sandbox telemetry endpoints</span>
                          </div>
                          <div className="w-9 h-5 bg-[#222] border border-border rounded-full p-0.5 cursor-not-allowed">
                            <div className="w-3.5 h-3.5 bg-[#444] rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {chromeHudPage === '/billing' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/40 pb-3">
                        <h2 className="text-lg font-bold text-primary">Billing plans</h2>
                        <p className="text-xs text-secondary">Upgrade or modify your organization sub-tier</p>
                      </div>

                      {/* pricing grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-green-covered/40 p-4 rounded bg-green-covered/[0.02] relative">
                          <span className="absolute -top-2.5 left-3 bg-[#0d0d0d] px-1.5 font-mono text-[9px] text-green-covered border border-green-covered/30 rounded uppercase font-bold">
                            🟢 Tracked: PriceCard
                          </span>
                          <span className="text-xs font-bold text-secondary uppercase block mb-1">PRO PLAN</span>
                          <span className="text-2xl font-bold text-primary font-mono">$49<span className="text-xs text-tertiary">/mo</span></span>
                          <button type="button" className="w-full mt-4 py-1.5 bg-green-covered text-background text-xs font-semibold rounded">
                            Active Tier
                          </button>
                        </div>

                        <div className="border border-green-covered/40 p-4 rounded bg-green-covered/[0.02] relative">
                          <span className="absolute -top-2.5 left-3 bg-[#0d0d0d] px-1.5 font-mono text-[9px] text-green-covered border border-green-covered/30 rounded uppercase font-bold">
                            🟢 Tracked: CheckoutButton
                          </span>
                          <span className="text-xs font-bold text-secondary uppercase block mb-1">ENTERPRISE</span>
                          <span className="text-2xl font-bold text-primary font-mono">Custom</span>
                          <button type="button" className="w-full mt-4 py-1.5 border border-green-covered/40 text-green-covered text-xs font-semibold rounded hover:bg-green-covered/10">
                            Upgrade Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {chromeHudPage === '/onboarding/[step]' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/40 pb-3 flex justify-between items-center">
                        <div>
                          <h2 className="text-lg font-bold text-primary">Onboarding flow</h2>
                          <p className="text-xs text-secondary">Step 2: Initialize integrations</p>
                        </div>
                        <span className="text-xs font-mono text-secondary">2 of 4</span>
                      </div>

                      {/* Onboarding steps */}
                      <div className="border border-red-untracked/45 p-4 rounded bg-red-untracked/[0.02] relative">
                        <span className="absolute -top-2.5 left-3 bg-[#0d0d0d] px-1.5 font-mono text-[9px] text-red-untracked border border-red-untracked/30 rounded uppercase font-bold">
                          🔴 Untracked Container: SignUpForm
                        </span>
                        <div className="space-y-4">
                          <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-red-untracked w-1/2" />
                          </div>
                          <div className="border border-border/40 p-3 rounded text-xs text-secondary font-mono bg-surface">
                            Google Integration: Disconnected
                          </div>
                          <button type="button" className="w-full py-2 bg-red-untracked/20 hover:bg-red-untracked/30 text-red-untracked border border-red-untracked/40 text-xs font-semibold rounded">
                            Simulate Connect Google Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Floating Extension HUD popup */}
              <div className="w-full md:w-[300px] bg-surface p-4 flex flex-col justify-between overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-border/80">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-2 shrink-0">
                    <span className="text-lg">🕵️‍♂️</span>
                    <div>
                      <h3 className="font-mono text-xs font-bold text-primary">Novus Drift HUD</h3>
                      <p className="text-[9px] font-mono text-secondary">Telemetry Command HUD v1.0.4</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-mono text-[10px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-tertiary">Current route</span>
                        <span className="text-primary font-bold">{chromeHudPage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-tertiary">Tracking status</span>
                        {(() => {
                          const matched = result.routes.find(r => r.path === chromeHudPage);
                          const isCovered = matched?.status === 'covered';
                          const isPartial = matched?.status === 'partial';
                          return (
                            <span className={`font-bold ${isCovered ? 'text-green-covered' : isPartial ? 'text-amber-partial' : 'text-red-untracked'}`}>
                              {isCovered ? '🟢 COVERED' : isPartial ? '🟠 PARTIAL' : '🔴 UNTRACKED'}
                            </span>
                          );
                        })()}
                      </div>
                      {(() => {
                        const matched = result.routes.find(r => r.path === chromeHudPage);
                        if (matched?.featureFlag) {
                          return (
                            <div className="flex justify-between">
                              <span className="text-tertiary">Feature Flag</span>
                              <span className="text-amber-partial bg-amber-partial/10 border border-amber-partial/20 px-1 py-0.2 rounded text-[8px] font-bold">
                                {matched.featureFlag}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* HUD Body Stats */}
                    {(() => {
                      const matched = result.routes.find(r => r.path === chromeHudPage);
                      if (matched) {
                        const revRisk = getRevenueAtRisk(matched);
                        const severity = getRouteSeverity(matched);
                        
                        return (
                          <div className="space-y-2 font-mono text-[9px] bg-background border border-border p-3 rounded">
                            <div className="flex justify-between">
                              <span className="text-tertiary">Traffic views/mo</span>
                              <span className="text-primary">{matched.traffic?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-tertiary">Est. Revenue Risk</span>
                              <span className="text-amber-partial font-bold">{revRisk > 0 ? `$${revRisk.toLocaleString()}/mo` : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-tertiary">Triage Severity</span>
                              <span className={`px-1 rounded border uppercase font-bold text-[8px] ${severity.color}`}>{severity.label}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Live Rules Scanner mockup in HUD */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-tertiary uppercase tracking-wider block">Pendo Config Payload Matcher</span>
                      {(() => {
                        const matched = result.routes.find(r => r.path === chromeHudPage);
                        const isCovered = matched?.status === 'covered';
                        if (isCovered) {
                          return (
                            <div className="text-[10px] font-mono text-secondary border border-green-covered/20 bg-green-covered/5 p-2 rounded">
                              <span className="text-green-covered block mb-1">✔ Rule active:</span>
                              <code>{matched.eventName}</code> tracks page views with schema correctly.
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-[10px] font-mono text-secondary border border-red-untracked/20 bg-red-untracked/5 p-2 rounded space-y-2">
                              <span className="text-red-untracked block">✗ Telemetry drift:</span>
                              No active Pendo rules map to page components.
                              <button
                                type="button"
                                onClick={() => {
                                  if (matched) {
                                    syncRouteToPendo(matched);
                                    showToast(`Injected telemetry listener for ${matched.path}`);
                                  }
                                }}
                                className="w-full mt-2 py-1 bg-red-untracked/20 hover:bg-red-untracked/30 border border-red-untracked/40 text-red-untracked text-[9px] font-bold rounded cursor-pointer"
                              >
                                ⚡ Inject Telemetry Listener
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3 mt-4 text-[9px] font-mono text-tertiary">
                  This HUD simulates how telemetry engineers track gaps inside live staging domains using browser overlays.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
