import { InputForm } from "./InputForm";
import { Globe, Shield, Zap, Search, CheckCircle, AlertTriangle } from "lucide-react";

interface WelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string,
    model: string
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
}) => (
  <div className="flex flex-col items-center justify-center text-center px-4 flex-1 w-full max-w-4xl mx-auto gap-6">
    {/* ヘッダーセクション */}
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-blue-500/20 rounded-2xl">
          <Globe className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-100">
          Domain<span className="text-blue-400">Scout</span>
        </h1>
      </div>
      <p className="text-lg md:text-xl text-neutral-400 max-w-2xl">
        AI搭載のドメイン分析・調査エージェント。ドメインの可用性、セキュリティ、価値を包括的に評価します。
      </p>
    </div>

    {/* 機能グリッド */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
      <div className="bg-neutral-700/50 rounded-xl p-4 border border-neutral-600/50">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-neutral-200">可用性チェック</h3>
        </div>
        <p className="text-sm text-neutral-400">
          リアルタイムのドメイン可用性と登録状況を確認
        </p>
      </div>
      
      <div className="bg-neutral-700/50 rounded-xl p-4 border border-neutral-600/50">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-neutral-200">セキュリティ分析</h3>
        </div>
        <p className="text-sm text-neutral-400">
          包括的なセキュリティと信頼性の評価
        </p>
      </div>
      
      <div className="bg-neutral-700/50 rounded-xl p-4 border border-neutral-600/50">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h3 className="font-semibold text-neutral-200">パフォーマンス分析</h3>
        </div>
        <p className="text-sm text-neutral-400">
          速度、稼働時間、技術的パフォーマンスの測定
        </p>
      </div>
    </div>

    {/* クイック検索例 */}
    <div className="bg-neutral-700/30 rounded-xl p-4 border border-neutral-600/30 w-full max-w-2xl">
      <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
        <span>💡</span> こんなドメインを分析してみてください：
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <button
          onClick={() => handleSubmit("google.com を分析して", "medium", "gemini-2.5-flash-preview-04-17")}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 p-2 rounded-lg transition-all duration-200 text-left group"
          disabled={isLoading}
        >
          <CheckCircle className="h-3 w-3 text-green-400 group-hover:scale-110 transition-transform" />
          <span className="group-hover:translate-x-0.5 transition-transform">"google.com を分析して"</span>
        </button>
        <button
          onClick={() => handleSubmit("amazon.co.jp の安全性を確認", "medium", "gemini-2.5-flash-preview-04-17")}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 p-2 rounded-lg transition-all duration-200 text-left group"
          disabled={isLoading}
        >
          <AlertTriangle className="h-3 w-3 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="group-hover:translate-x-0.5 transition-transform">"amazon.co.jp の安全性を確認"</span>
        </button>
        <button
          onClick={() => handleSubmit("github.com のパフォーマンス", "medium", "gemini-2.5-flash-preview-04-17")}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 p-2 rounded-lg transition-all duration-200 text-left group"
          disabled={isLoading}
        >
          <Search className="h-3 w-3 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="group-hover:translate-x-0.5 transition-transform">"github.com のパフォーマンス"</span>
        </button>
        <button
          onClick={() => handleSubmit("新しいドメイン myawesomesite.com", "medium", "gemini-2.5-flash-preview-04-17")}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 p-2 rounded-lg transition-all duration-200 text-left group"
          disabled={isLoading}
        >
          <Zap className="h-3 w-3 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="group-hover:translate-x-0.5 transition-transform">"新しいドメイン myawesomesite.com"</span>
        </button>
      </div>
    </div>

    {/* 入力フォーム */}
    <div className="w-full mt-4">
      <InputForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={onCancel}
        hasHistory={false}
      />
    </div>
  </div>
);