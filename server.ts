import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { generateProposalBookletPdf } from './server/booklet.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Downloadable 10-Page Proposal Booklet PDF (/booklet.pdf & /api/booklet.pdf)
  const handleBookletPdf = async (req: Request, res: Response) => {
    try {
      const zeroVisa = Number(req.query.zeroVisa) || 6499;
      const oneVisa = Number(req.query.oneVisa) || 11200;
      const mainland = Number(req.query.mainland) || 11800;

      const pdfBuffer = await generateProposalBookletPdf({
        zeroVisaPriceAed: zeroVisa,
        oneVisaPriceAed: oneVisa,
        mainlandPriceAed: mainland,
      });

      res.status(200);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="simplybiznest-booklet.pdf"');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('PDF generation failed:', error);
      res.status(500).json({ error: 'Unable to generate PDF booklet at this time.' });
    }
  };

  app.get('/booklet.pdf', handleBookletPdf);
  app.get('/api/booklet.pdf', handleBookletPdf);

  // 2. Server-Side WhatsApp Formation Chatbot (/api/chat)
  app.post('/api/chat', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Chatbot backend is not configured yet. Please continue directly on WhatsApp with our formation desk.',
      });
      return;
    }

    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 1500) : '';
    if (!message) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const systemInstruction = `You are the official UAE WhatsApp Formation Chatbot for SimplyBizNest (simplybiznest.com), Dubai's VIP Express Desk.
Tone: Executive, concise, authoritative, transparent, no buzzwords.
Core Pricing Reference (Authority Govt Fee + SimplyBizNest Service Charge):
- Zero-Visa Free Zone Package: AED 6,499 total (AED 4,999 Authority Fee + AED 1,500 Service Charge; Year 2 renewal AED 5,750)
- 1-Visa Resident Free Zone Package: AED 11,200 total (AED 9,200 Authority, Establishment Card & Visa/EID + AED 2,000 Service Charge; Year 2 renewal AED 9,900)
- Dubai Mainland DET LLC: AED 11,800 total (AED 9,500 DET Govt & TASHEEL Fee + AED 2,300 Service Charge; Year 2 renewal AED 10,400)
- Banking partners covered: Wio Business (2-5 business days post-EID), Mashreq NeoBiz (5-10 days), RAKBANK (7-14 days). Always state honestly that final bank account approval rests with the regulated UAE bank—never promise a 100% guarantee.
Contact Policy: ONLY mention WhatsApp advisory on the website or info@simplybiznest.com. NEVER invent or state any landline/phone number or physical street address.
If the user mentions a business type, jurisdiction, or visa count, include a structured suggestedQuote object so they can lock it into the live tracker immediately.`;

    const rawHistory: unknown[] = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
    const conversationLines = rawHistory
      .filter(
        (m): m is { role: string; text: string } =>
          typeof m === 'object' && m !== null && 'role' in m && 'text' in m
      )
      .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Client' : 'Advisor'}: ${String(m.text).slice(0, 800)}`);
    conversationLines.push(`Client: ${message}`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationLines.join('\n'),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Clear, helpful response answering the UAE formation or banking question.',
              },
              includeSuggestedQuote: {
                type: Type.BOOLEAN,
                description: 'True when the user is asking about setting up a company, pricing, or a quote.',
              },
              jurisdiction: {
                type: Type.STRING,
                description: 'Either "Free Zone" or "Mainland".',
              },
              activity: {
                type: Type.STRING,
                description:
                  'One of: Management & Strategy Consultancy, E-Commerce & Digital Retail, Software Engineering & SaaS, Marketing, Media & Design Studio, General Trading & Import/Export, Holding & Investment SPV, Fintech & Web3 Advisory.',
              },
              visaCount: {
                type: Type.INTEGER,
                description: 'Recommended integer visa count between 0 and 10.',
              },
            },
            required: ['reply', 'includeSuggestedQuote'],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw) as {
        reply?: string;
        includeSuggestedQuote?: boolean;
        jurisdiction?: string;
        activity?: string;
        visaCount?: number;
      };

      res.json({
        reply: parsed.reply || 'I can help you structure your UAE Free Zone or Mainland company.',
        suggestedQuote: parsed.includeSuggestedQuote
          ? {
              jurisdiction: parsed.jurisdiction === 'Mainland' ? 'Mainland' : 'Free Zone',
              activity: parsed.activity || 'Management & Strategy Consultancy',
              visaCount: Math.max(0, Math.min(10, Number(parsed.visaCount ?? 1) || 0)),
            }
          : undefined,
      });
    } catch (error) {
      console.error('Gemini API error:', error);
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Unable to reach Gemini formation advisor.',
      });
    }
  });

  // 3. Pipedrive CRM Status & Sync Routes
  app.get('/api/pipedrive/status', (_req: Request, res: Response) => {
    const token = process.env.PIPEDRIVE_API_TOKEN?.trim() || '';
    const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN?.trim() || '';
    const configured = Boolean(token && domain && /^[a-zA-Z0-9-]+$/.test(domain));
    res.json({
      configured,
      domain: configured ? domain : null,
    });
  });

  app.post('/api/pipedrive/sync', async (req: Request, res: Response) => {
    const token = process.env.PIPEDRIVE_API_TOKEN?.trim() || '';
    const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN?.trim() || '';

    const trackingCode = typeof req.body?.trackingCode === 'string' ? req.body.trackingCode.trim() : '';
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim().slice(0, 120) : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim().slice(0, 40) : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 160) : '';
    const jurisdiction = req.body?.jurisdiction === 'Mainland' ? 'Mainland' : 'Free Zone';
    const activity = typeof req.body?.activity === 'string' ? req.body.activity.trim().slice(0, 140) : '';
    const visaCount = Number(req.body?.visaCount ?? 0);
    const estimatedAed = Number(req.body?.estimatedAed ?? 0);

    if (!/^SBN-[A-Z0-9]{6,10}$/.test(trackingCode) || !fullName) {
      res.status(400).json({ error: 'Valid trackingCode and fullName are required.' });
      return;
    }

    if (!token || !domain || !/^[a-zA-Z0-9-]+$/.test(domain)) {
      res.json({
        status: 'pending_config',
        dealId: '',
        message: 'Pipedrive credentials not configured; lead staged as pending_config.',
      });
      return;
    }

    try {
      const baseUrl = `https://${domain}.pipedrive.com/api/v1`;

      // Create Person
      const personRes = await fetch(`${baseUrl}/persons?api_token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: email ? [{ value: email, primary: true, label: 'work' }] : undefined,
          phone: phone ? [{ value: phone, primary: true, label: 'mobile' }] : undefined,
        }),
      });
      const personJson = (await personRes.json()) as { success?: boolean; data?: { id?: number } };
      const personId = personJson?.data?.id;

      // Create Deal
      const dealRes = await fetch(`${baseUrl}/deals?api_token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${trackingCode} — ${fullName} (${jurisdiction}, ${visaCount} Visas)`,
          value: estimatedAed,
          currency: 'AED',
          person_id: personId,
        }),
      });
      const dealJson = (await dealRes.json()) as { success?: boolean; data?: { id?: number }; error?: string };

      if (!dealRes.ok || !dealJson.success || !dealJson.data?.id) {
        res.status(502).json({
          status: 'error',
          dealId: '',
          message: dealJson.error || 'Pipedrive deal creation failed.',
        });
        return;
      }

      const dealId = String(dealJson.data.id);

      // Attach activity note
      await fetch(`${baseUrl}/notes?api_token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: dealJson.data.id,
          content: `simplybiznest.com Quote ${trackingCode} | Jurisdiction: ${jurisdiction} | Activity: ${activity} | Visas: ${visaCount} | Estimate: AED ${estimatedAed}`,
        }),
      }).catch(() => {});

      res.json({
        status: 'synced',
        dealId,
      });
    } catch (error) {
      console.error('Pipedrive sync error:', error);
      res.status(502).json({
        status: 'error',
        dealId: '',
        message: error instanceof Error ? error.message : 'Pipedrive sync request failed.',
      });
    }
  });

  // 4. Vite Dev Middleware vs. Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`simplybiznest.com server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
