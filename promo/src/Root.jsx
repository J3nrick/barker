import { Composition } from 'remotion'
import { DURATION, FPS, Promo } from './Promo.jsx'
import { EXPLAINER_DURATION, Explainer } from './Explainer.jsx'

// One promo, two shapes: 9:16 for Reels/TikTok/Shorts and 16:9 for YouTube and the README.
export const Root = () => (
  <>
    <Composition id="Promo916" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="Promo169" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    {/* Metro Manila only: the Manila sample cut. */}
    <Composition
      id="Manila916"
      component={Promo}
      defaultProps={{ area: 'manila' }}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Manila169"
      component={Promo}
      defaultProps={{ area: 'manila' }}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* The clear explainer: Metro Manila only, no link. */}
    <Composition id="Explainer916" component={Explainer} durationInFrames={EXPLAINER_DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="Explainer169" component={Explainer} durationInFrames={EXPLAINER_DURATION} fps={FPS} width={1920} height={1080} />
  </>
)
