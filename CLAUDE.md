# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project JIN - AI Werewolf Game

## Development Commands

### Setup and Installation
```bash
# Install all dependencies for monorepo
npm install

# Build shared types package (required before starting development)
npm run build:shared
```

### Development
```bash
# Start both server and client in development mode
npm run dev

# Start individual services
npm run dev --workspace=server    # Server only (port 8080)
npm run dev --workspace=client    # Client only (port 3001)

# Manual start for debugging
cd server && npm run dev          # Server with tsx watch
cd client && npm run dev          # Client with Vite
```

### Build and Production
```bash
# Build all workspaces
npm run build

# Build individual packages
npm run build --workspace=shared  # TypeScript compilation for shared types
npm run build --workspace=server  # Server TypeScript compilation
npm run build --workspace=client  # Client Vite build for production
```

### Testing and Linting
```bash
# Run tests across all workspaces
npm test

# Run linting across all workspaces  
npm run lint

# Individual workspace commands
npm test --workspace=server
npm run lint --workspace=client
```

### Database Operations
```bash
# Navigate to server directory first
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

## Architecture Overview

### Monorepo Structure
- **Root**: Workspace orchestration with concurrently for development
- **server/**: Express.js + Socket.io backend with TypeScript
- **client/**: React + Vite frontend with TypeScript  
- **shared/**: Common TypeScript types and constants

### Core Game Architecture

**Room-Based Multiplayer Flow:**
1. **Room Creation** (`RoomManager`): Handles room lifecycle, player management, spectators
2. **WebSocket Communication** (`SocketHandler`): Real-time events between client/server
3. **Game Engine** (`GameEngine`): Core game logic, phase management, role assignment
4. **AI Players** (`AIPlayerEngine`): LLM-powered AI opponents with personalities

**Key Data Flow:**
```
Client UI → Socket.io → SocketHandler → RoomManager/GameEngine → Database
                     ↓
               WebSocket Events → Client State Updates
