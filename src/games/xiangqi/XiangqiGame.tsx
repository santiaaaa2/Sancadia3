import MatchFlow from '@/games/MatchFlow';
import XiangqiMatch from '@/games/xiangqi/XiangqiMatch';

export default function XiangqiGame() {
  return <MatchFlow renderMatch={(config) => <XiangqiMatch config={config} />} />;
}
