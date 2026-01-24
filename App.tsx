import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Users, Menu, Sparkles, Info, AlertCircle, Plus, Trash2, Wand2, Loader2, ArrowDownCircle, Activity, Save, FolderOpen, ChevronDown, Check } from 'lucide-react';
import { CareLevel, User, CarePlan, AssessmentData, AppSettings, CareGoal, HospitalAdmissionSheet } from './types';
import { validateCarePlanDates } from './services/complianceService';
import { refineCareGoal, generateCarePlanDraft } from './services/geminiService';
import { LifeHistoryCard, MenuDrawer } from './components/common';
import { TouchAssessment } from './components/assessment';
import { LoginScreen } from './components/auth';
import { useAuth } from './contexts/AuthContext';
import { PrintPreview } from './components/careplan';
import { saveAssessment, listAssessments, getAssessment, deleteAssessment, AssessmentDocument, saveCarePlan } from './services/firebase';
import { MonitoringDiffView } from './components/monitoring';
import { SupportRecordForm, SupportRecordList } from './components/records';
import { HospitalAdmissionSheetView } from './components/documents';
import { generateHospitalAdmissionSheet, UserBasicInfo, CareManagerInfo } from './utils/hospitalAdmissionSheet';

// --- Mock Data ---
const MOCK_USER: User = {
  id: 'u1',
  name: '山田 太郎',
  kana: 'ヤマダ タロウ',
  birthDate: '1940-05-15',
  careLevel: CareLevel.CARE_2,
  address: '東京都世田谷区... (架空の住所)',
  medicalAlerts: ['ペースメーカー装着', '糖尿病(インスリン)'],
  lifeHistory: {
    hobbies: ['囲碁', '盆栽', 'クラシック音楽'],
    previousOccupation: '建築士',
    topicsToAvoid: ['戦争の話', '亡くなった妻の話'],
    importantMemories: '自分が設計した図書館が完成した時のこと。多くの子供たちが本を読んでいる姿を見て感動した。'
  }
};

const INITIAL_PLAN: CarePlan = {
  id: 'p1',
  userId: 'u1',
  status: 'draft',
  assessmentDate: '',
  draftDate: '',
  meetingDate: '',
  consentDate: '',
  deliveryDate: '',
  longTermGoal: '自宅での生活を続けたい',
  shortTermGoals: [
    { id: 'g1', content: '週2回デイサービスに通い、入浴を行う', status: 'in_progress' },
    { id: 'g2', content: '杖を使って近所の公園まで散歩する', status: 'in_progress' }
  ]
};