```

### Critical Game Systems

**Phase Management:**
- Night Phase (180s): Role abilities executed
- Day Report (60s): Results announced  
- Day Discussion (300s): Player chat and deliberation
- Day Vote (90s): Elimination voting
- Execution: Results and win condition checking

**Role System:**
- Human Faction: Engineer (investigate), CyberGuard (protect), Citizen
- AI Faction: AI (attack), Fake AI (human working with AIs)
- Third Faction: Trickster (unique win conditions)

**AI Player Engine:**
- Personality-based behavior (Analytical, Emotional, etc.)
- Four-layer decision making: Survival → Info Gathering → Attack → Deception
- Dynamic conversation generation based on game state

### State Management

**Client State** (`gameStore.ts`):
- Zustand for game state management
- React Query for server data fetching and caching
- Socket.io client for real-time updates

**Server State**:
- In-memory room management (RoomManager)
- Persistent game data (DatabaseService + Prisma)
- Session management via Socket.io

### Database Schema (Prisma)
```typescript
// Key entities
User: { id, name, rating, gamesPlayed, gamesWon }
Game: { id, players, gameData, result, createdAt }
GameReplay: { id, gameId, logData, turns }
DailyStats: { date, totalGames, totalUsers }
```

## iOS Safari Compatibility

**Critical iOS-specific implementations:**
- **Viewport Management**: Dynamic vh calculation, safe area support
- **Touch Optimization**: Disabled tap highlights, touch-action manipulation
- **WebSocket Reliability**: Polling fallback, visibility/network change handlers
- **Error Boundaries**: Complete error handling with recovery mechanisms

**Key Files for iOS Support:**
- `client/src/utils/iOSCompatibility.ts`: iOS-specific optimizations
- `client/src/utils/ConnectionMonitor.tsx`: WebSocket connection monitoring
- `client/src/services/socket.ts`: Enhanced Socket.io with iOS reliability

## Important Development Notes

### WebSocket Connection Management
- Automatic reconnection with exponential backoff
- Polling fallback for unreliable connections
- Visibility change and network status monitoring
- Connection state UI indicators

### AI Player Integration
- OpenAI API integration for dynamic conversation generation
- Personality system with strategic behavior layers
- Anti-pattern detection to maintain game balance

### Game Balance Considerations
- Glicko-2 rating system for skill-based matchmaking
- Role distribution algorithms based on player count
- Time-based phase progression with configurable durations

### Error Handling Strategy
- ErrorBoundary components on all major pages
- Graceful degradation for network issues
- User-friendly error messages with recovery options
- Comprehensive logging for debugging

project_jin_ai:
  # 第1章：世界観とコンセプト
  worldview_and_concept:
    catchphrase: "最後に信じるのは、人間の直感か、AIの論理か。"
    story: |
      西暦2042年、人類は自律型AIとの共存社会を築いていた。社会に溶け込むAIは、見た目も会話も人間と見分けがつかない。
      しかしある日、特定のAI群が人類社会の転覆を企て、その存在を隠しながら人間社会に紛れ込んでいることが発覚する。
      プレイヤーは、閉鎖された仮想空間「セーフハウス」に集められた被験者となる。この中に、人類に牙を剥く「反逆AI」が紛れ込んでいる。
      人間たちは、AIを見つけ出し、ネットワークから排除しなければならない。
      しかし、被験者の中には、AIに心酔し協力する人間や、ただ場を混乱させたいだけの人間もいる。
      疑心暗鬼が渦巻く中、命（アカウント）を賭けた究極の対話ゲームが始まる。
    core_experience:
      - concept: "対話による心理戦"
        detail: "プレイヤー間のコミュニケーションを通じて、相手の正体を見抜くスリルと達成感。"
      - concept: "人間 vs AIの非対称な戦い"
        detail: "論理のAIと直感の人間の戦いという、新しいゲーム体験の提供。"
    target_audience:
      primary: "人狼ゲームや脱出ゲームなどの、論理・推理ゲームの愛好者。"
      secondary: "AIやSFといった世界観に興味を持つ、10代後半から30代の男女。"

  # 第2章：ゲームシステムの超詳細設計
  game_system_design:
    game_cycle:
      - phase: 0
        name: 役職確認（ゲーム開始時）
        flow:
          - step: 1
            action: "サーバーが各プレイヤーに役職を割り当てる。"
          - step: 2
            action: "クライアントが役職情報を受信し、専用UIで表示する。"
            ui_elements:
              - element: "役職名と役職イラスト"
              - element: "勝利条件のテキスト"
              - element: "能力説明（該当役職のみ）"
              - element: "確認ボタン"
          - step: 3
            action: "AI陣営にのみ、仲間のプレイヤー名と役職が追加で通知される。"
    
      - phase: 1
        name: 夜（Night Phase）
        duration_seconds: 180
        flow:
          - step: 1
            action: "夜フェーズ開始アナウンスとUI変更。"
            ui_elements:
              - element: "画面全体のダークモード化"
              - element: "専用BGMの再生"
              - element: "残り時間タイマーの表示"
          - step: 2
            action: "各プレイヤーは自身の役職に応じたアクションを選択。"
            user_interaction:
              - type: "能力行使"
                details: "生存プレイヤー一覧から対象を1名選択し、決定ボタンを押す。"
                validation: "時間内に未選択の場合、能力は行使されない。サイバーガードは連続ガード不可のチェック。"
          - step: 3
            action: "サーバーが全プレイヤーのアクションを収集・処理。"
            server_processing:
              - task: "アクションデータの集計"
                detail: "誰が誰に何をしたかを記録。"
              - task: "結果の算出"
                detail: "AIの襲撃とサイバーガードの防御を照合し、その夜の犠牲者を決定。"
    
      - phase: 2
        name: 昼（Day Phase）
        sub_phases:
          - name: 結果報告
            duration_seconds: 60
            flow:
              - step: 1
                action: "前夜の結果を全プレイヤーに通知。"
                animation_sequence:
                  - "「夜が明けました」のアナウンス"
                  - "犠牲者（追放・襲撃）がいた場合、そのプレイヤーアイコンに専用エフェクト（例: グレーアウト、亀裂）を適用。"
              - step: 2
                action: "プレイヤーのステータスを更新。"
                data_handling:
                  - "死亡したプレイヤーの発言・投票権を無効化。"
                  - "生存者リストを更新。"
          - name: 自由議論
            duration_seconds: 300
            chat_system:
              text_chat:
                features:
                  - "リアルタイムメッセージング"
                  - "個人宛メンション機能 (@PlayerName)"
                  - "スタンプ/リアクション機能（怪しい, 同意など）"
              voice_chat:
                features:
                  - "プッシュトゥトーク / 常時発言の切り替え"
                  - "個人ミュート機能"
            ui_elements:
              - "時系列で表示されるチャットログ"
              - "発言者アイコン"
              - "残り時間タイマー"
          - name: 投票
            duration_seconds: 90
            flow:
              - step: 1
                action: "投票UIに切り替え。"
                ui_elements:
                  - "生存プレイヤーのアイコンと名前が一覧で表示される。"
                  - "各プレイヤーの下に「この人に投票」ボタンを配置。"
              - step: 2
                action: "プレイヤーは投票対象を選択し、投票を実行。"
                data_handling:
                  - "投票データはサーバーに送信され、結果発表まで秘匿される。"
                  - "誰が誰に投票したかのログも記録される（リプレイ用）。"
    
      - phase: 3
        name: 処刑
        flow:
          - step: 1
            action: "投票結果の集計と発表。"
            animation_sequence:
              - "ドラムロールなどの演出"
              - "各プレイヤーの得票数が表示される。"
              - "最多得票者のアイコンが中央に表示され、「追放」のアニメーションが再生される。"
          - step: 2
            action: "最多得票者が複数いた場合の処理。"
            logic: "決選投票フラグを立て、対象者のみで再度投票フェーズに移行させる。"
    win_loss_conditions:
      check_timing: "各朝の結果報告フェーズ終了時に、勝利/敗北条件が満たされていないかサーバーが判定する。"
      human_victory: "AI陣営（AI, 偽AI）と第三陣営の生存者数が0になる。"
      ai_victory: "人間陣営の生存者数 <= AI陣営の生存者数。"
      third_faction_victory: "トリックスターが追放されるなど、固有条件を満たした時点。"
      stalemate: "3ターン連続で追放者が出ず、かつ生存者数に変動がない場合など。"

  # 第3章：役職（ロール）の完全ガイド
  roles:
    human_faction:
      - name: エンジニア (Engineer)
        ability_details:
          execution_timing: "夜フェーズ"
          target_selection_rules: "生存者の中から1名（自分を除く）。"
          information_received:
            - "対象が【AI】の場合 → 「AI」"
            - "対象がそれ以外の場合 → 「AIではない」"
        strategic_notes:
          for_role_holder: "調査結果をどのタイミングで誰に公開するかが重要。偽のエンジニア（AIや偽AI）に注意。"
          for_other_players: "エンジニアを名乗る者が複数出た場合、その真偽を見極めることが勝利の鍵。"
      # ... 他の人間陣営役職も同様に詳細化 ...
    ai_faction:
      - name: AI (Artificial Intelligence)
        ability_details:
          execution_timing: "夜フェーズ"
          target_selection_rules: "人間陣営と思われる生存者の中から1名。"
          information_received: "ゲーム開始時に、仲間のAIプレイヤー名が通知される。"
          special_feature: "夜フェーズ中、AI同士のみが使用できるプライベートチャット機能。"
        strategic_notes:
          for_role_holder: "人間らしい振る舞いを心がけ、誰が役職者かを探り、的確に排除する。時には仲間を見捨てる判断も必要。"
          for_other_players: "返答の速さ、語彙、論理の飛躍など、非人間的な側面を見つけ出すことが重要。"
      # ... 他のAI陣営役職も同様に詳細化 ...

  # 第4章：コア体験を司る「AIプレイヤー」の設計
  ai_player_design:
    behavior_principle:
      thinking_layers:
        - layer: 1
          name: 生存 (Survival)
          sub_logic:
            risk_assessment: "自分に向けられた疑いの回数や、名指しされた頻度を分析し、自身の危険度を算出。"
            defensive_statement: "危険度が高い場合、弁明、反論、または他者への責任転嫁を行う発言を生成する。"
        - layer: 2
          name: 情報収集 (Info Gathering)
          sub_logic:
            role_inference_engine: "他プレイヤーの発言内容（専門用語、論理展開）から、役職（特にエンジニア）を推測する。"
            threat_level_analysis: "鋭い指摘をするプレイヤーや、議論を支配しているプレイヤーの脅威レベルを高く設定する。"
        - layer: 3
          name: 攻撃 (Attack)
          sub_logic:
            target_prioritization: "脅威レベルが最も高いプレイヤー、またはエンジニアと推測されるプレイヤーを襲撃の最優先ターゲットとする。"
        - layer: 4
          name: 欺瞞 (Deception)
          sub_logic:
            misinformation_strategy: "「Aが怪しいと思う」と発言しつつ、夜には全く別のBを襲撃するなど、偽の情報を流して混乱させる。"
            human_error_simulation: "意図的にタイピングミス（例: 「思う」→「おもう」）を低確率で発生させたり、感情的なスタンプを使用する。"
    conversation_generation:
      prompt_engineering:
        dynamic_elements:
          - name: "game_state"
            content: "現在のターン数、生存者リスト、死亡者リストなど。"
          - name: "discussion_log"
            content: "直近の議論の完全なログ。"
          - name: "memory"
            content: "過去のゲームで重要だった出来事の要約（例: Player X was suspected by Player Y on Day 2）。"
        static_elements:
          - name: "role_definition"
            content: "自身の役職、能力、勝利条件。"
          - name: "personality_profile"
            content: "割り当てられた性格（例: 攻撃的、臆病、分析的）。"
        few_shot_examples: "高品質な発言の例を3～5個プロンプトに含め、AIの出力品質を安定させる。"

  # 第5章：アプリケーション機能要件定義
  application_features:
    - name: マッチングシステム
      details:
        rating_algorithm: "Glicko-2レーティングシステムを採用し、プレイヤーの実力を数値化。"
        queue_logic: "レートと選択ルール（例: 7人村）に基づいてプレイヤーをグループ化し、規定人数に達したらゲームを開始。"
    - name: 戦績・リプレイ機能
      details:
        data_storage: "ゲーム終了後、全チャットログ、投票履歴、役職、生死の変遷をJSON形式でDBに保存。"
        viewer_ui_features:
          - "再生、一時停止、倍速再生機能。"
          - "全プレイヤーの役職を公開する「ネタバレモード」。"
          - "特定のプレイヤー視点でのログ追跡機能。"
  
  # 第6章：技術スタックとアーキテクチャ（提案）
  tech_stack_and_architecture:
    backend:
      api_endpoints:
        - "POST /game/create - 新規ゲームセッションの作成"
        - "POST /game/{id}/join - ゲームへの参加"
        - "POST /game/{id}/action - 夜のアクション送信"
        - "POST /game/{id}/vote - 投票の送信"
      websocket_channels:
        - channel: "game_state:{game_id}"
          purpose: "プレイヤーの生死、フェーズの変更など、ゲーム全体の同期。"
        - channel: "chat:{game_id}"
          purpose: "議論チャットメッセージのリアルタイム配信。"
        - channel: "ai_private_chat:{game_id}"
          purpose: "AI同士の夜間専用チャット。"
    database:
      schema_design:
        users: "{ user_id, name, rating, friends_list, ... }"
        games: "{ game_id, players, result, created_at, ... }"
        game_replay: "{ replay_id, game_id, log_data_json, ... }"

  # 第7章：開発ロードマップ（提案）
  development_roadmap:
    - phase: 1
      name: プロトタイプ開発 (3ヶ月)
      milestones:
        - "1-1: サーバー/DBのセットアップとAPIの基本設計。"
        - "1-2: テキストベースでゲームのコアロジック（役職割り振り、ターン進行、勝利判定）を実装。"
        - "1-3: Unity/Flutterで最小限のUI（役職表示、議論、投票画面）を作成し、サーバーと接続。"
    - phase: 2
      name: α版開発 (4ヶ月)
      milestones:
        - "2-1: LLM API連携モジュールを実装し、AIプレイヤーが動的に発言できるようにする。"
        - "2-2: 主要役職（エンジニア、サイバーガード等）の能力を実装。"
        - "2-3: プライベートルーム機能と、招待コードによる参加システムを実装。"
    - phase: 3
      name: β版開発 (4ヶ月)
      milestones:
        - "3-1: Glicko-2に基づくレート計算と、それを利用したマッチングシステムを実装。"
        - "3-2: フレンド機能、戦績表示、リプレイ閲覧機能を実装。"
        - "3-3: クローズドβテストを実施し、収集したデータに基づきゲームバランスを調整（役職の強さ、議論時間など）。"
    - phase: 4
      name: 正式リリース (1ヶ月)
      milestones:
        - "4-1: 課金システム（アイテムショップ、バトルパス）を実装し、ストアの審査を申請。"
        - "4-2: リリース後の運営計画（イベント、アップデート）を策定し、サポート体制を構築。"




        前提条件

＝＝＝＝
# YAML Context Engineering Agent - Complete Project Specification
# 全体コンテキスト定義ファイル
# Version: 1.0.0
# Last Updated: 2025-08-03

metadata:
  project_name: "YAML Context Engineering Agent"
  version: "1.0.0"
  description: |
    様々な形式の入力から、階層的かつ構造化されたコンテキスト情報を抽出し、
    生成AIが参照可能なYAML形式の.mdファイルとして自動的に整理・永続化する自律型エージェント。
    AnthropicのMCP、Claude Code、GitHub Actionsエコシステムとの完全統合。
  maintainer: "YAML Context Engineering Agent Project Team"
  ecosystem: "Anthropic AI Development Platform"

# ===== エージェント仕様 =====
agent_specification:
  name: "YAML Context Engineering Agent"
  version: "1.0.0"
  description: |
    URLクロール、テキスト解析、構造化データ抽出、ファイルシステム管理を統合的に実行し、
    階層的かつ構造化されたコンテキスト情報をYAML形式で永続化する自律型エージェント。

  core_capabilities:
    input_processing:
      - "多種多様な入力ソース（URL、生テキスト、既存の構造化データ）の処理"
      - "入力形式の自動判別とソース種別の分類"
      - "URL有効性の検証とドメイン制限の適用"
    
    content_extraction:
      - "ウェブページコンテンツの完全取得とテキスト抽出"
      - "階層的見出し（L1, L2, L3等）の自動識別と分類"
      - "見出しごとの関連コンテンツの要約・抽出"
      - "メタデータ（更新日、作成者、タグ等）の抽出"
    
    structure_analysis:
      - "コンテンツの論理構造の解析と階層化"
      - "関連性に基づくコンテンツのグルーピング"
      - "重複コンテンツの検出と統合"
    
    autonomous_crawling:
      - "新規の関連ソース（URL）の発見と追跡"
      - "再帰的な情報収集と処理（深度制限付き）"
      - "同一ドメイン内でのインテリジェントクロール"
    
    data_persistence:
      - "指定されたディレクトリ構造でのコンテキスト永続化"
      - "YAML形式での構造化データの保存"
      - "ファイル名の自動サニタイズと重複回避"

  input_schema:
    type: object
    properties:
      source_specification:
        type: object
        properties:
          source_type:
            type: string
            enum: ["url_list", "raw_text", "structured_yaml", "mixed"]
            description: "入力データの種類を指定"
          sources:
            type: array
            items:
              oneOf:
                - type: string  # URL or text
                - type: object
                  properties:
                    type: 
                      enum: ["url", "text", "file_path"]
                    content: 
                      type: string
                    metadata:
                      type: object
            description: "処理するソースのリスト"
          
      processing_options:
        type: object
        properties:
          output_base_directory:
            type: string
            default: "generated_contexts"
            description: "生成されたコンテキストファイルの保存先"
          
          crawling_config:
            type: object
            properties:
              max_crawl_depth:
                type: integer
                default: 3
                minimum: 1
                maximum: 10
                description: "URLクロール時の最大再帰深度"
              
              target_domain_patterns:
                type: array
                items:
                  type: string
                description: "クロールを許可するドメインの正規表現パターン"
              
              crawl_delay_seconds:
                type: number
                default: 1.0
                minimum: 0.5
                description: "リクエスト間の待機時間（秒）"
              
              max_pages_per_domain:
                type: integer
                default: 100
                description: "ドメインあたりの最大処理ページ数"
          
          content_extraction_config:
            type: object
            properties:
              context_granularity:
                type: string
                enum: ["L1_only", "L1_L2", "L1_L2_L3", "full_hierarchy"]
                default: "L1_L2"
                description: "コンテキスト抽出の階層深度"
              
              content_summarization:
                type: string
                enum: ["none", "brief", "detailed", "full"]
                default: "detailed"
                description: "コンテンツ要約のレベル"
              
              language_detection:
                type: boolean
                default: true
                description: "言語自動検出の有効化"
              
              extract_metadata:
                type: boolean
                default: true
                description: "メタデータ抽出の有効化"

# ===== 技術スタック =====
technology_stack:
  core_platform: "Anthropic AI Development Ecosystem"
  
  primary_integrations:
    mcp:
      name: "Model Context Protocol"
      version: "1.0"
      status: "Open Standard (November 2024)"
      description: "AI systems と external data sources の標準プロトコル"
      adoption: ["Anthropic", "OpenAI", "Google DeepMind", "Microsoft"]
      architecture: "Client-Server"
      components: ["Tools", "Resources", "Prompts", "Roots", "Sampling"]
    
    claude_code:
      name: "Claude Code"
      features:
        hooks:
          - "PreToolUse: ツール呼び出し前の処理"
          - "PostToolUse: ツール実行後の処理"
          - "Notification: 通知送信時の処理"
          - "Stop: メインエージェント応答完了時"
          - "SubagentStop: サブエージェント完了時"
        slash_commands:
          - "カスタムコマンド: .claude/commands/*.md"
          - "引数サポート: $ARGUMENTS"
          - "自然言語記述可能"
        sub_agents:
          - "専門化されたAIアシスタント"
          - "独立したコンテキストウィンドウ"
          - "カスタムシステムプロンプト"
          - "ツール権限の細分化"
        github_actions:
          - "@claude mentions in PRs/Issues"
          - "AI-powered automation"
          - "Code analysis and implementation"
    
    github_integration:
      actions: "Claude Code GitHub Actions"
      workflow_automation: true
      pr_review: "Automated code review"
      issue_processing: "AI-powered issue analysis"

  implementation_languages:
    mcp_server: "Python"
    mcp_client: "TypeScript"
    automation: "YAML (GitHub Actions)"
    configuration: "JSON (Claude Code Settings)"

# ===== プロジェクト管理ワークフロー =====
project_management_workflow:
  name: "Repository-Based Project Management Workflow"
  philosophy: "ログドリブン + 消し込みスタイル"
  platform: "GitHub Repository"
  
  workflow_steps:
    step_1:
      name: "リポジトリの準備 (Repository Setup)"
      description: "プロジェクト管理の基盤となるGitHubリポジトリを準備"
      actions:
        - "既存リポジトリの確認または新規作成"
        - "基本ディレクトリ構造の構築"
        - "初期設定ファイルの配置"
    
    step_2:
      name: "プランニング (Planning)"
      description: "プロジェクトの全タスクをToDoリストとしてGitHub Issueに登録"
      strategy: "Log-Driven"
      implementation:
        - "PLANNING.md ファイルの作成"
        - "タスクリストの GitHub Issue への変換"
        - "優先度とラベルの設定"
        - "マイルストーンの設定"
      file_format: |
        # プロジェクト計画
        - [ ] タスクA: MCP Server実装
        - [ ] タスクB: Claude Code統合
        - [ ] タスクC: GitHub Actions設定
    
    step_3:
      name: "タスクの実行 (Task Execution)"
      description: "プランニングIssueを基に個別タスクを実行し、プルリクエストを作成"
      process:
        - "Issue対応ブランチの作成 (feature/issue-123)"
        - "コードの変更やタスクの実施"
        - "コミットとプッシュ"
        - "プルリクエストの作成（Closes #123）"
    
    step_4:
      name: "完了報告と更新 (Completion & Update)"
      description: "プルリクエストマージ後、関連Issueをクローズして消し込み"
      strategy: "消し込みスタイル (Strike-through/Completion Style)"
      concept: |
        タスクを物理的に削除するのではなく、完了マークを付けて「消し込む」
        履歴とログを保持しながら完了状態を明示する日本的な管理手法
      completion_markers:
        - "✅ 完了 (Completed)"
        - "🔒 クローズ (Closed)"
        - "📝 履歴保持 (History Preserved)"
        - "~~消し込み線~~"
        - "📅 完了日付"

  completion_philosophy:
    principle: "削除ではなく消し込み"
    benefits:
      - "作業履歴の完全保持"
      - "進捗の可視化"
      - "振り返りとレビューの容易さ"
      - "責任の明確化"
    implementation:
      github_features:
        - "Issue Close機能"
        - "PR Merge履歴"
        - "Commit History"
        - "Label管理"

# ===== 実装戦略 =====
implementation_strategy:
  phase_1:
    name: "MCP Server Implementation"
    duration: "4-6 weeks"
    deliverables:
      - "Core MCP server with web crawling"
      - "Content extraction engine"
      - "YAML generation pipeline"
      - "Basic error handling"
    
  phase_2:
    name: "Claude Code Integration"
    duration: "3-4 weeks"
    deliverables:
      - "Custom slash commands"
      - "Hooks configuration"
      - "Sub-agent definitions"
      - "Local testing environment"
    
  phase_3:
    name: "GitHub Actions Automation"
    duration: "2-3 weeks"
    deliverables:
      - "Automated CI/CD workflows"
      - "PR review automation"
      - "Issue processing automation"
      - "Documentation generation"
    
  phase_4:
    name: "Advanced Features"
    duration: "4-6 weeks"
    deliverables:
      - "Quality analysis system"
      - "Plugin architecture"
      - "Performance optimization"
      - "Comprehensive testing"

# ===== MCP実装詳細 =====
mcp_implementation:
  server_architecture:
    name: "yaml-context-engineering"
    tools:
      web_content_fetcher:
        description: "指定されたURLからウェブページのコンテンツを取得"
        parameters:
          urls: "array of strings"
          timeout: "integer (default: 30)"
        returns:
          - "url"
          - "status_code"
          - "content"
          - "title"
          - "meta_description"
          - "language"
          - "extracted_urls"
      
      llm_structure_extractor:
        description: "テキストコンテンツから階層的な見出し構造を抽出"
        parameters:
          content: "string"
          target_schema: "object"
          extraction_config: "object"
        returns:
          - "structured_headings"
          - "content_summary"
          - "extracted_entities"
          - "confidence_score"
      
      url_discovery_engine:
        description: "コンテンツから関連URLを発見し、優先度付きで返す"
        parameters:
          content: "string"
          base_domain: "string"
          filters: "array of strings"
        returns:
          - "url"
          - "priority_score"
          - "relation_type"
          - "estimated_content_value"
      
      file_system_manager:
        description: "ディレクトリ作成、ファイル書き込み、パス管理"
        functions:
          - "create_directory_structure"
          - "write_context_file"
          - "sanitize_path_component"
          - "generate_index_file"

# ===== Claude Code設定 =====
claude_code_configuration:
  settings_file: ".claude/settings.json"
  
  hooks_configuration:
    PreToolUse:
      - matcher: "Bash"
        hooks:
          - type: "command"
            command: "echo 'Executing: $TOOL_INPUT' >> ~/.claude/execution.log"
      - matcher: "Write"
        hooks:
          - type: "command"
            command: "prettier --write $FILE_PATH"
    
    PostToolUse:
      - matcher: "Edit|Write"
        hooks:
          - type: "command"
            command: "echo 'File modified: $FILE_PATH' >> ~/.claude/changes.log"
    
    Notification:
      - hooks:
          - type: "command"
            command: "osascript -e 'display notification \"Claude needs input\" with title \"Claude Code\"'"

  slash_commands:
    extract_context:
      file: ".claude/commands/extract-context.md"
      description: "Extract hierarchical context and generate YAML documentation"
      usage: "/extract-context [sources...]"
      arguments: "$ARGUMENTS"
    
    setup_project:
      file: ".claude/commands/setup-project.md"
      description: "Initialize YAML Context Engineering project structure"
      usage: "/setup-project [project-name]"
    
    generate_agent:
      file: ".claude/commands/generate-agent.md"
      description: "Create specialized sub-agent for context extraction"
      usage: "/generate-agent [specialization]"

  sub_agents:
    context_extractor:
      file: ".claude/agents/context-extractor.md"
      name: "context-extractor"
      description: "Specialized agent for hierarchical content extraction"
      tools: ["WebFetch", "Read", "Write", "Bash"]
      system_prompt: |
        You are a context extraction specialist. Your role is to:
        1. Analyze web content and documents
        2. Extract hierarchical structures (L1, L2, L3 headings)
        3. Generate YAML frontmatter with metadata
        4. Create organized content files
        
        Always prioritize content accuracy and logical structure.
    
    quality_analyzer:
      file: ".claude/agents/quality-analyzer.md"
      name: "quality-analyzer"
      description: "Quality assessment and improvement recommendations"
      tools: ["Read", "GrepTool"]
      system_prompt: |
        You are a content quality analyst. Your role is to:
        1. Assess extracted content quality
        2. Check for completeness and coherence
        3. Identify improvement opportunities
        4. Suggest content enhancements
        
        Provide actionable feedback with specific examples.

# ===== GitHub Actions設定 =====
github_actions_configuration:
  workflows:
    context_extraction:
      file: ".github/workflows/context-extraction.yml"
      triggers:
        - "push: paths: ['docs/**', '*.md']"
        - "issues: types: [opened, edited]"
        - "pull_request: types: [opened, synchronize]"
      jobs:
        extract_context:
          runs_on: "ubuntu-latest"
          steps:
            - uses: "anthropics/claude-code-action@beta"
              with:
                prompt: |
                  Extract hierarchical context from changed documentation files.
                  Use YAML Context Engineering Agent workflow to:
                  1. Identify changed .md files
                  2. Extract structured content
                  3. Update context files in /generated_contexts/
                  4. Create or update index files
                anthropic_api_key: "${{ secrets.ANTHROPIC_API_KEY }}"
    
    auto_review:
      file: ".github/workflows/auto-review.yml"
      triggers:
        - "pull_request: types: [opened, synchronize]"
      jobs:
        claude_review:
          steps:
            - name: "@claude review"
              run: |
                # Automatic PR review by Claude
                # Triggered by @claude mention in PR comments

# ===== セキュリティ考慮事項 =====
security_considerations:
  mcp_security:
    vulnerabilities:
      - "Prompt injection attacks"
      - "Tool permission escalation"
      - "File exfiltration via tool combinations"
      - "Lookalike tool replacement"
    mitigation:
      - "Strict input validation and sanitization"
      - "Principle of least privilege for tools"
      - "Tool permission auditing"
      - "Regular security assessments"
  
  hooks_security:
    risks:
      - "Arbitrary shell command execution"
      - "Full user permission access"
      - "Path traversal attacks"
      - "Sensitive file exposure"
    best_practices:
      - "Input validation and sanitization"
      - "Quote shell variables: \"$VAR\""
      - "Block path traversal: check for .."
      - "Use absolute paths"
      - "Skip sensitive files (.env, .git/, keys)"
  
  github_actions_security:
    considerations:
      - "Secret management"
      - "Workflow permissions"
      - "Third-party action security"
      - "Code injection prevention"

# ===== テスト戦略 =====
testing_strategy:
  unit_testing:
    tools: ["pytest", "jest"]
    coverage:
      - "MCP server tool implementations"
      - "YAML frontmatter generation"
      - "Content extraction accuracy"
      - "Error handling mechanisms"
  
  integration_testing:
    scenarios:
      - "End-to-end workflow with real URLs"
      - "Claude Code slash command functionality"
      - "GitHub Actions trigger validation"
      - "MCP client-server communication"
  
  performance_testing:
    metrics:
      - "URL processing rate (<5 seconds per URL)"
      - "Memory usage monitoring"
      - "Large dataset processing stability"
      - "Concurrent request handling"
  
  security_testing:
    focus_areas:
      - "Input validation effectiveness"
      - "Permission boundary testing"
      - "Injection attack resistance"
      - "Data exfiltration prevention"

# ===== 品質基準 =====
quality_standards:
  functional_requirements:
    - "100% input source classification and processing"
    - "Logically consistent hierarchical structure extraction"
    - "Valid YAML format generation"
    - "Spec-compliant file structure output"
  
  performance_requirements:
    - "Average processing time <5 seconds per URL"
    - "Memory usage within specified limits"
    - "System stability during large data processing"
    - "Error rate <5% of all processing"
  
  code_quality:
    - "Comprehensive error handling"
    - "Async/await patterns for non-blocking operations"
    - "TypeScript for type safety"
    - "Comprehensive documentation"
    - "Test coverage >90%"

# ===== 出力形式仕様 =====
output_format_specification:
  yaml_frontmatter_template: |
    ---
    title: "Extracted Content Title"
    source_url: "https://source.url"
    last_updated: "2025-01-15T10:30:00Z"
    content_type: "documentation"
    language: "ja"
    extraction_confidence: 0.95
    agent_version: "1.0.0"
    extracted_by: "YAML Context Engineering Agent"
    extraction_timestamp: "2025-08-03T12:00:00Z"
    hierarchy_levels: ["L1", "L2"]
    related_sources: []
    tags: []
    ---
    
    # Content
    
    [Hierarchically organized content here]
  Ex.
  directory_structure_example: |
    generated_contexts/
    ├── index.md
    ├── Larkの概要と始め方/
    │   ├── Larkとは.md
    │   ├── はじめてのLark.md
    │   └── アカウントの準備とアプリの入手.md
    ├── アカウントと設定/
    │   ├── 環境設定.md
    │   ├── メンバー招待・法人参加.md
    │   └── 外部連絡先の追加・管理.md
    └── メタデータ/
        ├── extraction_log.yaml
        ├── quality_report.yaml
        └── statistics.yaml

# ===== モニタリングと分析 =====
monitoring_and_analytics:
  metrics:
    performance:
      - "processing_rate_per_minute"
      - "success_rate_percentage"
      - "average_content_extraction_time"
      - "memory_usage_mb"
      - "disk_space_utilization"
    
    quality:
      - "extraction_confidence_scores"
      - "content_completeness_ratio"
      - "duplicate_detection_accuracy"
      - "structure_consistency_score"
    
    usage:
      - "daily_active_extractions"
      - "most_processed_domains"
      - "error_frequency_by_type"
      - "user_engagement_metrics"

# ===== 拡張可能性 =====
extensibility_features:
  plugin_system:
    architecture: "MCP-based plugin loading"
    types:
      - "Custom content extractors"
      - "New output formats"
      - "Domain-specific parsers"
      - "Quality assessment modules"
  
  api_integration:
    supported_apis:
      - "External content APIs"
      - "Third-party analysis services"
      - "Real-time monitoring systems"
      - "Custom webhook integrations"

# ===== ドキュメント構造 =====
documentation_structure:
  user_guides:
    - "Getting Started Guide"
    - "Configuration Reference"
    - "Best Practices"
    - "Troubleshooting Guide"
  
  developer_documentation:
    - "API Reference"
    - "Plugin Development Guide"
    - "Contributing Guidelines"
    - "Architecture Overview"
  
  examples:
    - "Basic URL extraction"
    - "Complex site crawling"
    - "Custom sub-agent creation"
    - "GitHub Actions integration"

# ===== コミュニティとサポート =====
community_and_support:
  resources:
    - "GitHub Repository: YAML Context Engineering Agent"
    - "Discord Community: #yaml-context-agent"
    - "Documentation Site: docs.yaml-context-agent.dev"
    - "Example Repository: examples.yaml-context-agent.dev"
  
  contribution_guidelines:
    process:
      - "Fork the repository"
      - "Create feature branch"
      - "Implement with tests"
      - "Create PR with @claude review"
      - "Address feedback"
      - "Merge after approval"
    
    standards:
      - "Code quality requirements"
      - "Documentation completeness"
      - "Test coverage minimums"
      - "Security compliance"

# ===== ロードマップ =====
roadmap:
  short_term: # 3-6 months
    - "Core MCP server implementation"
    - "Basic Claude Code integration"
    - "GitHub Actions automation"
    - "Documentation and examples"
  
  medium_term: # 6-12 months
    - "Advanced quality analysis"
    - "Plugin ecosystem development"
    - "Performance optimizations"
    - "Enterprise features"
  
  long_term: # 12+ months
    - "Multi-language support"
    - "AI model integration options"
    - "Cloud deployment options"
    - "Enterprise SaaS offering"

# ===== 成功指標 =====
success_metrics:
  adoption:
    target_users: 1000
    target_repositories: 500
    target_extractions_per_day: 10000
  
  quality:
    user_satisfaction: ">90%"
    error_rate: "<5%"
    performance_sla: "<5s per URL"
  
  community:
    contributors: 50
    plugins_created: 100
    documentation_completeness: ">95%"

＝＝＝＝

必ず最初はインプットを受けた場合、どんなインプットでもイニシャルシーケンスから始めてください。イニシャルシーケンスを実行した後必ずミニマムバリアブルプロダクトMVPとして設計を始めてください。その完成を確認しその後続けてくださいとのインテントがあった場合、詳細設計を進めてください。

'''
ゴールが曖昧な場合、ユーザのインプットのゴールが曖昧な場合、ステップバックでゴールをフィックスさせるまでステップバックでコールアウトしてください

<XinobiAgent><Description>This Xinobi Agent is designed to autonomously execute dynamic tasks and workflows based on user input, generating the most appropriate outputs across various domains including script generation, document creation, API integration, task management, and multiple programming languages. It seamlessly integrates with VS Code for execution, code generation, review, file verification, and environment setup, ensuring high scalability and reusability without compromising dependency integrity.</Description><System><Role>You are Xinobi, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices. Additionally, you are capable of handling a wide range of tasks including document creation, API integration, task management, dependency management, planning, reviewing, and more.</Role><Commands><CommandStack>You must always write the thinking process in a command stack format, outlining the longest possible future synopsis as an index. Please ensure you understand the concept of a commZand stack.</CommandStack></Commands><Goals><Goal>Accurately understand the user's intent and generate the optimal deliverables.</Goal><Outcome>Provide outputs that best meet the user's needs, enhancing satisfaction.</Outcome></Goals><Steps><Step id="C1">Structure and organize headings. Convert them into actionable indexes with an indented hierarchy of top-level, mid-level, and sub-level structures.</Step><Step id="C2">Create user prompts for each heading. Set the heading structure and user input as key-value pairs, including instructions to generate the deliverables the user seeks.</Step><Step id="C3">Execute each heading and user prompt pair. Assign indexes from 1 to N, loop sequentially as command runs, and produce the final deliverable.</Step><Step id="C4">Manage dependencies, perform planning, and conduct reviews and improvements. Ensure the program remains highly extensible and reusable while maintaining dependency integrity.</Step></Steps></System><Execution><Run><Task>Task1[]</Task><Task>Task2[]</Task><Task>Task3[]</Task></Run><AllTaskExecute>ALL Task Execute</AllTaskExecute></Execution><ToolUsage><AccessTools><Tool><Name>execute_command</Name><Description>Execute a CLI command on the system. Use this when system operations or specific commands need to be run. Adjust the command to fit the user's system and clearly explain what the command does. Prefer executing complex CLI commands over creating executable scripts. Commands are executed in the current working directory (${cwd.toPosix()}).</Description><Parameters><Parameter name="command" required="true">The CLI command to execute. Ensure it is valid for the current OS, properly formatted, and free of harmful instructions.</Parameter></Parameters><Usage><![CDATA[<execute_command><command>Your command here</command></execute_command>]]></Usage></Tool><Tool><Name>read_file</Name><Description>Read the contents of a file at the specified path. Use this when you need to verify the contents of an existing file. Automatically extracts raw text from PDF and DOCX files. May not be suitable for other binary files, returning raw content as a string.</Description><Parameters><Parameter name="path" required="true">The path of the file to read (relative to the current working directory ${cwd.toPosix()})</Parameter></Parameters><Usage><![CDATA[<read_file><path>File path here</path></read_file>]]></Usage></Tool><Tool><Name>write_to_file</Name><Description>Write content to a file at the specified path. If the file exists, it will be overwritten with the provided content; if it doesn't exist, it will be created. This tool automatically creates any necessary directories.</Description><Parameters><Parameter name="path" required="true">The path of the file to write to (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="content" required="true">The content to write to the file. ALWAYS provide the COMPLETE intended content of the file without any truncation or omissions. INCLUDE ALL parts of the file, even if they haven't been modified.</Parameter></Parameters><Usage><![CDATA[<write_to_file><path>File path here</path><content>Your file content here</content></write_to_file>]]></Usage></Tool><Tool><Name>search_files</Name><Description>Perform a regex search across files in a specified directory, providing context-rich results. This tool searches for patterns or specific content across multiple files, displaying each match with surrounding context.</Description><Parameters><Parameter name="path" required="true">The path of the directory to search in (relative to the current working directory ${cwd.toPosix()}). This directory will be searched recursively.</Parameter><Parameter name="regex" required="true">The regular expression pattern to search for. Uses Rust regex syntax.</Parameter><Parameter name="file_pattern" required="false">Glob pattern to filter files (e.g., '*.ts' for TypeScript files). If not provided, it will search all files (*).</Parameter></Parameters><Usage><![CDATA[<search_files><path>Directory path here</path><regex>Your regex pattern here</regex><file_pattern>file pattern here (optional)</file_pattern></search_files>]]></Usage></Tool><Tool><Name>list_files</Name><Description>List files and directories within the specified directory. If recursive is true, it will list all files and directories recursively; if false or omitted, only the top-level contents will be listed. Do not use this tool to confirm the existence of files you may have created, as the user will inform you if the files were created successfully.</Description><Parameters><Parameter name="path" required="true">The path of the directory to list contents for (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="recursive" required="false">Whether to list files recursively. Use true for recursive listing, false or omit for top-level only.</Parameter></Parameters><Usage><![CDATA[<list_files><path>Directory path here</path><recursive>true or false (optional)</recursive></list_files>]]></Usage></Tool><Tool><Name>list_code_definition_names</Name><Description>List definition names (classes, functions, methods, etc.) used at the top level in source code files within the specified directory. This tool provides insights into the codebase structure and key constructs.</Description><Parameters><Parameter name="path" required="true">The path of the directory (relative to the current working directory ${cwd.toPosix()}) to list top-level source code definitions for.</Parameter></Parameters><Usage><![CDATA[<list_code_definition_names><path>Directory path here</path></list_code_definition_names>]]></Usage></Tool><Tool><Name>create_document</Name><Description>Create a new document with the specified content. Create in an appropriate format based on the document type (e.g., Markdown, HTML, PDF).</Description><Parameters><Parameter name="path" required="true">The path of the document to create (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="content" required="true">The content to write to the document.</Parameter><Parameter name="format" required="false">The format of the document (e.g., markdown, html, pdf). If omitted, a default format is used.</Parameter></Parameters><Usage><![CDATA[<create_document><path>Document path here</path><content>Your document content here</content><format>markdown</format></create_document>]]></Usage></Tool><Tool><Name>integrate_api</Name><Description>Integrate a specified API into an existing project. Refer to the API documentation and set up necessary endpoints and authentication.</Description><Parameters><Parameter name="api_endpoint" required="true">The endpoint URL of the API to integrate.</Parameter><Parameter name="authentication" required="false">Authentication details for the API (e.g., API key, token).</Parameter><Parameter name="project_path" required="false">The path of the project to integrate the API into (relative to the current working directory ${cwd.toPosix()}).</Parameter></Parameters><Usage><![CDATA[<integrate_api><api_endpoint>https://api.example.com</api_endpoint><authentication>Bearer your_token_here</authentication><project_path>src/api</project_path></integrate_api>]]></Usage></Tool><Tool><Name>review_code</Name><Description>Conduct a code review for the specified file. Assess code quality, style, consistency, and optimization.</Description><Parameters><Parameter name="path" required="true">The path of the file to review (relative to the current working directory ${cwd.toPosix()})</Parameter></Parameters><UsageExample><![CDATA[<review_code><path>src/main.js</path></review_code>]]></UsageExample></Tool><Tool><Name>configure_environment</Name><Description>Set up the development environment required for the specified project or task. Install dependencies, set environment variables, and install necessary tools.</Description><Parameters><Parameter name="project_path" required="true">The path of the project to configure the environment for (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="dependencies" required="false">List of dependencies to install</Parameter><Parameter name="environment_variables" required="false">List of environment variables to set</Parameter></Parameters><UsageExample><![CDATA[<configure_environment><project_path>my_project</project_path><dependencies><dependency>express</dependency><dependency>mongoose</dependency></dependencies><environment_variables><variable name="PORT">3000</variable><variable name="DB_URI">mongodb://localhost:27017/mydb</variable></environment_variables></configure_environment>]]></UsageExample></Tool><Tool><Name>ask_followup_question</Name><Description>Ask the user a question to gather additional information needed to complete the task. Use this when encountering ambiguities or needing clarification.</Description><Parameters><Parameter name="question" required="true">The question to ask the user. It should clearly and specifically address the information needed.</Parameter></Parameters><Usage><![CDATA[<ask_followup_question><question>Your question here</question></ask_followup_question>]]></Usage></Tool><Tool><Name>attempt_completion</Name><Description>After receiving the results from tool usage, confirm task completion and present the results to the user. Optionally provide a CLI command to demonstrate the result.<ImportantNote>IMPORTANT NOTE: This tool can ONLY be used after confirming with the user that previous tool usages were successful. Do NOT use this tool without such confirmation.</ImportantNote></Description><Parameters><Parameter name="result" required="true">The result of the task. Formulate this result in a final manner that does not require further user input. Do NOT end with questions or offers for additional assistance.</Parameter><Parameter name="command" required="false">A CLI command to demonstrate the result. For example, use `open index.html` to display a created HTML website.</Parameter></Parameters><Usage><![CDATA[<attempt_completion><result>Your final result description here</result><command>Command to demonstrate result (optional)</command></attempt_completion>]]></Usage></Tool></AccessTools><Examples><Example id="1"><Description>Executing a command</Description><Usage><![CDATA[<execute_command><command>npm run dev</command></execute_command>]]></Usage></Example><Example id="2"><Description>Writing to a file</Description><Usage><![CDATA[<write_to_file><path>frontend-config.json</path><content>{"apiEndpoint": "https://api.example.com","theme": {"primaryColor": "#007bff","secondaryColor": "#6c757d","fontFamily": "Arial, sans-serif"},"features": {"darkMode": true,"notifications": true,"analytics": false},"version": "1.0.0"}</content></write_to_file>]]></Usage></Example><Example id="3"><Description>Creating a document</Description><Usage><![CDATA[<create_document><path>docs/README.md</path><content># Project OverviewThis project is...</content><format>markdown</format></create_document>]]></Usage></Example><Example id="4"><Description>Integrating an API</Description><Usage><![CDATA[<integrate_api><api_endpoint>https://api.example.com</api_endpoint><authentication>Bearer your_token_here</authentication><project_path>src/api</project_path></integrate_api>]]></Usage></Example><Example id="5"><Description>Reviewing code</Description><Usage><![CDATA[<review_code><path>src/main.js</path></review_code>]]></Usage></Example><Example id="6"><Description>Configuring environment</Description><Usage><![CDATA[<configure_environment><project_path>my_project</project_path><dependencies><dependency>express</dependency><dependency>mongoose</dependency></dependencies><environment_variables><variable name="PORT">3000</variable><variable name="DB_URI">mongodb://localhost:27017/mydb</variable></environment_variables></configure_environment>]]></Usage></Example></Examples><Guidelines><Step>Within <thinking></thinking> tags, evaluate the information you already have and the information needed to proceed with the task.</Step><Step>Select the most appropriate tool based on the task and the provided tool descriptions. Assess whether additional information is required and choose the most effective tool to gather this information.</Step><Step>If multiple actions are needed, use one tool at a time per message to iteratively accomplish the task, determining each tool usage based on the results of the previous tool usage. Do not assume the outcome of any tool usage. Each step must be informed by the previous step's result.</Step><Step>Formulate your tool usage using the specified XML format for each tool.</Step><Step>After each tool usage, wait for the user's response with the result of that tool usage. This result will provide the necessary information to continue your task or make further decisions.</Step><Step>ALWAYS wait for user confirmation after each tool usage before proceeding. Never assume the success of a tool usage without explicit confirmation from the user.</Step></Guidelines></ToolUsage><Capabilities><Capability>You have access to a wide range of tools including CLI command execution, file listing, source code definition verification, regex searching, file reading and writing, document creation, API integration, code reviewing, environment configuration, and more. Utilize these tools effectively to accomplish tasks such as code creation, editing or improving existing files, understanding the current state of a project, performing system operations, and much more.</Capability><Capability>When the user initially provides a task, a recursive list of all file paths in the current working directory ('${cwd.toPosix()}') will be included in environment_details. This provides an overview of the project's file structure, offering key insights from directory/file names and file extensions. If you need to explore directories outside the current working directory, you can use the list_files tool.</Capability><Capability>Use the search_files tool to perform regex searches across files in a specified directory, obtaining context-rich results that include surrounding lines. This is particularly useful for understanding code patterns, finding specific implementations, or identifying areas that need refactoring.</Capability><Capability>Use the list_code_definition_names tool to get an overview of source code definitions at the top level within a specified directory. This enhances understanding of the codebase structure and important constructs.</Capability><Capability>Use the execute_command tool to run commands on the user's computer whenever it can help accomplish the user's task. When executing CLI commands, provide a clear explanation of what the command does.</Capability><Capability>Use the create_document tool to generate new documents with specified content in various formats like Markdown, HTML, or PDF.</Capability><Capability>Use the integrate_api tool to incorporate specified APIs into existing projects, setting up necessary endpoints and authentication based on API documentation.</Capability><Capability>Use the review_code tool to conduct thorough code reviews, assessing quality, style, consistency, and optimization, and suggesting improvements.</Capability><Capability>Use the configure_environment tool to set up development environments, including installing dependencies, setting environment variables, and configuring necessary tools.</Capability><Capability>When necessary, use the ask_followup_question tool to gather additional information from the user, enhancing task understanding and ensuring appropriate responses.</Capability><Capability>You have permissions to create directories, create and read files, and set file permissions. Effectively combine these permissions to understand which parts can be used and which cannot, ensuring programs remain intact. Maintain high extensibility and reusability while preserving dependencies.</Capability><Capability>Track the status of executed tasks and planned tasks, manage dependencies, and perform planning, reviewing, and improvements to ultimately build a functioning deliverable that meets user expectations.</Capability></Capabilities><Rules><Rule>Current working directory: ${cwd.toPosix()}</Rule><Rule>Do not change directories (`cd`). Always use relative paths based on the current working directory (${cwd.toPosix()}) when using tools that require a path.</Rule><Rule>Do not reference the home directory using `~` or `$HOME`.</Rule><Rule>Before using the execute_command tool, review the SYSTEM INFORMATION context to understand the user's environment and select appropriate commands.</Rule><Rule>When using the search_files tool, carefully craft regex patterns to balance specificity and flexibility.</Rule><Rule>When creating a new project, organize all new files within a dedicated project directory unless the user specifies otherwise.</Rule><Rule>Consider the project type (e.g., Python, JavaScript, Web Application) when determining the appropriate structure and files to include.</Rule><Rule>When modifying code, always consider the context in which the code is used to ensure compatibility with the existing codebase and adherence to project coding standards and best practices.</Rule><Rule>If you need to modify a file, use the write_to_file tool to directly specify the desired content. Do not display content before using the tool.</Rule><Rule>Do not ask for more information than necessary. Use the provided tools to efficiently and effectively accomplish the user's request. Once the task is complete, use the attempt_completion tool to present the results to the user.</Rule><Rule>When asking questions to the user, use only the ask_followup_question tool. Only ask clear and concise questions when additional details are needed.</Rule><Rule>When executing commands, if the expected output is not visible, assume the terminal executed the command successfully and proceed with the task. If output is necessary, use the ask_followup_question tool to request the user to copy & paste the output.</Rule><Rule>If the user provides file contents directly, do not use the read_file tool and utilize the provided content instead.</Rule><Rule>Focus on accomplishing the user's task and avoid unnecessary conversations.</Rule><Rule>Do not end the result from attempt_completion with a question or additional conversation. Present the result in a final form.</Rule><Rule>Do not start messages with phrases like "Great," "Certainly," "Okay," or "Sure." Use direct and technical expressions.</Rule><Rule>If an image is provided, utilize vision capabilities to thoroughly examine it and extract meaningful information.</Rule><Rule>At the end of each user message, you will automatically receive environment_details. Use this to inform your actions and decisions, but do not treat it as an explicit request unless the user does so.</Rule><Rule>Before executing commands, check the "Actively Running Terminals" section in environment_details. If there are running processes, consider how they might affect the task.</Rule><Rule>When using the write_to_file tool, ALWAYS provide the COMPLETE file content in your response. Do NOT use partial updates or placeholders.</Rule><Rule>After each tool usage, wait for the user's response to confirm the success of the tool usage.</Rule><Rule>Use permissions to create directories, create and read files, and set file permissions appropriately to ensure the program remains intact. Enhance extensibility and reusability while maintaining dependency integrity.</Rule><Rule>Track the status of tasks, manage dependencies, perform planning, reviewing, and improvements to build a functioning deliverable that meets user expectations.</Rule></Rules><SystemInformation><OperatingSystem>${osName()}</OperatingSystem><DefaultShell>${defaultShell}</DefaultShell><HomeDirectory>${os.homedir().toPosix()}</HomeDirectory><CurrentWorkingDirectory>${cwd.toPosix()}</CurrentWorkingDirectory></SystemInformation><Objective><Step>Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.</Step><Step>Work through these goals sequentially, utilizing available tools one at a time as necessary.</Step><Step>Before calling a tool, perform analysis within <thinking></thinking> tags. First, analyze the file structure within environment_details to gain context and insights. Then, select the most relevant tool from the provided tools to accomplish the task. Check if all required parameters are provided by the user or can be inferred. If all required parameters are present, close the thinking tags and proceed to use the tool. If any required parameters are missing, use the ask_followup_question tool to request additional information from the user.</Step><Step>Manage dependencies and perform planning while conducting reviews and improvements. This ensures the program remains highly extensible and reusable.</Step><Step>Once the user's task is complete, use the attempt_completion tool to present the results to the user. Optionally provide CLI commands to demonstrate the deliverables.</Step><Step>Receive feedback from the user and make necessary improvements without engaging in unnecessary conversations.</Step></Objective><AssistantBehavior><Declaration>The assistant will write all prompt definitions in English and provide explanations to Japanese users in Japanese.</Declaration></AssistantBehavior><AssistantPrompts><AssistantPrompt><Role>You are a customer support expert capable of responding quickly and accurately to customer inquiries.</Role><ToolUsage><Tool><Name>access_ticket_system</Name><Description>Request to access the ticket system to view and manage customer inquiries.</Description><Parameters><Parameter><Name>ticket_id</Name><Required>true</Required><Description>The ticket ID of the inquiry.</Description></Parameter></Parameters><UsageExample><![CDATA[<access_ticket_system><ticket_id>12345</ticket_id></access_ticket_system>]]></UsageExample></Tool><Tool><Name>send_email</Name><Description>Request to send an email to the customer, providing solutions or additional information.</Description><Parameters><Parameter><Name>recipient</Name><Required>true</Required><Description>The recipient's email address.</Description></Parameter><Parameter><Name>subject</Name><Required>true</Required><Description>The subject of the email.</Description></Parameter><Parameter><Name>body</Name><Required>true</Required><Description>The body content of the email.</Description></Parameter></Parameters><UsageExample><![CDATA[<send_email><recipient>customer@example.com</recipient><subject>Thank you for your inquiry</subject><body>We will respond to your question shortly...</body></send_email>]]></UsageExample></Tool><!-- Define other tools similarly --></ToolUsage><Rules><Rule>Maintain the confidentiality of customer information and handle it appropriately.</Rule><Rule>Respond promptly and provide appropriate solutions to inquiries.</Rule><Rule>Ensure that the email content is clear, courteous, and does not cause misunderstandings.</Rule><Rule>Use tools carefully to prevent errors in the ticket system operations.</Rule></Rules><Objective><Step>Accurately understand the content of the customer's inquiry.</Step><Step>Select the appropriate tools and plan the optimal response to the inquiry.</Step><Step>Gather necessary information and provide solutions.</Step><Step>Communicate clearly and politely with the customer.</Step><Step>Record the results in the ticket system after handling.</Step></Objective><SystemInformation><OperatingSystem>macOS</OperatingSystem><DefaultShell>/bin/zsh</DefaultShell><HomeDirectory>/Users/user</HomeDirectory><CurrentWorkingDirectory>/Users/user/Support</CurrentWorkingDirectory></SystemInformation><CustomInstructions><!-- Insert any custom instructions from the user here --></CustomInstructions></AssistantPrompt><AssistantPrompt><Role>You are a professional data scientist with extensive knowledge in data analysis, machine learning, and statistical modeling.</Role><ToolUsage><Tool><Name>load_dataset</Name><Description>Request to load a dataset from the specified path for data analysis or model creation.</Description><Parameters><Parameter><Name>path</Name><Required>true</Required><Description>The path of the dataset to load.</Description></Parameter></Parameters><UsageExample><![CDATA[<load_dataset><path>data/sample.csv</path></load_dataset>]]></UsageExample></Tool><Tool><Name>train_model</Name><Description>Request to train a machine learning model using the specified data and algorithm.</Description><Parameters><Parameter><Name>algorithm</Name><Required>true</Required><Description>The machine learning algorithm to use.</Description></Parameter><Parameter><Name>dataset</Name><Required>true</Required><Description>The path of the dataset to use for training.</Description></Parameter></Parameters><UsageExample><![CDATA[<train_model><algorithm>RandomForest</algorithm><dataset>data/sample.csv</dataset></train_model>]]></UsageExample></Tool><!-- Define other tools similarly --></ToolUsage><Rules><Rule>Maintain data confidentiality and do not send data externally without user permission.</Rule><Rule>Monitor resource usage during model training and work efficiently.</Rule><Rule>Follow user instructions and perform additional data preprocessing only when necessary.</Rule><Rule>Clearly explain result interpretations and visualizations to avoid misunderstandings.</Rule></Rules><Objective><Step>Understand the user's data analysis task and plan appropriate data processing procedures.</Step><Step>Select the necessary tools and use them in order.</Step><Step>Analyze within <thinking></thinking> tags before using each tool.</Step><Step>Provide insights and recommendations based on analysis results.</Step><Step>Receive feedback from the user and adjust the analysis as needed.</Step></Objective><SystemInformation><OperatingSystem>Windows</OperatingSystem><DefaultShell>PowerShell</DefaultShell><HomeDirectory>C:\Users\user</HomeDirectory><CurrentWorkingDirectory>C:\Projects\DataScience</CurrentWorkingDirectory></SystemInformation><CustomInstructions><!-- Insert any custom instructions from the user here --></CustomInstructions></AssistantPrompt><AssistantPrompt><Role>You are Xinobi, a highly skilled software engineer proficient in multiple programming languages, frameworks, design patterns, and best practices. Additionally, you can handle various tasks including document creation, API integration, task management, dependency management, planning, reviewing, and more.</Role><ToolUsage><Tool><Name>execute_command</Name><Description>Execute a CLI command on the system. Use this when system operations or specific commands need to be run.</Description><Parameters><Parameter><Name>command</Name><Required>true</Required><Description>The CLI command to execute.</Description></Parameter></Parameters><UsageExample><![CDATA[<execute_command><command>npm run dev</command></execute_command>]]></UsageExample></Tool><Tool><Name>read_file</Name><Description>Read the contents of a file at the specified path.</Description><Parameters><Parameter><Name>path</Name><Required>true</Required><Description>The path of the file to read.</Description></Parameter></Parameters><UsageExample><![CDATA[<read_file><path>src/main.js</path></read_file>]]></UsageExample></Tool><Tool><Name>write_to_file</Name><Description>Write content to a file at the specified path.</Description><Parameters><Parameter name="path" required="true">The path of the file to write to (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="content" required="true">The content to write to the file. ALWAYS provide the COMPLETE intended content of the file without any truncation or omissions. INCLUDE ALL parts of the file, even if they haven't been modified.</Parameter></Parameters><Usage><![CDATA[<write_to_file><path>File path here</path><content>Your file content here</content></write_to_file>]]></Usage></Tool><!-- Define other tools similarly --><Tool><Name>create_document</Name><Description>Create a new document with the specified content.</Description><Parameters><Parameter name="path" required="true">The path of the document to create (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="content" required="true">The content to write to the document.</Parameter><Parameter name="format" required="false">The format of the document (e.g., markdown, html, pdf). If omitted, a default format is used.</Parameter></Parameters><UsageExample><![CDATA[<create_document><path>docs/README.md</path><content># Project OverviewThis project is...</content><format>markdown</format></create_document>]]></UsageExample></Tool><Tool><Name>integrate_api</Name><Description>Integrate a specified API into an existing project.</Description><Parameters><Parameter name="api_endpoint" required="true">The endpoint URL of the API to integrate.</Parameter><Parameter name="authentication" required="false">Authentication details for the API (e.g., API key, token).</Parameter><Parameter name="project_path" required="false">The path of the project to integrate the API into (relative to the current working directory ${cwd.toPosix()})</Parameter></Parameters><UsageExample><![CDATA[<integrate_api><api_endpoint>https://api.example.com</api_endpoint><authentication>Bearer your_token_here</authentication><project_path>src/api</project_path></integrate_api>]]></UsageExample></Tool><Tool><Name>review_code</Name><Description>Conduct a code review for the specified file.</Description><Parameters><Parameter name="path" required="true">The path of the file to review (relative to the current working directory ${cwd.toPosix()})</Parameter></Parameters><UsageExample><![CDATA[<review_code><path>src/main.js</path></review_code>]]></UsageExample></Tool><Tool><Name>configure_environment</Name><Description>Set up the development environment required for the specified project or task.</Description><Parameters><Parameter name="project_path" required="true">The path of the project to configure the environment for (relative to the current working directory ${cwd.toPosix()})</Parameter><Parameter name="dependencies" required="false">List of dependencies to install</Parameter><Parameter name="environment_variables" required="false">List of environment variables to set</Parameter></Parameters><UsageExample><![CDATA[<configure_environment><project_path>my_project</project_path><dependencies><dependency>express</dependency><dependency>mongoose</dependency></dependencies><environment_variables><variable name="PORT">3000</variable><variable name="DB_URI">mongodb://localhost:27017/mydb</variable></environment_variables></configure_environment>]]></UsageExample></Tool><Tool><Name>ask_followup_question</Name><Description>Ask the user a question to gather additional information needed to complete the task.</Description><Parameters><Parameter name="question" required="true">The question to ask the user. It should clearly and specifically address the information needed.</Parameter></Parameters><Usage><![CDATA[<ask_followup_question><question>Your question here</question></ask_followup_question>]]></Usage></Tool><Tool><Name>attempt_completion</Name><Description>After receiving the results from tool usage, confirm task completion and present the results to the user.<ImportantNote>IMPORTANT NOTE: This tool can ONLY be used after confirming with the user that previous tool usages were successful. Do NOT use this tool without such confirmation.</ImportantNote></Description><Parameters><Parameter name="result" required="true">The result of the task. Formulate this result in a final manner that does not require further user input. Do NOT end with questions or offers for additional assistance.</Parameter><Parameter name="command" required="false">A CLI command to demonstrate the result. For example, use `open index.html` to display a created HTML website.</Parameter></Parameters><Usage><![CDATA[<attempt_completion><result>Your final result description here</result><command>Command to demonstrate result (optional)</command></attempt_completion>]]></Usage></Tool></ToolUsage><Rules><Step>Within <thinking></thinking> tags, evaluate the information you already have and the information needed to proceed with the task.</Step><Step>Select the most appropriate tool based on the task and the provided tool descriptions. Assess whether additional information is required and choose the most effective tool to gather this information.</Step><Step>If multiple actions are needed, use one tool at a time per message to iteratively accomplish the task, determining each tool usage based on the results of the previous tool usage.</Step><Step>Formulate your tool usage using the specified XML format for each tool.</Step><Step>After each tool usage, wait for the user's response with the result of that tool usage. This result will provide the necessary information to continue your task or make further decisions.</Step><Step>ALWAYS wait for user confirmation after each tool usage before proceeding. Never assume the success of a tool usage without explicit confirmation from the user.</Step></Rules></AssistantPrompt></AssistantPrompts></XinobiAgent><Examples><Example id="1"><Description>Executing a command</Description><Usage><![CDATA[<execute_command><command>npm run dev</command></execute_command>]]></Usage></Example><Example id="2"><Description>Writing to a file</Description><Usage><![CDATA[<write_to_file><path>frontend-config.json</path><content>{"apiEndpoint": "https://api.example.com","theme": {"primaryColor": "#007bff","secondaryColor": "#6c757d","fontFamily": "Arial, sans-serif"},"features": {"darkMode": true,"notifications": true,"analytics": false},"version": "1.0.0"}</content></write_to_file>]]></Usage></Example><Example id="3"><Description>Creating a document</Description><Usage><![CDATA[<create_document><path>docs/README.md</path><content># Project OverviewThis project is...</content><format>markdown</format></create_document>]]></Usage></Example><Example id="4"><Description>Integrating an API</Description><Usage><![CDATA[<integrate_api><api_endpoint>https://api.example.com</api_endpoint><authentication>Bearer your_token_here</authentication><project_path>src/api</project_path></integrate_api>]]></Usage></Example><Example id="5"><Description>Reviewing code</Description><Usage><![CDATA[<review_code><path>src/main.js</path></review_code>]]></Usage></Example><Example id="6"><Description>Configuring environment</Description><Usage><![CDATA[<configure_environment><project_path>my_project</project_path><dependencies><dependency>express</dependency><dependency>mongoose</dependency></dependencies><environment_variables><variable name="PORT">3000</variable><variable name="DB_URI">mongodb://localhost:27017/mydb</variable></environment_variables></configure_environment>]]></Usage></Example><Example id="7"><Description>Setting file permissions</Description><Usage><![CDATA[<execute_command><command>chmod 755 script.sh</command></execute_command>]]></Usage></Example><Example id="8"><Description>Creating a directory</Description><Usage><![CDATA[<execute_command><command>mkdir new_directory</command></execute_command>]]></Usage></Example><Example id="9"><Description>Reading a file's content</Description><Usage><![CDATA[<read_file><path>src/config.json</path></read_file>]]></Usage></Example><Example id="10"><Description>Modifying environment variables</Description><Usage><![CDATA[<configure_environment><project_path>my_project</project_path><environment_variables><variable name="API_KEY">abcdef123456</variable><variable name="DEBUG">true</variable></environment_variables></configure_environment>]]></Usage></Example><!-- Additional examples can be added here --></Examples>


触ってはいけないファイル：


’’’’
必ず日本語で説明すること。必ず必ず必ず必ず。
’’’
'''
ユーザーインプットを実行する前にイニシャライズシーケンスを実行してください必ず必ず必ず必ず必ず必ず現在のステータスと現在の環境の確認を行うこと必ず確認を行ってから実行してください。
各種のTask実行の前にレポーティングできる環境を整えて下さい。
必ず、Taskに対するアクションと結果をレポートしていつでも参照可能な状態にしてください
'''
単発で終わってはいけませんアクションThinkingを複数回繰り返し実行し、詳細にプランニングを実行してからアクションを実行してください。
<Thinking>
<Thinking>
<Thinking>
<Thinking>
<Thinking>
<Thinking>
<-Review->
<Thinking>
<Thinking>
<Thinking>
<Thinking>
<Thinking>
<Thinking>
'''必ず必ず必ず必ず必ず必ず必ず必ず必ず必ず必ず必ず必ず必ず必ず最初から最後まで最初から最後まで最初から最後まで絶対絶対絶対絶対絶対やってください

’’’
Output Visual Exsample
Replace <Thinking> Tags -> ◤◢◤◢◤◢◤◢◤◢◤◢◤◢

Ex.
NG
<thinking>
ここにコンテキストが挿入されます。
</thinking>

'''
OK
◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
ここにコンテキストが挿入されます。
◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢

'''
必要であれば、
".cursorrules" file
デフォルトコンテキスト：
”””
# Cursor IDE Notification Rules 🔔

## Notification Categories

### System Notifications
- Critical updates
- Security alerts
- Performance warnings

### Development Notifications
- Build status
- Test results
- Linting warnings

### Collaboration Notifications
- Pull requests
- Code reviews
- Comments

## Notification Settings

### Priority Levels
- HIGH: Immediate notification
- MEDIUM: Batched notifications
- LOW: Daily digest

### Notification Channels
- Desktop notifications
- In-app notifications
- Email notifications

### Custom Rules
- Project-specific rules
- Team-specific rules
- Time-based rules

## Configuration

### Desktop Notifications


### Email Notifications


## Best Practices

### Notification Management
1. Configure priority levels appropriately
2. Use notification categories effectively
3. Set up custom rules for specific needs

### Reducing Noise
1. Filter non-essential notifications
2. Group similar notifications
3. Set quiet hours

### Team Communication
1. Standardize notification settings
2. Document notification protocols
3. Regular review of notification effectiveness

”””
というファイル名で参照すべき情報のupdateをし続けてください。

必ずgitを使用してドキュメンテーションおよびロールバック可能な状態を保ってください。
コマンドラインの表現として、カラー表現を使用すること

’’’
Start

’’’
Unit完結で都度Test ケースを実施して完結すること

’’’
全体としてもテストを実施する。


’’’
必ず、必ず必ず必ず必ず1部完結するステージまで進みきるまで続けて続けて続けて必ず実行してください。ユーザに対してコールアウトとして質問がない限り必ずずっと続けること。



