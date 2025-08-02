import { Player } from '@project-jin/shared';

interface ChatFilterProps {
  players: Player[];
  selectedPlayer: string | null;
  onFilterChange: (playerId: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function ChatFilter({ 
  players, 
  selectedPlayer, 
  onFilterChange, 
  searchTerm, 
  onSearchChange 
}: ChatFilterProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-3">
        {/* 検索フィールド */}
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="メッセージを検索..."
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400"
          />
        </div>

        {/* プレイヤーフィルター */}
        <select
          value={selectedPlayer || ''}
          onChange={(e) => onFilterChange(e.target.value || null)}
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm text-white"
        >
          <option value="">全員</option>
          <optgroup label="生存者">
            {players
              .filter(p => p.status === 'alive')
              .map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} {player.isBot ? '(AI)' : ''}
                </option>
              ))}
          </optgroup>
          <optgroup label="死亡者">
            {players
              .filter(p => p.status === 'dead')
              .map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} {player.isBot ? '(AI)' : ''}
                </option>
              ))}
          </optgroup>
        </select>

        {/* フィルタークリア */}
        {(searchTerm || selectedPlayer) && (
          <button
            onClick={() => {
              onSearchChange('');
              onFilterChange(null);
            }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white transition"
          >
            クリア
          </button>
        )}
      </div>

      {/* アクティブフィルター表示 */}
      {(searchTerm || selectedPlayer) && (
        <div className="mt-2 text-xs text-gray-400">
          フィルター: 
          {searchTerm && <span className="ml-1">「{searchTerm}」</span>}
          {selectedPlayer && (
            <span className="ml-1">
              {players.find(p => p.id === selectedPlayer)?.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}