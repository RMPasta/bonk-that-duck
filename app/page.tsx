import dynamic from 'next/dynamic';

// Game uses localStorage on init — skip SSR to avoid hydration mismatch
const BonkGame = dynamic(() => import('@/components/BonkGame'), { ssr: false });

export default function Home() {
  return <BonkGame />;
}
