import { ExternalLink, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { submitFormationLead } from '../lib/firestoreService';
import {
  calculateSetupCost,
  COUNTRY_CODES,
  detectCountryCodeByTimezone,
} from '../lib/pricing';
import { ChatMessage, Jurisdiction, SiteConfig } from '../types';

interface FloatingAdvisorProps {
  config: SiteConfig;
  onTrackCode?: (code: string) => void;
}

export function FloatingAdvisor({ config, onTrackCode }: FloatingAdvisorProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Welcome to simplybiznest.com WhatsApp Formation Chatbot. Ask about UAE Free Zone vs. Dubai Mainland setup costs, residency visas, or Wio/Mashreq/RAKBANK KYC—or transfer your inquiry straight to our WhatsApp desk.',
    },
  ]);

  const [stagingQuote, setStagingQuote] = useState<{
    jurisdiction: Jurisdiction;
    activity: string;
    visaCount: number;
  } | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadCode, setLeadCode] = useState(() => detectCountryCodeByTimezone());
  const [leadPhone, setLeadPhone] = useState('');
  const [stagingBusy, setStagingBusy] = useState(false);
  const [stagedTracking, setStagedTracking] = useState<string | null>(null);

  const cleanWaNumber = config.whatsappNumber.replace(/[^0-9]/g, '') || '971500000000';
  const buildWhatsappHref = (customSummary?: string) => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.text;
    const text =
      customSummary ||
      (lastUserMessage
        ? `Hello simplybiznest.com WhatsApp Formation Desk, I was chatting on your site about: "${lastUserMessage}"`
        : 'Hello simplybiznest.com WhatsApp Formation Desk, I would like a UAE company formation quote.');
    return `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-6),
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        suggestedQuote?: {
          jurisdiction: Jurisdiction;
          activity: string;
          visaCount: number;
        };
      };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              data.error ||
              'Automated chatbot reply is temporarily unavailable. Use the "Continue on WhatsApp" button above to message our formation desk directly.',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply || 'How else can I assist with your UAE formation?',
            suggestedQuote: data.suggestedQuote,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Network error reaching the formation chatbot. Tap "Continue on WhatsApp" to connect directly with our UAE desk.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stagingQuote || leadName.trim().length < 2 || leadPhone.trim().length < 6) return;

    setStagingBusy(true);
    try {
      const breakdown = calculateSetupCost(
        stagingQuote.jurisdiction,
        stagingQuote.activity,
        stagingQuote.visaCount,
        config
      );
      const code = await submitFormationLead({
        fullName: leadName.trim(),
        countryCode: leadCode,
        whatsapp: leadPhone.trim(),
        email: '',
        jurisdiction: stagingQuote.jurisdiction,
        activity: stagingQuote.activity,
        visaCount: stagingQuote.visaCount,
        estimatedAed: breakdown.totalAed,
        estimatedUsd: breakdown.totalUsd,
        source: 'whatsapp-chatbot',
      });
      setStagedTracking(code);
      setStagingQuote(null);
      setLeadName('');
      setLeadPhone('');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Your quote has been locked into our tracker under reference ${code} (AED ${breakdown.totalAed.toLocaleString()}). You can also share ${code} directly on WhatsApp.`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Unable to lock quote right now.',
        },
      ]);
    } finally {
      setStagingBusy(false);
    }
  };

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0b1f4b] hover:bg-[#2863e8] text-white shadow-xl border border-white/15 text-sm font-bold transition-colors"
          aria-label="Open WhatsApp Formation Chatbot"
        >
          <MessageCircle className="w-4 h-4 text-[#93C5FD]" />
          <span className="hidden sm:inline">WhatsApp Formation Chat</span>
        </button>
      ) : (
        <div className="w-[340px] sm:w-[390px] bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
          {/* Drawer Header */}
          <div className="bg-[#0b1f4b] text-white px-4 py-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#93C5FD]">simplybiznest.com</p>
              <h3 className="text-sm font-bold truncate">WhatsApp Formation Chatbot</h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={buildWhatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#2863e8] hover:bg-[#1e50c4] text-white text-xs font-bold whitespace-nowrap transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white"
                aria-label="Close WhatsApp Formation Chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F7FC]">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#2863e8] text-white'
                      : 'bg-white border border-[#E2E8F0] text-[#1E293B]'
                  }`}
                >
                  {m.text}
                </div>
                {m.role === 'assistant' && m.suggestedQuote && !stagingQuote && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStagingQuote(m.suggestedQuote!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1f4b] text-white text-xs font-bold hover:bg-[#2863e8] transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Stage {m.suggestedQuote.jurisdiction} ({m.suggestedQuote.visaCount} Visas)
                      </span>
                    </button>
                    <a
                      href={buildWhatsappHref(
                        `Hello simplybiznest.com, I would like to proceed with ${m.suggestedQuote.jurisdiction} (${m.suggestedQuote.activity}, ${m.suggestedQuote.visaCount} visas).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2863e8] bg-white text-[#2863e8] hover:bg-[#F4F7FC] text-xs font-bold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Send via WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-xs text-[#475569] bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 w-fit">
                Preparing UAE formation response...
              </div>
            )}

            {stagedTracking && onTrackCode && (
              <div className="bg-white border border-[#2863e8]/40 rounded-lg p-3 text-xs space-y-2">
                <p className="font-bold text-[#0b1f4b]">
                  Staged Tracking ID: <span className="font-mono">{stagedTracking}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onTrackCode(stagedTracking);
                      setOpen(false);
                    }}
                    className="text-[#2863e8] font-bold hover:underline"
                  >
                    View in Live Tracker
                  </button>
                  <a
                    href={buildWhatsappHref(
                      `Hello simplybiznest.com desk, please review my staged application reference ${stagedTracking}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0b1f4b] font-bold hover:text-[#2863e8]"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#2863e8]" />
                    <span>Open Reference in WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {stagingQuote && (
              <form
                onSubmit={handleStageSubmit}
                className="bg-white border border-[#2863e8] rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0b1f4b]">
                    Lock {stagingQuote.jurisdiction} Quote ({stagingQuote.visaCount} Visas)
                  </span>
                  <button
                    type="button"
                    onClick={() => setStagingQuote(null)}
                    className="text-[#475569] hover:text-[#0b1f4b]"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full h-9 px-2.5 rounded-md border border-[#E2E8F0] text-xs text-[#0b1f4b]"
                />
                <div className="flex gap-1.5">
                  <select
                    value={leadCode}
                    onChange={(e) => setLeadCode(e.target.value)}
                    className="w-24 h-9 px-1.5 rounded-md border border-[#E2E8F0] text-xs text-[#0b1f4b]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="WhatsApp number"
                    className="flex-1 h-9 px-2.5 rounded-md border border-[#E2E8F0] text-xs text-[#0b1f4b]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={stagingBusy}
                  className="w-full py-2 rounded-md bg-[#2863e8] text-white text-xs font-bold hover:bg-[#1e50c4]"
                >
                  {stagingBusy ? 'Locking...' : 'Generate SBN Reference'}
                </button>
              </form>
            )}
          </div>

          {/* Direct WhatsApp Quick Handoff Strip */}
          <div className="px-3 py-2 bg-[#F4F7FC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-xs">
            <span className="text-[#475569]">Prefer direct live advisor?</span>
            <a
              href={buildWhatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#2863e8] hover:text-[#0b1f4b] inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Continue on WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E2E8F0] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Free Zones, visas, Wio Bank..."
              className="flex-1 h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs sm:text-sm text-[#0b1f4b] focus:outline-none focus:ring-2 focus:ring-[#2863e8]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-lg bg-[#2863e8] hover:bg-[#1e50c4] disabled:opacity-50 text-white flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
