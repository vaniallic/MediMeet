import { Link } from 'react-router-dom'
import { Logo } from '../components/ui'

export default function Landing() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-6 pt-page-top pb-page-bottom">
      <Logo />
      <div className="relative -mx-7 mt-2 flex-1">
        <img
          src="/img/hero-landing.png"
          alt="A doctor checking a patient's blood pressure"
          className="float mx-auto w-full max-w-[360px] object-contain"
        />
      </div>
      <h1 className="mt-2 font-display text-[32px] leading-[1.05] font-extrabold text-brand [text-shadow:0_4px_4px_rgba(0,0,0,0.18)]">
        Your health, one tap away
      </h1>
      <p className="mt-4 max-w-[280px] font-mont text-[15px] leading-relaxed font-light tracking-wide text-ink">
        Your health, simplified — anytime, anywhere.
      </p>
      <Link to="/home" className="btn-primary mt-8 h-12">
        Get Started
      </Link>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
        {' · '}
        <Link to="/signup" className="font-semibold text-brand hover:underline">
          Sign up
        </Link>
      </p>
      <Link to="/emergency" className="mt-4 text-center text-sm font-medium text-coral hover:underline">
        Emergency? Call 112
      </Link>
    </div>
  )
}
