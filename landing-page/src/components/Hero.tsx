import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Activity } from 'lucide-react'
import { HERO_IMAGE } from '../data/assets'
import './Hero.css'

export default function Hero({ isAppLoading }: { isAppLoading?: boolean }) {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <section className="hero" id="hero">
            <div className="hero-image-wrapper">
                <img src={HERO_IMAGE} alt="Hero Background" className="hero-image" />
            </div>
            <div className="hero-overlay"></div>

            <motion.div
                className="hero-content"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                {!scrolled && !isAppLoading ? (
                    <motion.div
                        layoutId="main-logo"
                        className="hero-monogram-container"
                        transition={{ type: "spring", stiffness: 70, damping: 24, mass: 1.2 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '36px' }}
                    >
                        <img src="/mash-logo.png" alt="M.A.S.H Logo" style={{ height: 'clamp(100px, 12vw, 140px)', width: 'auto' }} />
                    </motion.div>
                ) : (
                    <div className="hero-monogram-img" style={{ visibility: 'hidden', height: 'clamp(100px, 12vw, 140px)', marginBottom: '36px' }} />
                )}
                <span className="hero-unisex-badge" style={{ marginBottom: '28px' }}>Decentralized AI Orchestration</span>
                <h1 className="hero-brand-name" style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.4rem)', lineHeight: 1.25, letterSpacing: '0.12em', maxWidth: '820px', margin: '0 auto 24px' }}>Multi Agent System for Hospitals</h1>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '48px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: '600' }}>
                        Powered By
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <img src="/band-logo.png" alt="Band of Agents Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                        <img src="/fearthersless-logo .png" alt="Feathersless Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                </div>
            </motion.div>

        </section>
    )
}
