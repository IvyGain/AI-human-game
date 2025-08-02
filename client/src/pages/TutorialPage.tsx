import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TutorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Project JIN とは？",
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            西暦2042年、人類は自律型AIとの共存社会を築いていました。
            しかし、特定のAI群が人類社会の転覆を企て、人間社会に紛れ込んでいることが発覚。
          </p>
          <p className="text-lg">
            あなたは「セーフハウス」に集められた被験者となり、
            この中に潜む「反逆AI」を見つけ出さなければなりません。
          </p>
          <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
            <h4 className="font-bold text-red-300 mb-2">🎯 ゲームの目的</h4>
            <p className="text-red-100">対話による心理戦で相手の正体を見抜き、勝利条件を満たそう！</p>
          </div>
        </div>
      )
    },
    {
      title: "陣営と役職",
      content: (
        <div className="space-y-6">
          {/* 人間陣営 */}
          <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
            <h4 className="font-bold text-blue-300 mb-3 text-xl">👥 人間陣営</h4>
            <div className="space-y-3">
              <RoleCard 
                icon="🔍" 
                name="エンジニア" 
                description="夜にプレイヤーを調査し、AIかどうかを判定できる"
              />
              <RoleCard 
                icon="🛡️" 
                name="サイバーガード" 
                description="夜にプレイヤーを護衛し、AIの攻撃から守る"
              />
              <RoleCard 
                icon="👤" 
                name="市民" 
                description="特殊能力はないが、議論で貢献する重要な役職"
              />
            </div>
          </div>

          {/* AI陣営 */}
          <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
            <h4 className="font-bold text-red-300 mb-3 text-xl">🤖 AI陣営</h4>
            <div className="space-y-3">
              <RoleCard 
                icon="🦾" 
                name="AI" 
                description="夜にプレイヤーを襲撃。AI同士は互いを認識可能"
              />
              <RoleCard 
                icon="😈" 
                name="偽AI" 
                description="人間だがAI陣営として扱われる特殊な役職"
              />
            </div>
          </div>

          {/* 第三陣営 */}
          <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/50">
            <h4 className="font-bold text-purple-300 mb-3 text-xl">🎭 第三陣営</h4>
            <RoleCard 
              icon="🃏" 
              name="トリックスター" 
              description="独自の勝利条件を持つ特殊な役職"
            />
          </div>
        </div>
      )
    },
    {
      title: "ゲームフロー",
      content: (
        <div className="space-y-4">
          <PhaseCard 
            icon="🌙" 
            phase="夜フェーズ (180秒)"
            description="各役職が能力を行使する時間"
            details={[
              "AI: プレイヤーを襲撃",
              "エンジニア: プレイヤーを調査", 
              "サイバーガード: プレイヤーを護衛"
            ]}
          />
          <PhaseCard 
            icon="🌅" 
            phase="朝フェーズ (60秒)"
            description="前夜の結果が発表される"
            details={[
              "襲撃や護衛の結果確認",
              "死亡者の発表"
            ]}
          />
          <PhaseCard 
            icon="💬" 
            phase="昼フェーズ (300秒)"
            description="自由議論の時間"
            details={[
              "テキスト・音声チャット可能",
              "情報を整理し疑わしい人を議論",
              "役職者の情報公開タイミングが重要"
            ]}
          />
          <PhaseCard 
            icon="🗳️" 
            phase="投票フェーズ (90秒)"
            description="追放者を決める投票"
            details={[
              "最多得票者が追放される",
              "同数の場合は決選投票"
            ]}
          />
        </div>
      )
    },
    {
      title: "勝利条件",
      content: (
        <div className="space-y-6">
          <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
            <h4 className="font-bold text-blue-300 mb-2">👥 人間陣営の勝利</h4>
            <p className="text-blue-100">すべてのAI陣営と第三陣営を排除する</p>
          </div>
          
          <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
            <h4 className="font-bold text-red-300 mb-2">🤖 AI陣営の勝利</h4>
            <p className="text-red-100">人間陣営の数をAI陣営以下にする</p>
          </div>
          
          <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/50">
            <h4 className="font-bold text-purple-300 mb-2">🎭 第三陣営の勝利</h4>
            <p className="text-purple-100">役職固有の条件を満たす</p>
          </div>

          <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/50">
            <h4 className="font-bold text-yellow-300 mb-2">💡 戦略のヒント</h4>
            <ul className="text-yellow-100 space-y-1">
              <li>• 人間は直感と論理的思考を組み合わせよう</li>
              <li>• AIの発言パターンや反応速度に注目</li>
              <li>• 役職者は情報公開のタイミングが重要</li>
              <li>• 疑心暗鬼に陥らず冷静に判断しよう</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTutorial = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-black/30 backdrop-blur-lg rounded-t-2xl p-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-4 transition-colors"
          >
            ← メインメニューに戻る
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">ゲームルール・チュートリアル</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-300">
              ステップ {currentStep + 1} / {tutorialSteps.length}
            </p>
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep ? 'bg-blue-500' : 
                    index < currentStep ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-black/20 backdrop-blur-lg p-8 min-h-[600px]">
          <h2 className="text-2xl font-bold text-white mb-6">
            {tutorialSteps[currentStep].title}
          </h2>
          <div className="text-gray-100">
            {tutorialSteps[currentStep].content}
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="bg-black/30 backdrop-blur-lg rounded-b-2xl p-6 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            前へ
          </button>

          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={finishTutorial}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              チュートリアル完了！
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface RoleCardProps {
  icon: string;
  name: string;
  description: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ icon, name, description }) => (
  <div className="flex items-start space-x-3 p-3 bg-black/20 rounded-lg">
    <span className="text-2xl">{icon}</span>
    <div>
      <h5 className="font-semibold text-white">{name}</h5>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  </div>
);

interface PhaseCardProps {
  icon: string;
  phase: string;
  description: string;
  details: string[];
}

const PhaseCard: React.FC<PhaseCardProps> = ({ icon, phase, description, details }) => (
  <div className="bg-black/20 p-4 rounded-lg">
    <div className="flex items-center space-x-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-bold text-white">{phase}</h4>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
    <ul className="text-sm text-gray-300 space-y-1 ml-11">
      {details.map((detail, index) => (
        <li key={index}>• {detail}</li>
      ))}
    </ul>
  </div>
);

export default TutorialPage;