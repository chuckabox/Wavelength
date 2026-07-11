import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { analyzeSession } from 'shared';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSession } from '@/session/SessionContext';
import { streamDebrief } from '@/api/debrief';
import { ingestFrames } from '@/api/frames';

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DebriefView() {
  const { sessionId, context, frames, nudges, transcript, reset, startSession, starting } =
    useSession();
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    async function run() {
      if (sessionId && frames.length > 0) {
        try {
          // best-effort flush leftover frames
          for (let i = 0; i < frames.length; i += 120) {
            await ingestFrames({
              sessionId,
              frames: frames.slice(i, i + 120),
            });
          }
        } catch (err) {
          console.warn('flush frames', err);
        }
      }

      try {
        await streamDebrief(
          {
            sessionId: sessionId ?? undefined,
            context: context.trim() || undefined,
            transcript: transcript.length ? transcript : undefined,
            frames: frames.length ? frames : undefined,
            tier: 'smart',
          },
          {
            onDelta: (chunk) => {
              if (!cancelled) setText((prev) => prev + chunk);
            },
            onDone: () => {
              if (!cancelled) {
                setDone(true);
                setStreaming(false);
              }
            },
            onError: (message) => {
              if (!cancelled) {
                setError(message);
                setStreaming(false);
              }
            },
          },
          ac.signal,
        );
        if (!cancelled) {
          setDone(true);
          setStreaming(false);
        }
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Debrief failed');
          setStreaming(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
      ac.abort();
    };
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analysis = useMemo(
    () => analyzeSession(frames, transcript),
    [frames, transcript],
  );


  const chartData = useMemo(
    () =>
      frames.map((f) => ({
        t: f.t,
        engagement: Math.round((f.engagement ?? 0) * 100),
        attention: Math.round((f.attention ?? 0) * 100),
      })),
    [frames],
  );

  const meanEng =
    frames.length === 0
      ? 0
      : frames.reduce((s, f) => s + (f.engagement ?? 0), 0) / frames.length;

  return (
    <section className="pb-24">
      <div className="mb-10">
        <h2 className="font-sans text-[28px] md:text-[32px] tracking-tight font-medium text-ink mb-2">
          Session debrief
        </h2>
        <p className="font-mono text-xs text-ink-3">
          Engagement over time with suggestion markers · AI summary streams from Claude on DigitalOcean Gradient
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-stretch mb-8">
        <div className="bg-white rounded-xl p-8 flex flex-col">
          <div className="mb-6">
            <h3 className="font-sans text-[20px] font-medium text-ink mb-1">Engagement over time</h3>
            <p className="text-[14px] text-ink-3">{chartData.length} frames recorded</p>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-ink-3">
                No frames recorded for this session.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-rule)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="t"
                    tickFormatter={formatTime}
                    stroke="var(--color-ink-3)"
                    fontSize={11}
                  />
                  <YAxis domain={[0, 100]} stroke="var(--color-ink-3)" fontSize={11} width={32} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'engagement']}
                    labelFormatter={(label) => formatTime(Number(label))}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="var(--color-accent)"
                    fill="var(--color-accent-soft)"
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                  {nudges.map((n) => (
                    <ReferenceLine
                      key={n.id}
                      x={n.t}
                      stroke="var(--color-ink-3)"
                      strokeDasharray="4 4"
                      label={{ value: 'suggestion', fill: 'var(--color-ink-3)', fontSize: 10 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 flex flex-col h-[450px] lg:h-auto">
          <h3 className="font-sans text-[20px] font-medium text-ink mb-4">Transcript</h3>
          {transcript.length > 0 ? (
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 pr-2">
              {transcript.map((turn, i) => (
                <div key={`${turn.t}-${i}`} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-ink-3 shrink-0 pt-0.5">
                    {formatTime(turn.t)}
                  </span>
                  <span className="text-[13px] leading-relaxed text-ink font-light">
                    <span className="font-medium capitalize text-ink-2 mr-2">
                      {turn.speaker}:
                    </span>
                    {turn.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-3">No transcript available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-xl p-8">
          <h3 className="font-sans text-[20px] font-medium text-ink mb-4">Stats</h3>
          <dl className="flex flex-col gap-6">
            <div>
              <dt className="text-ink-3 text-xs mb-1">Mean engagement</dt>
              <dd className="font-mono text-ink text-lg">{Math.round(meanEng * 100)}%</dd>
            </div>
            <div>
              <dt className="text-ink-3 text-xs mb-1">Frames</dt>
              <dd className="font-mono text-ink text-lg">{frames.length}</dd>
            </div>
            <div>
              <dt className="text-ink-3 text-xs mb-1">Friction</dt>
              <dd className="font-mono text-ink text-lg">{nudges.length}</dd>
            </div>
          </dl>
        </div>

        {analysis.moments.length > 0 && (
          <div className="bg-white rounded-xl p-8 md:col-span-1">
            <h3 className="font-sans text-[20px] font-medium text-ink mb-4">Moments</h3>
            <ul className="flex flex-col divide-y divide-rule max-h-[250px] overflow-y-auto pr-2">
              {analysis.moments.map((m: any, i: number) => (
                <li key={`${m.t}-${m.channel}-${i}`} className="py-3 flex gap-3 items-start first:pt-0 last:pb-0">
                  <span className="font-mono text-xs text-ink-3 shrink-0 w-9">
                    {formatTime(m.t)}
                  </span>
                  <span className="text-[13px] text-ink flex-1">
                    <span className="capitalize">{m.channel}</span>{' '}
                    {m.direction === 'rise' ? 'rose' : 'dropped'}{' '}
                    {Math.round(m.before * 100)}
                    {m.channel === 'valence' ? '' : '%'} →{' '}
                    {Math.round(m.after * 100)}
                    {m.channel === 'valence' ? '' : '%'}
                    {m.coText && (
                      <span className="text-ink-3 block mt-1">
                        &ldquo;{m.coText.length > 60 ? m.coText.slice(0, 59) + '…' : m.coText}&rdquo;
                      </span>
                    )}
                  </span>
                  <Badge variant={m.direction === 'fall' ? 'alert' : 'accent'} size="sm">
                    {m.direction}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {nudges.length > 0 && (
          <div className="bg-white rounded-xl p-8 md:col-span-1">
            <h3 className="font-sans text-[20px] font-medium text-ink mb-4">Suggestions</h3>
            <ul className="flex flex-col divide-y divide-rule max-h-[250px] overflow-y-auto pr-2">
              {nudges.map((n) => (
                <li key={n.id} className="py-3 flex gap-3 items-start first:pt-0 last:pb-0">
                  <span className="font-mono text-xs text-ink-3 shrink-0">{formatTime(n.t)}</span>
                  <span className="text-[13px] text-ink flex-1">{n.text}</span>
                  <Badge variant="accent" size="sm">
                    {n.confidence}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-8 mb-16 w-full">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-sans text-[20px] font-medium text-ink">AI debrief</h3>
          <Badge variant={streaming ? 'accent' : done ? 'positive' : 'alert'} size="sm">
            {streaming ? 'streaming' : done ? 'complete' : 'error'}
          </Badge>
        </div>
        <p className="font-mono text-[10px] tracking-[0.04em] text-ink-3 uppercase mb-4">
          Generated by Claude on DigitalOcean Gradient
        </p>
        <div className="min-h-[160px] border border-rule bg-paper p-4 text-[15px] leading-relaxed text-ink font-light whitespace-pre-wrap">
          {text || (streaming ? '…' : 'No debrief text.')}
          {streaming && <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse" />}
        </div>
        {error && (
          <p className="text-sm text-alert mt-3" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" onClick={reset}>
          Home
        </Button>
        <Button
          variant="primary"
          disabled={starting}
          onClick={() => void startSession()}
        >
          {starting ? 'Starting…' : 'New session'}
        </Button>
      </div>
    </section>
  );
}
