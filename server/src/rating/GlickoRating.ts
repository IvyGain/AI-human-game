/**
 * Glicko-2レーティングシステムの実装
 * CLAUDE.mdの設計に基づくプレイヤー実力数値化システム
 */

interface GlickoPlayer {
  rating: number;      // μ
  deviation: number;   // φ
  volatility: number;  // σ
}

interface GameResult {
  opponent: GlickoPlayer;
  score: number; // 1.0 = 勝利, 0.5 = 引き分け, 0.0 = 敗北
}

export class GlickoRating {
  private readonly tau = 0.5; // システムの制約パラメータ
  private readonly epsilon = 0.000001; // 収束判定用

  /**
   * レーティングをGlicko-2スケールに変換
   */
  private toGlicko2Scale(rating: number, deviation: number): { mu: number; phi: number } {
    const mu = (rating - 1500) / 173.7178;
    const phi = deviation / 173.7178;
    return { mu, phi };
  }

  /**
   * Glicko-2スケールから通常のレーティングに変換
   */
  private fromGlicko2Scale(mu: number, phi: number): { rating: number; deviation: number } {
    const rating = mu * 173.7178 + 1500;
    const deviation = phi * 173.7178;
    return { rating, deviation };
  }

  /**
   * g関数の計算
   */
  private g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  /**
   * E関数の計算（期待スコア）
   */
  private E(mu: number, muOpponent: number, phiOpponent: number): number {
    return 1 / (1 + Math.exp(-this.g(phiOpponent) * (mu - muOpponent)));
  }

  /**
   * 推定分散の計算
   */
  private estimatedVariance(mu: number, results: Array<{ mu: number; phi: number; score: number }>): number {
    let sum = 0;
    for (const result of results) {
      const g = this.g(result.phi);
      const E = this.E(mu, result.mu, result.phi);
      sum += g * g * E * (1 - E);
    }
    return 1 / sum;
  }

  /**
   * 推定改善の計算
   */
  private estimatedImprovement(mu: number, results: Array<{ mu: number; phi: number; score: number }>): number {
    let sum = 0;
    for (const result of results) {
      const g = this.g(result.phi);
      const E = this.E(mu, result.mu, result.phi);
      sum += g * (result.score - E);
    }
    return sum;
  }

  /**
   * 新しいvolatilityの計算（イテレーション）
   */
  private calculateNewVolatility(
    sigma: number,
    phi: number,
    v: number,
    delta: number
  ): number {
    const a = Math.log(sigma * sigma);
    let A = a;
    let B: number;

    if (delta * delta > phi * phi + v) {
      B = Math.log(delta * delta - phi * phi - v);
    } else {
      let k = 1;
      while (this.f(a - k * this.tau, delta, phi, v, a) < 0) {
        k++;
      }
      B = a - k * this.tau;
    }

    let fA = this.f(A, delta, phi, v, a);
    let fB = this.f(B, delta, phi, v, a);

    while (Math.abs(B - A) > this.epsilon) {
      const C = A + ((A - B) * fA) / (fB - fA);
      const fC = this.f(C, delta, phi, v, a);

      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }

      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }

  /**
   * f関数（volatility計算用のヘルパー）
   */
  private f(x: number, delta: number, phi: number, v: number, a: number): number {
    const ex = Math.exp(x);
    const num1 = ex * (delta * delta - phi * phi - v - ex);
    const denom1 = 2 * Math.pow(phi * phi + v + ex, 2);
    const num2 = x - a;
    const denom2 = this.tau * this.tau;
    return num1 / denom1 - num2 / denom2;
  }

