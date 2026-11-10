import MatchFlow from '@/games/MatchFlow';
import LatrunculiMatch from '@/games/latrunculi/LatrunculiMatch';

export default function LatrunculiGame() {
  return <MatchFlow renderMatch={(config) => <LatrunculiMatch config={config} />} />;
}
