import { motion, useReducedMotion } from 'framer-motion'
import { Button } from './ui/button'

interface LandingPageProps {
  onEnterApp: () => void
  starting?: boolean
  startError?: string | null
}

export default function LandingPage({ onEnterApp, starting = false, startError = null }: LandingPageProps) {
  const reduce = useReducedMotion()

  return (
    <div className="flex flex-col gap-24 md:gap-32 pt-16 pb-24 w-full">
      
      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-12 items-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start text-left"
        >
          <h1 className="font-sans text-[48px] md:text-[64px] tracking-tight leading-[1.05] font-medium text-ink mb-8 max-w-[12ch]">
            Understand the room.
          </h1>
          <p className="font-sans text-[18px] text-ink-2 leading-relaxed max-w-[45ch] mb-10">
            A consented social co-pilot that helps you read social cues during one-on-one conversations.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="rounded-full px-8 font-medium"
            disabled={starting}
            onClick={onEnterApp}
          >
            {starting ? 'Starting…' : 'Start Session'}
          </Button>
          {startError && (
            <p className="mt-3 text-sm text-alert" role="alert">
              {startError}
            </p>
          )}
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative w-full flex items-center justify-center lg:justify-end"
        >
          <img 
            src="/group-communicating.svg" 
            alt="Group of people communicating" 
            className="w-full max-w-[600px] h-auto object-contain scale-110 md:scale-125 origin-center"
          />
        </motion.div>
      </section>

      {/* Core Features */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {[
            {
              title: 'Live Nudges',
              desc: 'Gentle suggestions delivered privately in the moment when meaningful shifts occur.',
            },
            {
              title: 'The Debrief',
              desc: 'An annotated timeline and plain-language summary of the conversation afterward.',
            },
            {
              title: 'Privacy First',
              desc: 'Analyzed locally. Video and audio are never saved or transmitted to the cloud.',
            },
            {
              title: 'Mutual Consent',
              desc: 'Built as a two-way translator. Wavelength only operates when both sides agree.',
            }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-start text-left"
            >
              <h3 className="font-sans text-[18px] font-medium text-ink mb-3">{feature.title}</h3>
              <p className="font-sans text-[15px] text-ink-2 leading-relaxed max-w-[35ch]">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-rule pt-16">
        <motion.div 
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start text-left"
        >
          <h2 className="font-sans text-[24px] tracking-tight font-medium text-ink mb-4">
            A translator, not a lie detector.
          </h2>
          <p className="font-sans text-[15px] text-ink-2 leading-relaxed max-w-[55ch]">
            Wavelength does not judge inner states or fix people. It is built as an accommodation for neurodivergent individuals to help both sides of a conversation understand each other better.
          </p>
        </motion.div>
      </section>
    </div>
  )
}
