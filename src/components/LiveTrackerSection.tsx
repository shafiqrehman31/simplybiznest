import { Check, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { lookupOrderStatus } from '../lib/firestoreService';
import { ORDER_MILESTONES, OrderStatusRecord } from '../types';

interface LiveTrackerSectionProps {
  externalCode?: string | null;
}

export function LiveTrackerSection({ externalCode }: LiveTrackerSectionProps) {
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusRecord, setStatusRecord] = useState<OrderStatusRecord | null>(null);
  const [searchedCode, setSearchedCode] = useState('');

  const runLookup = async (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    setErrorMsg('');
    setSearchedCode(clean);

    if (!/^SBN-[A-Z0-9]{6,10}$/.test(clean)) {
      setStatusRecord(null);
      setErrorMsg('Enter a valid reference format such as SBN-ABC123.');
      return;
    }

    setLoading(true);
    try {
      const result = await lookupOrderStatus(clean);
      setStatusRecord(result);
      if (!result) {
        setErrorMsg(`No formation mandate found for ${clean}. Verify your reference code.`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to query tracker right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalCode) {
      setCodeInput(externalCode);
      runLookup(externalCode);
    }
  }, [externalCode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runLookup(codeInput);
  };

  return (
    <section id="tracker" className="py-16 sm:py-20 bg-white border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Explanatory & Search Column */}
          <div className="lg:col-span-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
              Real-Time Milestone Verification
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1f4b] mt-2">
              Live Application Progress Tracker
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
              Every locked quote generates an isolated tracking reference. Enter your{' '}
              <span className="font-mono font-semibold text-[#0b1f4b]">SBN-XXXXXX</span> code to
              inspect live incorporation progress without exposing personal contact records.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter SBN-XXXXXX"
                  maxLength={20}
                  aria-label="Tracking Reference Code"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E2E8F0] bg-[#F4F7FC] font-mono text-sm font-medium text-[#0b1f4b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2863e8]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-5 rounded-lg bg-[#0b1f4b] hover:bg-[#2863e8] disabled:opacity-60 text-white text-sm font-bold whitespace-nowrap shrink-0 transition-colors"
              >
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {errorMsg && (
              <p className="mt-3 text-xs font-medium text-[#0b1f4b] bg-[#F4F7FC] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Right 6-Milestone Architectural Card */}
          <div className="lg:col-span-7 bg-[#F4F7FC] border border-[#E2E8F0] rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  {statusRecord ? 'Active Mandate Reference' : '6-Stage Formation Pipeline'}
                </span>
                <p className="font-mono text-lg font-bold text-[#0b1f4b] mt-0.5 tabular-nums">
                  {statusRecord ? statusRecord.trackingCode : searchedCode || 'SBN-PREVIEW'}
                </p>
              </div>
              {statusRecord ? (
                <div className="text-left sm:text-right text-xs text-[#475569]">
                  <p className="font-bold text-[#0b1f4b]">
                    {statusRecord.jurisdiction} · {statusRecord.visaCount}{' '}
                    {statusRecord.visaCount === 1 ? 'Visa' : 'Visas'}
                  </p>
                  <p className="font-mono text-[#2863e8] font-bold mt-0.5 tabular-nums">
                    AED {statusRecord.estimatedAed.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#475569]">
                  Enter a tracking ID or lock a quote above to view live progress
                </p>
              )}
            </div>

            {/* 6-Step Milestone Stepper */}
            <ul className="mt-6 relative space-y-4">
              <span
                aria-hidden="true"
                className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-[#2863e8]/25"
              />
              {ORDER_MILESTONES.map((milestone, idx) => {
                const activeIndex = statusRecord ? statusRecord.milestoneIndex : -1;
                const isDone = statusRecord ? idx < activeIndex : false;
                const isCurrent = statusRecord ? idx === activeIndex : false;

                return (
                  <li key={milestone} className="relative pl-10 flex items-start justify-between gap-4">
                    <span
                      className={`absolute left-0 top-0.5 w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold border transition-colors ${
                        isDone
                          ? 'bg-[#2863e8] border-[#2863e8] text-white'
                          : isCurrent
                            ? 'bg-[#0b1f4b] border-[#0b1f4b] text-white'
                            : 'bg-white border-[#E2E8F0] text-[#475569]'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : `0${idx + 1}`}
                    </span>

                    <div className="flex-1 pb-3 border-b border-[#E2E8F0] last:border-b-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isDone || isCurrent ? 'text-[#0b1f4b]' : 'text-[#475569]'
                          }`}
                        >
                          {milestone}
                        </span>
                        <span className="text-xs font-medium text-[#475569]">
                          {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Scheduled'}
                        </span>
                      </div>
                      {isCurrent && statusRecord?.note && (
                        <p className="text-xs text-[#475569] mt-1">{statusRecord.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
