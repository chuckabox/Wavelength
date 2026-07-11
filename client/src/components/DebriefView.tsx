import { Button } from './ui/button';
import { useSession } from '@/session/SessionContext';

/** Minimal debrief shell — Phase 6 replaces with SSE + timeline. */
export default function DebriefView() {
  const { sessionId, context, frames, nudges, transcript, reset, setPhase } = useSession();

  return (
    <div className="pt-6 pb-16 flex flex-col gap-8 max-w-2xl">
      <div>
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink-3 mb-2">
          Debrief
        </p>
        <h1 className="text-[28px] font-medium tracking-tight text-ink mb-3">
          Session ended
        </h1>
        <p className="text-[15px] text-ink-2 leading-relaxed">
          Streaming AI debrief arrives in a later phase. Your session is saved on the
          server; frames and transcript are held in memory for the next step.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm border border-rule p-5 bg-paper-2">
        <div>
          <dt className="text-ink-3 text-xs mb-1">Session</dt>
          <dd className="font-mono text-[12px] break-all text-ink">{sessionId ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-ink-3 text-xs mb-1">Frames</dt>
          <dd className="text-ink">{frames.length}</dd>
        </div>
        <div>
          <dt className="text-ink-3 text-xs mb-1">Nudges</dt>
          <dd className="text-ink">{nudges.length}</dd>
        </div>
        <div>
          <dt className="text-ink-3 text-xs mb-1">Transcript turns</dt>
          <dd className="text-ink">{transcript.length}</dd>
        </div>
        {context.trim() && (
          <div className="col-span-2">
            <dt className="text-ink-3 text-xs mb-1">Context</dt>
            <dd className="text-ink">{context}</dd>
          </div>
        )}
      </dl>

      <div className="flex gap-3">
        <Button variant="primary" onClick={() => setPhase('consent')}>
          New session
        </Button>
        <Button variant="ghost" onClick={reset}>
          Home
        </Button>
      </div>
    </div>
  );
}
