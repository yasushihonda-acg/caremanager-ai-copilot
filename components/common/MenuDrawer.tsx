import React from 'react';
import { X, Type, RefreshCw, Printer, LogOut, Settings, FileText, User, Users, HelpCircle, Shield } from 'lucide-react';
import { AppSettings } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onReset: () => void;
  onLogout: () => void;
  onPrint: () => void;
  onHospitalSheet: () => void;
  onCareManagerSettings: () => void;
  onShowGuide: () => void;
  onShowHelp: () => void;
  onShowPrivacyPolicy: () => void;
  isAdmin?: boolean;
  onWhitelistManagement?: () => void;
}

export const MenuDrawer: React.FC<Props> = ({ isOpen, onClose, settings, onSettingsChange, onReset, onLogout, onPrint, onHospitalSheet, onCareManagerSettings, onShowGuide, onShowHelp, onShowPrivacyPolicy, isAdmin, onWhitelistManagement }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div className="relative w-80 bg-stone-50 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300 border-l border-stone-200">
        <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-stone-500" />
            メニュー
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <div className="space-y-6 flex-1">
          {/* Accessibility Settings */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="text-sm font-bold text-stone-500 uppercase mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" />
              表示設定
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-stone-700 font-medium">文字サイズ</span>
              <div className="flex bg-stone-100 rounded-lg p-1">
                <button
                  onClick={() => onSettingsChange({...settings, fontSize: 'normal'})}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                    settings.fontSize === 'normal' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'
                  }`}
                >
                  標準
                </button>
                <button
                  onClick={() => onSettingsChange({...settings, fontSize: 'large'})}
                  className={`px-3 py-1.5 rounded-md text-lg font-bold transition-all ${
                    settings.fontSize === 'large' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'
                  }`}
                >
                  大
                </button>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              ※ 「大」を選択すると、入力フォーム等の文字が読みやすくなります。
            </p>
          </div>

          {/* Actions */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
             <button
                onClick={() => {
                  onShowHelp();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-blue-100"
              >
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <span className="font-medium">使い方ガイド</span>
             </button>
             <button
                onClick={() => {
                  onShowGuide();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-sky-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-sky-100"
              >
                <HelpCircle className="w-5 h-5 text-sky-500" />
                <span className="font-medium">操作ガイド（ツアー）</span>
             </button>
             <button
                onClick={() => {
                  onCareManagerSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-indigo-100"
              >
                <User className="w-5 h-5 text-indigo-500" />
                <span className="font-medium">ケアマネ情報設定</span>
             </button>
             <button
                onClick={() => {
                  onPrint();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-blue-100"
              >
                <Printer className="w-5 h-5 text-blue-500" />
                <span className="font-medium">第1表・第2表 印刷プレビュー</span>
             </button>
             <button
                onClick={() => {
                  onHospitalSheet();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-green-100"
              >
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium">入院時情報連携シート</span>
             </button>
             <button
                onClick={() => {
                  onShowPrivacyPolicy();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-stone-100"
              >
                <Shield className="w-5 h-5 text-stone-500" />
                <span className="font-medium">プライバシーポリシー</span>
             </button>
             {isAdmin && onWhitelistManagement && (
               <button
                  onClick={() => {
                    onWhitelistManagement();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-lg text-stone-700 transition-colors border border-transparent hover:border-indigo-100"
                >
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium">ユーザー管理</span>
                  <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">Admin</span>
               </button>
             )}
             <button
                onClick={() => {
                  onReset();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg text-red-700 transition-colors border border-transparent hover:border-red-100"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-medium">デモデータの初期化</span>
             </button>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-200">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-4 text-stone-500 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
          <p className="text-center text-[10px] text-stone-400 mt-4">
            Version 1.2.2 (Hotfix)
          </p>
        </div>
      </div>
    </div>
  );
};
