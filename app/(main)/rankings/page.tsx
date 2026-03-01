import { getRankings } from '@/lib/db/index';
import RankingsClient from '@/components/RankingsClient';

export const revalidate = 120;

export default async function RankingsPage() {
  const { hot, liked, newest, byDecade, config } = await getRankings();

  return (
    <RankingsClient
      hot={{   ...hot,   icon: '🔥', color: 'rgb(239,68,68)' }}
      liked={{  ...liked,  icon: '❤️', color: 'rgb(236,72,153)' }}
      newest={{ ...newest, icon: '✨', color: 'rgb(34,197,94)' }}
      byDecade={byDecade as Record<string, any[]>}
      decadeLimit={config.byDecade.limitPerDecade}
      decadeEnabled={config.byDecade.enabled}
    />
  );
}
