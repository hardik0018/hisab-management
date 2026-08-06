import type { Config } from "tailwindcss"

const config: Config = {
    // Light theme only — no dark mode toggle
    content: [
      './pages/**/*.{js,jsx,ts,tsx}',
      './components/**/*.{js,jsx,ts,tsx}',
      './app/**/*.{js,jsx,ts,tsx}',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
    prefix: "",
    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		fontFamily: {
    			sans: ['var(--font-jakarta)', 'Inter', 'sans-serif'],
    		},
    		colors: {
    			// ── Core tokens (wired to CSS variables) ──────────────────────
    			border: 'var(--border)',
    			input: 'var(--input)',
    			ring: 'var(--ring)',
    			background: 'var(--background)',
    			foreground: 'var(--foreground)',
    			surface: 'var(--surface)',
    			'surface-muted': 'var(--surface-muted)',
    			primary: {
    				DEFAULT: 'var(--primary)',
    				foreground: 'var(--primary-foreground)'
    			},
    			secondary: {
    				DEFAULT: 'var(--secondary)',
    				foreground: 'var(--secondary-foreground)'
    			},
    			destructive: {
    				DEFAULT: 'var(--destructive)',
    				foreground: 'var(--destructive-foreground)'
    			},
    			muted: {
    				DEFAULT: 'var(--muted)',
    				foreground: 'var(--muted-foreground)'
    			},
    			accent: {
    				DEFAULT: 'var(--accent)',
    				foreground: 'var(--accent-foreground)'
    			},
    			popover: {
    				DEFAULT: 'var(--card)',
    				foreground: 'var(--card-foreground)'
    			},
    			card: {
    				DEFAULT: 'var(--card)',
    				foreground: 'var(--card-foreground)'
    			},
    			// ── Semantic colours ──────────────────────────────────────────
    			success: {
    				DEFAULT: 'var(--success)',
    				foreground: 'var(--success-foreground)',
    				soft: 'var(--success-soft)',
    			},
    			danger: {
    				DEFAULT: 'var(--danger)',
    				foreground: 'var(--danger-foreground)',
    				soft: 'var(--danger-soft)',
    			},
    			warning: {
    				DEFAULT: 'var(--warning)',
    				foreground: 'var(--warning-foreground)',
    				soft: 'var(--warning-soft)',
    			},
    			// ── Pastel category accents ───────────────────────────────────
    			violet: {
    				DEFAULT: 'var(--violet)',
    				soft: 'var(--violet-soft)',
    			},
    			sky: {
    				DEFAULT: 'var(--sky)',
    				soft: 'var(--sky-soft)',
    			},
    			pink: {
    				DEFAULT: 'var(--pink)',
    				soft: 'var(--pink-soft)',
    			},
    			teal: {
    				DEFAULT: 'var(--teal)',
    				soft: 'var(--teal-soft)',
    			},
    			amber: {
    				DEFAULT: 'var(--amber)',
    				soft: 'var(--amber-soft)',
    			},
    			// ── Legacy chart tokens (kept for recharts) ───────────────────
    			chart: {
    				'1': 'var(--violet)',
    				'2': 'var(--sky)',
    				'3': 'var(--teal)',
    				'4': 'var(--amber)',
    				'5': 'var(--pink)',
    			},
    			sidebar: {
    				DEFAULT: 'var(--background)',
    				foreground: 'var(--foreground)',
    				primary: 'var(--primary)',
    				'primary-foreground': 'var(--primary-foreground)',
    				accent: 'var(--accent)',
    				'accent-foreground': 'var(--accent-foreground)',
    				border: 'var(--border)',
    				ring: 'var(--ring)',
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)',
    			xl: '1.5rem',
    			'2xl': '1.75rem',
    		},
    		boxShadow: {
    			card: 'var(--shadow-card)',
    			lift: 'var(--shadow-lift)',
    			glow: 'var(--shadow-glow)',
    		},
    		keyframes: {
    			'accordion-down': {
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			},
    			'slide-in-chip': {
    				from: { opacity: '0', transform: 'translateY(4px) scale(0.95)' },
    				to: { opacity: '1', transform: 'translateY(0) scale(1)' }
    			},
    			'fade-in': {
    				from: { opacity: '0' },
    				to: { opacity: '1' }
    			},
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'slide-in-chip': 'slide-in-chip 0.18s ease-out',
    			'fade-in': 'fade-in 0.2s ease-out',
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
}

export default config