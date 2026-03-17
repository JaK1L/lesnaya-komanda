import type { TournamentBracketData } from './types'

export const demoBracketData: TournamentBracketData = {
  id: 'demo-bracket',
  title: 'Lesnaya Rubka',
  format: 'single-elimination',
  sections: [
    {
      id: 'winners',
      title: 'Основная сетка',
      kind: 'winners',
      rounds: [
        {
          id: 'round-1',
          title: 'Раунд 1',
          round: 1,
          matches: [
            {
              id: 'm1',
              round: 1,
              position: 1,
              status: 'finished',
              matchFormat: 'BO1',
              startTime: '2026-03-17T12:00:00Z',
              winnerName: 'Papochka',
              participants: [
                { name: 'Papochka', score: 2, isWinner: true },
                { name: 'orgeo', score: 1 },
              ],
            },
            {
              id: 'm2',
              round: 1,
              position: 2,
              status: 'live',
              matchFormat: 'BO3',
              startTime: '2026-03-17T14:00:00Z',
              participants: [
                { name: '.agerra999', score: 1 },
                { name: 'TBD', isTBD: true },
              ],
            },
          ],
        },
        {
          id: 'round-2',
          title: 'Финал',
          round: 2,
          matches: [
            {
              id: 'm3',
              round: 2,
              position: 1,
              status: 'upcoming',
              matchFormat: 'BO5',
              startTime: '2026-03-18T10:00:00Z',
              participants: [
                { name: 'Papochka' },
                { name: 'TBD', isTBD: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