  /**
   * 単一プレイヤーのレーティングを更新
   */
  updateRating(player: GlickoPlayer, results: GameResult[]): GlickoPlayer {
    if (results.length === 0) {
      // ゲームをプレイしていない場合、deviationだけ増加
      const newDeviation = Math.sqrt(player.deviation * player.deviation + player.volatility * player.volatility);
      return {
        rating: player.rating,
        deviation: Math.min(newDeviation, 350), // 最大deviation
        volatility: player.volatility
      };
    }

    // Step 2: Glicko-2スケールに変換
    const { mu, phi } = this.toGlicko2Scale(player.rating, player.deviation);
    const sigma = player.volatility;

    // 対戦相手もGlicko-2スケールに変換
    const glicko2Results = results.map(result => {
      const { mu: opponentMu, phi: opponentPhi } = this.toGlicko2Scale(
        result.opponent.rating,
        result.opponent.deviation
      );
      return {
        mu: opponentMu,
        phi: opponentPhi,
        score: result.score
      };
    });

    // Step 3: 推定分散v の計算
    const v = this.estimatedVariance(mu, glicko2Results);

    // Step 4: 推定改善Δの計算
    const delta = v * this.estimatedImprovement(mu, glicko2Results);

    // Step 5: 新しいvolatility σ'の計算
    const newSigma = this.calculateNewVolatility(sigma, phi, v, delta);

    // Step 6: 新しいrating deviationの計算
    const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);

    // Step 7: 新しいrating φ'とμ'の計算
    const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const newMu = mu + newPhi * newPhi * this.estimatedImprovement(mu, glicko2Results);

    // Step 8: 通常のスケールに戻す
    const { rating: newRating, deviation: newDeviation } = this.fromGlicko2Scale(newMu, newPhi);

    return {
      rating: newRating,
      deviation: newDeviation,
      volatility: newSigma
    };
  }

  /**
   * マルチプレイヤーゲームのレーティング更新
   * 各プレイヤーは他の全プレイヤーとの対戦結果を持つ
   */
  updateMultiplayerRatings(
    players: GlickoPlayer[],
    gameResults: number[] // 各プレイヤーの順位（1位=0, 2位=1, ...）
  ): GlickoPlayer[] {
    const updatedPlayers: GlickoPlayer[] = [];

    for (let i = 0; i < players.length; i++) {
      const currentPlayer = players[i];
      const currentRank = gameResults[i];
      const results: GameResult[] = [];

      // 他の全プレイヤーとの対戦結果を計算
      for (let j = 0; j < players.length; j++) {
        if (i !== j) {
          const opponentRank = gameResults[j];
          let score: number;

          if (currentRank < opponentRank) {
            score = 1.0; // 勝利
          } else if (currentRank > opponentRank) {
            score = 0.0; // 敗北
          } else {
            score = 0.5; // 同順位
          }

          results.push({
            opponent: players[j],
            score
          });
        }
      }

      updatedPlayers.push(this.updateRating(currentPlayer, results));
    }

    return updatedPlayers;
  }

  /**
   * 勝利確率の計算
   */
  calculateWinProbability(player1: GlickoPlayer, player2: GlickoPlayer): number {
    const { mu: mu1, phi: phi1 } = this.toGlicko2Scale(player1.rating, player1.deviation);
    const { mu: mu2, phi: phi2 } = this.toGlicko2Scale(player2.rating, player2.deviation);
    
    const g = this.g(Math.sqrt(phi1 * phi1 + phi2 * phi2));
    return 1 / (1 + Math.exp(-g * (mu1 - mu2)));
  }

  /**
   * マッチング品質の計算（レーティング差が小さいほど良い）
   */
  calculateMatchQuality(players: GlickoPlayer[]): number {
    if (players.length < 2) return 0;

    let totalVariance = 0;
    let totalPairs = 0;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const ratingDiff = Math.abs(players[i].rating - players[j].rating);
        totalVariance += ratingDiff * ratingDiff;
        totalPairs++;
      }
    }

    const avgVariance = totalVariance / totalPairs;
    
    // 0-1の品質スコア（1が最高品質）
    return Math.max(0, 1 - avgVariance / (400 * 400));
  }

  /**
   * プレイヤーのランク計算
   */
  calculateRank(rating: number): string {
    if (rating >= 2400) return 'グランドマスター';
    if (rating >= 2200) return 'マスター';
    if (rating >= 2000) return 'エキスパート';
    if (rating >= 1800) return 'アドバンス';
    if (rating >= 1600) return 'インターミディエイト';
    if (rating >= 1400) return 'ビギナー';
    return 'ノービス';
  }
}