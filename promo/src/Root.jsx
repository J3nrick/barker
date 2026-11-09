import { Composition } from 'remotion'
import { DURATION, FPS, Promo } from './Promo.jsx'

// One promo, two shapes: 9:16 for Reels/TikTok/Shorts and 16:9 for YouTube and the README.
export const Root = () => (
  <>
    <Composition id="Promo916" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="Promo169" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
  </>
)
