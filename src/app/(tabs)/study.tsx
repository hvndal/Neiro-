import { ScreenStub } from '../../components/ScreenStub';
import { noiseById } from '../../theme/tokens';

// Step 5 builds the real timers. Wash = focus colour (default brown), paper text.
export default function Study() {
  const brown = noiseById('brown');
  return <ScreenStub title="study" note="focus timer arrives in step 5" bg={brown.hex} fg={brown.on} />;
}