// Updated Initial Assessment matching 23 Items Structure
const INITIAL_ASSESSMENT: AssessmentData = {
  serviceHistory: '',
  healthStatus: '',
  pastHistory: '',
  skinCondition: '',
  oralHygiene: '',
  fluidIntake: '',
  adlTransfer: '',
  adlEating: '',
  adlToileting: '',
  adlBathing: '',
  adlDressing: '',
  iadlCooking: '',
  iadlShopping: '',
  iadlMoney: '',
  medication: '',
  cognition: '',
  communication: '',
  socialParticipation: '',
  residence: '',
  familySituation: '',
  maltreatmentRisk: '',
  environment: ''
};

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'assessment' | 'plan' | 'monitoring' | 'records'>('assessment');

  // Data State
  const [plan, setPlan] = useState<CarePlan>(INITIAL_PLAN);
  const [assessment, setAssessment] = useState<AssessmentData>(INITIAL_ASSESSMENT);

  // UI State
  const [validation, setValidation] = useState(validateCarePlanDates(plan));
  const [aiLoading, setAiLoading] = useState(false);
  const [draftingLoading, setDraftingLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ fontSize: 'normal', highContrast: false });
  const [newGoalText, setNewGoalText] = useState('');

  // Phase 7: Draft Prompt State
  const [draftPrompt, setDraftPrompt] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<{longTerm: string, shortTerms: string[]} | null>(null);

  // Phase 2: Assessment Persistence State
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [assessmentList, setAssessmentList] = useState<AssessmentDocument[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showAssessmentList, setShowAssessmentList] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Hospital Admission Sheet State
  const [showHospitalSheet, setShowHospitalSheet] = useState(false);
  const [hospitalSheet, setHospitalSheet] = useState<HospitalAdmissionSheet | null>(null);

  // Validation Effect
  useEffect(() => {
    setValidation(validateCarePlanDates(plan));
  }, [plan]);

  // Load assessment list on mount
  useEffect(() => {
    if (user) {
      loadAssessmentList();
    }
  }, [user]);

  // Clear save message after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const loadAssessmentList = async () => {
    if (!user) return;
    setIsLoadingList(true);
    try {
      const list = await listAssessments(user.uid);
      // Sort by date descending
      list.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setAssessmentList(list);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const assessmentId = currentAssessmentId || crypto.randomUUID();
      await saveAssessment(user.uid, assessmentId, {
        content: assessment as unknown as Record<string, string>,
        summary: '',
      });
      setCurrentAssessmentId(assessmentId);
      setSaveMessage({ type: 'success', text: '保存しました' });
      await loadAssessmentList();
    } catch (error) {
      console.error('Failed to save assessment:', error);
      setSaveMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadAssessment = async (assessmentId: string) => {
    if (!user) return;
    try {
      const doc = await getAssessment(user.uid, assessmentId);
      if (doc) {
        setAssessment(doc.content as unknown as AssessmentData);
        setCurrentAssessmentId(assessmentId);
        setShowAssessmentList(false);
        setSaveMessage({ type: 'success', text: '読み込みました' });
      }
    } catch (error) {
      console.error('Failed to load assessment:', error);
      setSaveMessage({ type: 'error', text: '読み込みに失敗しました' });
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!user) return;
    try {
      await deleteAssessment(user.uid, assessmentId);
      if (currentAssessmentId === assessmentId) {
        setCurrentAssessmentId(null);
        setAssessment(INITIAL_ASSESSMENT);
      }
      await loadAssessmentList();
      setSaveMessage({ type: 'success', text: '削除しました' });
    } catch (error) {
      console.error('Failed to delete assessment:', error);
      setSaveMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const handleNewAssessment = () => {
    setAssessment(INITIAL_ASSESSMENT);
    setCurrentAssessmentId(null);
    setShowAssessmentList(false);
  };

  // Hospital Admission Sheet handler
  const handleGenerateHospitalSheet = () => {
    // MOCK_USER から UserBasicInfo を生成
    const userBasicInfo: UserBasicInfo = {
      name: MOCK_USER.name,
      kana: MOCK_USER.kana,
      birthDate: MOCK_USER.birthDate,
      gender: '男', // MOCK_USER は男性
      address: MOCK_USER.address,
      phone: '03-XXXX-XXXX', // 仮データ
      careLevel: MOCK_USER.careLevel,
      certificationDate: '2024-04-01', // 仮データ
      certificationExpiry: '2025-03-31', // 仮データ
      insurerNumber: '131001', // 仮データ（東京都）
      insuredNumber: '0000000001', // 仮データ
    };

    // ケアマネ情報（暫定）
    const careManagerInfo: CareManagerInfo = {
      name: user?.displayName || 'ケアマネ太郎',
      office: 'デモ居宅介護支援事業所',
      phone: '03-0000-0000',
      fax: '03-0000-0001',
    };

    const sheet = generateHospitalAdmissionSheet(
      assessment,
      userBasicInfo,
      careManagerInfo,
      [], // emergencyContacts（将来対応）
      [], // currentServices（将来対応）
      {
        medicalAlerts: MOCK_USER.medicalAlerts,
      }
    );
    setHospitalSheet(sheet);
    setShowHospitalSheet(true);
  };

  // Care Plan save handler
  const handleSaveCarePlan = async () => {
    if (!user || !currentAssessmentId) {
      setSaveMessage({ type: 'error', text: 'アセスメントを先に保存してください' });
      return;
    }
    setIsSaving(true);
    try {
      const planId = plan.id || crypto.randomUUID();
      await saveCarePlan(user.uid, planId, {
        assessmentId: currentAssessmentId,
        status: plan.status as 'draft' | 'review' | 'consented' | 'active',
        longTermGoal: plan.longTermGoal,
        shortTermGoals: plan.shortTermGoals.map(g => ({
          id: g.id,
          content: g.content,
          status: g.status as 'not_started' | 'in_progress' | 'achieved' | 'discontinued',
        })),
      });
      setPlan(prev => ({ ...prev, id: planId }));
      setSaveMessage({ type: 'success', text: 'ケアプランを保存しました' });
    } catch (error) {
      console.error('Failed to save care plan:', error);
      setSaveMessage({ type: 'error', text: 'ケアプランの保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  const handleDateChange = (field: keyof CarePlan, value: string) => {
    setPlan(prev => ({ ...prev, [field]: value }));
  };

  const handleAiRefine = async () => {
    if (!plan.longTermGoal) return;
    setAiLoading(true);
    const refined = await refineCareGoal(plan.longTermGoal);
    setPlan(prev => ({ ...prev, longTermGoal: refined }));
    setAiLoading(false);
  };

  const handleAiDrafting = async () => {
    if (!draftPrompt.trim()) {
        console.warn("Prompt is empty");
        return;
    }
    setDraftingLoading(true);
    try {
        const result = await generateCarePlanDraft(assessment, draftPrompt);
        setGeneratedDraft({
            longTerm: result.longTermGoal,
            shortTerms: result.shortTermGoals
        });
    } catch (error) {
        console.error("Drafting Error:", error);
    } finally {
        setDraftingLoading(false);
    }
  };

  const applyDraft = () => {
    if (!generatedDraft) return;
    
    // FIX (v1.2.2): Removed window.confirm to support sandbox environment.
    const newGoals: CareGoal[] = generatedDraft.shortTerms.map(txt => ({
        id: Math.random().toString(36).substr(2, 9),
        content: txt,
        status: 'not_started'
    }));
    setPlan(prev => ({
        ...prev,
        longTermGoal: generatedDraft.longTerm,
        shortTermGoals: newGoals
    }));
    setGeneratedDraft(null);
    setDraftPrompt('');
  };

  const handleReset = () => {
    setPlan(INITIAL_PLAN);
    setAssessment(INITIAL_ASSESSMENT);
    setActiveTab('assessment');
  };

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    const newGoal: CareGoal = {
        id: Math.random().toString(36).substr(2, 9),
        content: newGoalText,
        status: 'in_progress'
    };
    setPlan(prev => ({
        ...prev,
        shortTermGoals: [...prev.shortTermGoals, newGoal]
    }));
    setNewGoalText('');
  };

  const handleDeleteGoal = (id: string) => {
    // FIX (v1.2.2): Removed window.confirm to support sandbox environment.
    setPlan(prev => ({
        ...prev,
        shortTermGoals: prev.shortTermGoals.filter(g => g.id !== id)
    }));
  };

  // Determine base font size class based on settings
  const baseFontSize = appSettings.fontSize === 'large' ? 'text-lg' : 'text-base';

  return (
    <div className={`min-h-screen bg-stone-100 font-sans pb-20 md:pb-0 text-stone-800 ${baseFontSize}`}>
      
      {/* Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
        onReset={handleReset}
        onLogout={logout}
        onPrint={() => setShowPrintPreview(true)}
        onHospitalSheet={handleGenerateHospitalSheet}
      />

      {/* Print Preview */}
      <PrintPreview
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        user={MOCK_USER}
        plan={plan}
        assessment={assessment}
      />

      {/* Hospital Admission Sheet */}
      {showHospitalSheet && hospitalSheet && (
        <div className="fixed inset-0 z-[200] bg-white overflow-auto">
          <HospitalAdmissionSheetView
            sheet={hospitalSheet}
            onClose={() => setShowHospitalSheet(false)}
          />
        </div>
      )}

      {/* DEMO DISCLAIMER BANNER */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-xs md:text-sm text-amber-900 flex items-center justify-center gap-2 text-center sticky top-0 z-[60]">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          <strong>【デモ環境】</strong> これは開発デモンストレーション用のアプリケーションです。<br className="md:hidden"/>
          表示される個人情報（氏名、住所等）はすべて<strong>架空・匿名化</strong>されたものであり、実在の人物とは関係ありません。
        </p>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-[var(--banner-height,40px)] z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
               <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-bold text-lg text-stone-800 tracking-tight">ケアマネの<span className="text-blue-600">ミカタ</span></h1>
              <span className="text-[10px] text-stone-400 font-mono tracking-wider">DEMO EDITION</span>
            </div>
            <span className="hidden sm:inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 border border-orange-200">
              Sample Data Only
            </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user.displayName || user.email}</p>
                <p className="text-xs text-stone-500">ログイン中</p>
             </div>
             <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
             >
               <Menu className="w-6 h-6 text-stone-600" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Medical Risk Alert - High Visibility */}
        {MOCK_USER.medicalAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">医療アラート (Medical Alerts)</h3>
              <div className="flex flex-wrap gap-2">
                {MOCK_USER.medicalAlerts.map((alert, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-white text-red-700 border border-red-200 shadow-sm">
                    {alert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* User Context Card */}
        <LifeHistoryCard user={MOCK_USER} />

        {/* Legal Defense Status (Banner) */}
        {!validation.isValid && activeTab === 'plan' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-pulse">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800 text-sm">法的整合性エラー (運営指導リスク)</h3>
                <ul className="mt-1 list-disc list-inside text-xs text-red-700">
                  {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Mobile optimized) */}
        <div className="flex bg-white rounded-xl shadow-sm p-1 border border-stone-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'assessment', icon: FileText, label: 'アセスメント' },
            { id: 'plan', icon: ShieldCheck, label: 'ケアプラン' },
            { id: 'monitoring', icon: Activity, label: 'モニタリング' },
            { id: 'records', icon: Users, label: '支援経過' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                ${activeTab === tab.id 
                  ? 'bg-stone-800 text-white shadow-md' 
                  : 'text-stone-500 hover:bg-stone-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Views */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 min-h-[50vh]">
          
          {/* VIEW: Assessment */}
          {activeTab === 'assessment' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-stone-800 mb-1">アセスメント (課題分析)</h2>
                    <p className="text-sm text-stone-500">
                      23項目完全準拠 (2025/11 更新分)
                      {currentAssessmentId && <span className="ml-2 text-blue-600">• 編集中</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNewAssessment}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新規
                    </button>
                    <button
                      onClick={handleSaveAssessment}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      保存
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowAssessmentList(!showAssessmentList);
                          if (!showAssessmentList) loadAssessmentList();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                        履歴
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAssessmentList ? 'rotate-180' : ''}`} />
                      </button>
                      {showAssessmentList && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-stone-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                          {isLoadingList ? (
                            <div className="p-4 text-center">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-stone-400" />
                            </div>
                          ) : assessmentList.length === 0 ? (
                            <div className="p-4 text-sm text-stone-500 text-center">
                              保存済みのアセスメントはありません
                            </div>
                          ) : (
                            <ul>
                              {assessmentList.map((item) => (
                                <li
                                  key={item.id}
                                  className={`flex items-center justify-between p-3 hover:bg-stone-50 border-b border-stone-100 last:border-0 ${
                                    currentAssessmentId === item.id ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <button
                                    onClick={() => handleLoadAssessment(item.id)}
                                    className="flex-1 text-left"
                                  >
                                    <p className="text-sm font-medium text-stone-800">
                                      {item.date.toDate().toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                    {currentAssessmentId === item.id && (
                                      <span className="text-xs text-blue-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        編集中
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAssessment(item.id)}
                                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Save Message */}
                {saveMessage && (
                  <div
                    className={`mt-3 p-2 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2 ${
                      saveMessage.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {saveMessage.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {saveMessage.text}
                  </div>
                )}
              </div>
              <TouchAssessment
                data={assessment}
                onChange={(k, v) => setAssessment(prev => ({...prev, [k]: v}))}
              />
            </div>
          )}

          {/* VIEW: Care Plan */}
          {activeTab === 'plan' && (
            <div className="animate-in fade-in duration-300 space-y-8">
              {/* Header with Save Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <h2 className="text-xl font-bold text-stone-800">ケアプラン作成</h2>
                  <p className="text-sm text-stone-500">
                    第1表・第2表の作成
                    {!currentAssessmentId && (
                      <span className="ml-2 text-amber-600">• アセスメントを先に保存してください</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleSaveCarePlan}
                  disabled={isSaving || !currentAssessmentId}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  ケアプランを保存
                </button>
              </div>

              {/* Save Message in Plan Tab */}
              {saveMessage && activeTab === 'plan' && (
                <div
                  className={`p-2 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2 ${
                    saveMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {saveMessage.text}
                </div>
              )}

              {/* 第1表: 日付管理 */}
              <div>
                <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">第1表</span>
                    工程管理 (日付整合性)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">1. アセスメント実施日</label>
                    <input 
                      type="date" 
                      className={`w-full p-2 border rounded-lg text-stone-900 ${!plan.assessmentDate ? 'border-red-300 bg-red-50' : 'bg-white border-stone-300'}`}
                      value={plan.assessmentDate} 
                      onChange={e => handleDateChange('assessmentDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">2. 原案作成日</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900"
                      value={plan.draftDate} 
                      onChange={e => handleDateChange('draftDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">3. 担当者会議開催日</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900"
                      value={plan.meetingDate} 
                      onChange={e => handleDateChange('meetingDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">4. 利用者同意日</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900"
                      value={plan.consentDate} 
                      onChange={e => handleDateChange('consentDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Phase 7: AI Plan Drafter */}
              <div className="border-t pt-6 border-stone-100">
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-4 rounded-xl border border-violet-100 mb-6">
                    <h3 className="font-bold text-violet-900 flex items-center gap-2 mb-2">
                        <Wand2 className="w-5 h-5" />
                        AIケアプラン自動作成 (第2表ドラフト)
                    </h3>
                    <p className="text-xs text-violet-700 mb-3">
                        アセスメントの課題分析に基づき、目標案を提案します。<br/>
                        ケアマネジャーの方針（意図）を入力して作成ボタンを押してください。
                    </p>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            className="flex-1 p-2 border border-violet-200 rounded-lg text-sm bg-white text-stone-900"
                            placeholder="例: 家族の負担を減らしつつ、本人の残存機能を活かしたい..."
                            value={draftPrompt}
                            onChange={(e) => setDraftPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); 
                                }
                            }}
                        />
                        <button 
                            onClick={handleAiDrafting}
                            disabled={draftingLoading}
                            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-violet-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {draftingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            作成
                        </button>
                    </div>
                    {/* Generated Draft Preview */}
                    {generatedDraft && (
                        <div className="mt-4 bg-white p-4 rounded-lg border border-violet-200 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-bold text-violet-800 text-sm mb-2 border-b border-violet-100 pb-1">生成されたドラフト案</h4>
                            <div className="space-y-3 mb-4">
                                <div>
                                    <span className="text-xs font-bold text-stone-500 block">長期目標</span>
                                    <p className="text-sm font-medium text-stone-800">{generatedDraft.longTerm}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-stone-500 block">短期目標</span>
                                    <ul className="list-disc list-inside text-sm text-stone-800 pl-1">
                                        {generatedDraft.shortTerms.map((g, i) => <li key={i}>{g}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setGeneratedDraft(null)}
                                    className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded"
                                >
                                    キャンセル
                                </button>
                                <button 
                                    onClick={applyDraft}
                                    className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded shadow-sm hover:bg-violet-700 flex items-center gap-1"
                                >
                                    <ArrowDownCircle className="w-3 h-3" />
                                    入力欄に反映
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              </div>

              {/* 第2表: 目標設定 */}
              <div className="border-t pt-6 border-stone-100">
                <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">第2表</span>
                    支援目標
                </h2>
                
                {/* 長期目標 */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-stone-700 text-sm">長期目標 (生活全体の解決課題)</h3>
                    <button 
                        onClick={handleAiRefine}
                        disabled={aiLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Sparkles className="w-3 h-3" />
                        {aiLoading ? 'AI思考中...' : '自立支援視点で校正'}
                    </button>
                    </div>
                    <textarea 
                    className="w-full p-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[80px] bg-white text-stone-900"
                    placeholder="例：自宅での生活を続けたい、再び畑仕事をしたい..."
                    value={plan.longTermGoal}
                    onChange={(e) => handleDateChange('longTermGoal', e.target.value)}
                    />
                </div>

                {/* 短期目標 */}
                <div>
                    <h3 className="font-bold text-stone-700 text-sm mb-2">短期目標 (具体的な取り組み)</h3>
                    <div className="space-y-3 mb-4">
                        {plan.shortTermGoals.map((goal) => (
                            <div key={goal.id} className="flex items-start gap-3 bg-white border border-stone-200 p-3 rounded-lg shadow-sm">
                                <div className="mt-1 bg-blue-100 text-blue-600 rounded-full p-1">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-stone-800 font-medium">{goal.content}</p>
                                    <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded mt-1 inline-block">
                                        ステータス: {goal.status === 'in_progress' ? '取組中' : '達成'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="text-stone-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {/* 新規追加フォーム */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border border-stone-300 rounded-lg bg-white text-stone-900 placeholder:text-stone-400"
                            placeholder="新しい短期目標を入力..."
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                        />
                        <button 
                            onClick={handleAddGoal}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            追加
                        </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Monitoring */}
          {activeTab === 'monitoring' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-stone-800 mb-1">モニタリング記録</h2>
                <p className="text-sm text-stone-500">
                  月次モニタリング・目標達成状況の評価
                </p>
              </div>
              <MonitoringDiffView
                userId={user?.uid || MOCK_USER.id}
                carePlanId={plan.id}
                goals={plan.shortTermGoals}
                onSave={(recordId) => {
                  setSaveMessage({ type: 'success', text: 'モニタリング記録を保存しました' });
                  setTimeout(() => setSaveMessage(null), 3000);
                }}
              />
            </div>
          )}

          {/* VIEW: Support Records */}
          {activeTab === 'records' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-stone-800 mb-1">支援経過記録（第5表）</h2>
                <p className="text-sm text-stone-500">
                  日々の支援経過を記録・管理
                </p>
              </div>
              <div className="space-y-6">
                <SupportRecordForm
                  userId={user?.uid || MOCK_USER.id}
                  carePlanId={plan.id}
                  onSave={(recordId) => {
                    setSaveMessage({ type: 'success', text: '支援経過記録を保存しました' });
                    setTimeout(() => setSaveMessage(null), 3000);
                  }}
                />
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="text-lg font-bold text-stone-800 mb-4">記録一覧</h3>
                  <SupportRecordList
                    userId={user?.uid || MOCK_USER.id}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto p-6 text-center text-stone-400 text-xs">
        <p className="font-medium mb-1">CareFlow Master 2025 (Demo Build)</p>
        <p>※ 本システムは運営指導対策およびユーザビリティ検証のためのプロトタイプです。<br/>臨床現場での使用前に、セキュリティおよび運用規定の確認が必要です。</p>
      </footer>
      
    </div>
  );
}
