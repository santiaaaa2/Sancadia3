import MatchFlow from '@/games/MatchFlow';
import SeegaGame from '@/games/seega/SeegaGame';

export default function SeegaMatch() {
  return <MatchFlow renderMatch={(config) => <SeegaGame config={config} />} />;
}
