import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, FileText, Users, Menu, Sparkles, Info, AlertCircle, Plus, Trash2, Wand2, Loader2, ArrowDownCircle, Activity, Save, FolderOpen, ChevronDown, Check, History } from 'lucide-react';
import { CareLevel, CarePlan, CarePlanNeed, AssessmentData, AppSettings, CareGoal, HospitalAdmissionSheet } from './types';
import type { Client } from './types';
import { validateCarePlanFull } from './services/complianceService';
import { refineCareGoal, generateCarePlanV2 } from './services/geminiService';
import type { CarePlanV2Response } from './services/geminiService';
import { LifeHistoryCard, MenuDrawer, FeedbackFAB, OnboardingTour } from './components/common';
import { HelpPage } from './components/help';
import { TouchAssessment } from './components/assessment';
import { LoginScreen } from './components/auth';
import { useAuth } from './contexts/AuthContext';
import { useClient } from './contexts/ClientContext';
import { PrintPreview, CarePlanSelector, CarePlanStatusBar, CarePlanV2Editor, WeeklyScheduleEditor } from './components/careplan';
import { saveAssessment, listAssessments, getAssessment, deleteAssessment, AssessmentDocument, logUsage, saveCareManagerProfile, getCareManagerProfile, CareManagerProfileData, listCarePlanHistory, CarePlanHistoryEntry, resetDemoData } from './services/firebase';
import { useCarePlan } from './hooks/useCarePlan';
import { useOnboarding } from './hooks/useOnboarding';
import { CareManagerSettingsModal } from './components/settings/CareManagerSettingsModal';
import { MonitoringDiffView, MonitoringRecordList, MonitoringMonthlyStatus } from './components/monitoring';
import { SupportRecordForm, SupportRecordList } from './components/records';
import { HospitalAdmissionSheetView } from './components/documents';
import { ServiceMeetingForm, ServiceMeetingList } from './components/meeting';
import { ClientListView, ClientForm, ClientContextBar } from './components/clients';
import { DashboardView } from './components/dashboard';
import { generateHospitalAdmissionSheet, UserBasicInfo, CareManagerInfo } from './utils/hospitalAdmissionSheet';

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

type ClientViewMode = 'dashboard' | 'list' | 'form' | 'selected';

export default function App() {
  const { user, loading, logout, isDemoUser } = useAuth();
  const { selectedClient, selectClient, clearSelectedClient } = useClient();
  const { showTour, completeTour, reopenTour } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'assessment' | 'plan' | 'monitoring' | 'records' | 'meeting'>('assessment');

  // Client management state
  const [clientViewMode, setClientViewMode] = useState<ClientViewMode>('dashboard');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // CarePlan hook（Firestore 読み書き・履歴管理）
  const {
    plan,
    planList,
    isLoading: isCarePlanLoading,
    isSaving: isCarePlanSaving,
    saveMessage: carePlanSaveMessage,
    loadPlan,
    savePlan,
    createNewPlan,
    updatePlan,
  } = useCarePlan(user?.uid ?? null, selectedClient?.id ?? null);

  // Data State
  const [assessment, setAssessment] = useState<AssessmentData>(INITIAL_ASSESSMENT);

  // UI State
  const [validation, setValidation] = useState(validateCarePlanFull(plan));
  const [aiLoading, setAiLoading] = useState(false);
  const [draftingLoading, setDraftingLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ fontSize: 'normal', highContrast: false });
  const [newGoalText, setNewGoalText] = useState('');

  // Phase 7: Draft Prompt State
  const [draftPrompt, setDraftPrompt] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<CarePlanV2Response | null>(null);

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

  // ケアマネプロファイル State
  const [careManagerProfile, setCareManagerProfile] = useState<CareManagerProfileData>({ name: '', office: '', phone: '', fax: '' });
  const [showCareManagerSettings, setShowCareManagerSettings] = useState(false);

  // Monitoring State
  const [monitoringMode, setMonitoringMode] = useState<'list' | 'edit'>('list');
  const [editingMonitoringId, setEditingMonitoringId] = useState<string | null>(null);

  // Care Plan History State
  const [carePlanHistory, setCarePlanHistory] = useState<CarePlanHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Demo Reset State
  const [isDemoResetting, setIsDemoResetting] = useState(false);

  // Dirty state tracking（未保存変更）
  const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());
  const markDirty = useCallback((tab: string) =>
    setDirtyTabs(prev => new Set(prev).add(tab)), []);
  const clearDirty = useCallback((tab: string) =>
    setDirtyTabs(prev => { const s = new Set(prev); s.delete(tab); return s; }), []);

  // Sync clientViewMode with selectedClient
  useEffect(() => {
    if (selectedClient) {
      setClientViewMode('selected');
      // Reset assessment/UI state for new client（plan は useCarePlan フックが自動リセット）
      setAssessment(INITIAL_ASSESSMENT);
      setCurrentAssessmentId(null);
      setActiveTab('assessment');
      setMonitoringMode('list');
      setEditingMonitoringId(null);
      setDirtyTabs(new Set());
    } else if (clientViewMode === 'selected') {
      setClientViewMode('dashboard');
    }
  }, [selectedClient]);

  // Validation Effect
  useEffect(() => {
    setValidation(validateCarePlanFull(plan));
  }, [plan]);

  // ケアマネプロファイル読み込み
  useEffect(() => {
    if (!user) return;
    getCareManagerProfile(user.uid).then(profile => {
      if (profile) setCareManagerProfile(profile);
    }).catch(() => {/* プロファイル未設定時は初期値のまま */});
  }, [user?.uid]);

  // Load assessment list when client selected
  useEffect(() => {
    if (user && selectedClient) {
      loadAssessmentList();
    }
  }, [user, selectedClient]);

  // Clear save message after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // ブラウザ離脱警告（未保存変更あり時）
  useEffect(() => {
    if (dirtyTabs.size === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyTabs.size]);

  // ケアプラン保存成功時に dirty クリア
  useEffect(() => {
    if (carePlanSaveMessage?.type === 'success') {
      clearDirty('plan');
    }
  }, [carePlanSaveMessage]);

  const loadAssessmentList = async () => {
    if (!user || !selectedClient) return;
    setIsLoadingList(true);
    try {
      const list = await listAssessments(user.uid, selectedClient.id);
      // Sort by date descending
      list.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setAssessmentList(list);
    } catch (error) {
      console.error('Failed to load assessments:', error);
      setSaveMessage({ type: 'error', text: 'アセスメント一覧の読み込みに失敗しました' });
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!user || !selectedClient) return;
    setIsSaving(true);
    try {
      const assessmentId = currentAssessmentId || crypto.randomUUID();
      await saveAssessment(user.uid, selectedClient.id, assessmentId, {
        content: assessment as unknown as Record<string, string>,
        summary: '',
      });
      setCurrentAssessmentId(assessmentId);
      setSaveMessage({ type: 'success', text: '保存しました' });
      clearDirty('assessment');
      await loadAssessmentList();
    } catch (error) {
      console.error('Failed to save assessment:', error);
      setSaveMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // タブ切替（未保存確認付き）
  const handleTabSwitch = useCallback((tab: typeof activeTab) => {
    if (tab !== activeTab && dirtyTabs.has(activeTab)) {
      if (!confirm('保存されていない変更があります。このタブを離れますか？変更は失われます。')) return;
      clearDirty(activeTab);
    }
    setActiveTab(tab);
  }, [activeTab, dirtyTabs, clearDirty]);

  // ケアプラン更新（dirty マーク付き）
  const handleUpdatePlan = useCallback((updates: Partial<CarePlan>) => {
    updatePlan(updates);
    markDirty('plan');
  }, [updatePlan, markDirty]);

  const handleLoadAssessment = async (assessmentId: string) => {
    if (!user || !selectedClient) return;
    try {
      const doc = await getAssessment(user.uid, selectedClient.id, assessmentId);
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
    if (!user || !selectedClient) return;
    try {
      await deleteAssessment(user.uid, selectedClient.id, assessmentId);
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
    if (!selectedClient) return;

    const userBasicInfo: UserBasicInfo = {
      name: selectedClient.name,
      kana: selectedClient.kana,
      birthDate: selectedClient.birthDate,
      gender: selectedClient.gender,
      address: selectedClient.address,
      phone: selectedClient.phone || '未登録',
      careLevel: selectedClient.careLevel as CareLevel,
      certificationDate: selectedClient.certificationDate || '',
      certificationExpiry: selectedClient.certificationExpiry || '',
      insurerNumber: selectedClient.insurerNumber || '',
      insuredNumber: selectedClient.insuredNumber || '',
    };

    // ケアマネ情報（Firestoreプロファイルから）
    const careManagerInfo: CareManagerInfo = {
      name: careManagerProfile.name || user?.displayName || '（担当者未設定）',
      office: careManagerProfile.office || '（事業所未設定）',
      phone: careManagerProfile.phone || '',
      fax: careManagerProfile.fax || '',
    };

    const sheet = generateHospitalAdmissionSheet(
      assessment,
      userBasicInfo,
      careManagerInfo,
      [], // emergencyContacts（将来対応）
      [], // currentServices（将来対応）
      {
        medicalAlerts: selectedClient.medicalAlerts,
      }
    );
    setHospitalSheet(sheet);
    setShowHospitalSheet(true);
  };

  // Care Plan save handler → useCarePlan フックに委譲

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
    handleUpdatePlan({ [field]: value } as Partial<CarePlan>);
  };

  const handleAiRefine = async () => {
    if (!plan.longTermGoal) return;
    setAiLoading(true);
    try {
      const { refinedGoal, wasRefined } = await refineCareGoal(plan.longTermGoal);
      if (wasRefined) {
        handleUpdatePlan({ longTermGoal: refinedGoal });
      }
    } catch (error: any) {
      console.error('AI Refine Error:', error);
      setSaveMessage({ type: 'error', text: 'AI推敲に失敗しました。再度お試しください' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiDrafting = async () => {
    if (!draftPrompt.trim()) {
      console.warn("Prompt is empty");
      return;
    }
    setDraftingLoading(true);
    try {
      const result = await generateCarePlanV2(assessment, draftPrompt);
      if (user) logUsage(user.uid, 'generate_careplan');
      setGeneratedDraft(result);
    } catch (error) {
      console.error("Drafting Error:", error);
      setSaveMessage({ type: 'error', text: 'AIケアプラン作成に失敗しました。再度お試しください' });
    } finally {
      setDraftingLoading(false);
    }
  };

  const applyDraft = () => {
    if (!generatedDraft) return;

    // V2 needs[] → CarePlanNeed[] に変換（IDを付与）
    const newNeeds: CarePlanNeed[] = generatedDraft.needs.map(n => ({
      id: crypto.randomUUID(),
      content: n.content,
      longTermGoal: n.longTermGoal,
      shortTermGoals: n.shortTermGoals.map(txt => ({
        id: crypto.randomUUID(),
        content: txt,
        status: 'not_started' as const,
      })),
      services: n.services.map(s => ({
        id: crypto.randomUUID(),
        content: s.content,
        type: s.type,
        frequency: s.frequency,
      })),
    }));

    // V1互換: longTermGoal = needs[0].longTermGoal
    const v1LongTerm = newNeeds.length > 0 ? newNeeds[0].longTermGoal : generatedDraft.longTermGoal;
    // V1互換: shortTermGoals = 全needsのshortTermGoalsをフラット化
    const v1ShortTerms: CareGoal[] = newNeeds.flatMap(n => n.shortTermGoals);

    handleUpdatePlan({
      longTermGoal: v1LongTerm,
      shortTermGoals: v1ShortTerms,
      needs: newNeeds,
      totalDirectionPolicy: generatedDraft.totalDirectionPolicy,
    });
    setGeneratedDraft(null);
    setDraftPrompt('');
  };

  const handleReset = () => {
    createNewPlan();
    setAssessment(INITIAL_ASSESSMENT);
    setActiveTab('assessment');
  };

  const handleDemoReset = async () => {
    if (!confirm('デモデータをリセットしますか？現在の変更はすべて失われます。')) return;
    setIsDemoResetting(true);
    try {
      await resetDemoData();
      clearSelectedClient();
      setClientViewMode('dashboard');
      setSaveMessage({ type: 'success', text: 'デモデータをリセットしました。ページを再読み込みしてください。' });
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setSaveMessage({ type: 'error', text: 'リセットに失敗しました。再度お試しください。' });
    } finally {
      setIsDemoResetting(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    const newGoal: CareGoal = {
        id: Math.random().toString(36).substr(2, 9),
        content: newGoalText,
        status: 'in_progress'
    };
    handleUpdatePlan({ shortTermGoals: [...plan.shortTermGoals, newGoal] });
    setNewGoalText('');
  };

  const handleDeleteGoal = (id: string) => {
    handleUpdatePlan({ shortTermGoals: plan.shortTermGoals.filter(g => g.id !== id) });
  };

  const handleBackToList = () => {
    clearSelectedClient();
    setClientViewMode('dashboard');
    setEditingClient(null);
  };

  // Determine base font size class based on settings
  const baseFontSize = appSettings.fontSize === 'large' ? 'text-lg' : 'text-base';

  return (
    <div className={`min-h-screen bg-stone-100 font-sans pb-4 md:pb-0 text-stone-800 ${baseFontSize}`}>

      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showTour} onClose={completeTour} />

      {/* Help Page */}
      {isHelpOpen && <HelpPage onClose={() => setIsHelpOpen(false)} />}

      {/* Care Manager Settings Modal */}
      <CareManagerSettingsModal
        isOpen={showCareManagerSettings}
        onClose={() => setShowCareManagerSettings(false)}
        initialData={careManagerProfile}
        onSave={async (data) => {
          await saveCareManagerProfile(user.uid, data);
          setCareManagerProfile(data);
        }}
      />

      {/* Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
        onReset={handleReset}
        onLogout={logout}
        onPrint={() => selectedClient && setShowPrintPreview(true)}
        onHospitalSheet={() => selectedClient && handleGenerateHospitalSheet()}
        onCareManagerSettings={() => setShowCareManagerSettings(true)}
        onShowGuide={reopenTour}
        onShowHelp={() => setIsHelpOpen(true)}
      />

      {/* Print Preview */}
      {selectedClient && (
        <PrintPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          user={selectedClient}
          plan={plan}
          assessment={assessment}
          careManagerInfo={careManagerProfile}
        />
      )}

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
        {isDemoUser && (
          <button
            onClick={handleDemoReset}
            disabled={isDemoResetting}
            className="ml-2 flex-shrink-0 px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isDemoResetting ? 'リセット中...' : 'データリセット'}
          </button>
        )}
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

      {/* Client Context Bar - shows when a client is selected */}
      {selectedClient && clientViewMode === 'selected' && (
        <ClientContextBar
          client={selectedClient}
          onBack={handleBackToList}
          onEdit={() => {
            setEditingClient(selectedClient);
            setClientViewMode('form');
          }}
        />
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        {/* Dashboard View - デフォルトランディング画面 */}
        {clientViewMode === 'dashboard' && !selectedClient && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <DashboardView
              onSelectClient={(id) => selectClient(id)}
              onViewAllClients={() => setClientViewMode('list')}
            />
          </div>
        )}

        {/* Client List View - shown when no client is selected */}
        {clientViewMode === 'list' && !selectedClient && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <ClientListView
              onNewClient={() => {
                setEditingClient(null);
                setClientViewMode('form');
              }}
              onEditClient={(client) => {
                setEditingClient(client);
                setClientViewMode('form');
              }}
            />
          </div>
        )}

        {/* Client Form - shown when creating/editing a client */}
        {clientViewMode === 'form' && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <ClientForm
              existingClient={editingClient}
              onComplete={() => {
                setEditingClient(null);
                if (selectedClient) {
                  setClientViewMode('selected');
                } else {
                  setClientViewMode('list');
                }
              }}
              onCancel={() => {
                setEditingClient(null);
                if (selectedClient) {
                  setClientViewMode('selected');
                } else {
                  setClientViewMode('list');
                }
              }}
            />
          </div>
        )}

        {/* Main App Content - shown when a client is selected */}
        {selectedClient && clientViewMode === 'selected' && (
          <>
            {/* Medical Risk Alert - High Visibility */}
            {selectedClient.medicalAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">医療アラート (Medical Alerts)</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.medicalAlerts.map((alert, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-white text-red-700 border border-red-200 shadow-sm">
                        {alert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User Context Card */}
            <LifeHistoryCard user={selectedClient} />

            {/* Legal Defense Status (Error Banner) */}
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

            {/* Warnings Banner (ニーズ整合性など) */}
            {validation.warnings.length > 0 && activeTab === 'plan' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-amber-800 text-sm">整合性チェック（推奨事項）</h3>
                    <ul className="mt-1 list-disc list-inside text-xs text-amber-700 space-y-0.5">
                      {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
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
                { id: 'records', icon: FileText, label: '支援経過' },
                { id: 'meeting', icon: Users, label: '担当者会議' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'bg-stone-800 text-white shadow-md'
                      : 'text-stone-500 hover:bg-stone-50'}`}
                >
                  <div className="relative">
                    <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
                    {dirtyTabs.has(tab.id) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                    )}
                  </div>
                  <span className="hidden sm:inline">
                    {dirtyTabs.has(tab.id) ? `● ${tab.label}` : tab.label}
                  </span>
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
                                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded"
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
                    onChange={(k, v) => { setAssessment(prev => ({...prev, [k]: v})); markDirty('assessment'); }}
                  />
                </div>
              )}

              {/* VIEW: Care Plan */}
              {activeTab === 'plan' && (
                <div className="animate-in fade-in duration-300 space-y-8">
                  {/* Header with Save Button */}
                  <div className="flex flex-col gap-3 pb-4 border-b border-stone-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-stone-800">ケアプラン作成</h2>
                        <p className="text-sm text-stone-500">
                          第1表・第2表・第3表の作成
                          {!currentAssessmentId && (
                            <span className="ml-2 text-amber-600">• アセスメントを先に保存してください</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => savePlan(currentAssessmentId)}
                        disabled={isCarePlanSaving || !currentAssessmentId}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCarePlanSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        ケアプランを保存
                      </button>
                    </div>
                    {/* プラン履歴セレクタ */}
                    <CarePlanSelector
                      planList={planList}
                      currentPlanId={plan.id}
                      isLoading={isCarePlanLoading}
                      onSelect={loadPlan}
                      onCreateNew={createNewPlan}
                    />
                    {/* ステータスバー */}
                    <CarePlanStatusBar
                      status={plan.status}
                      onAdvance={(newStatus) => handleUpdatePlan({ status: newStatus })}
                    />
                  </div>

                  {/* Save Message in Plan Tab */}
                  {carePlanSaveMessage && (
                    <div
                      className={`p-2 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2 ${
                        carePlanSaveMessage.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {carePlanSaveMessage.type === 'success' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {carePlanSaveMessage.text}
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

                  {/* 第1表: 本人・家族等の意向 */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase block mb-1">本人の意向</label>
                      <textarea
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900 min-h-[60px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：自宅での生活を続けたい、好きな趣味を続けたい..."
                        value={plan.userIntention ?? ''}
                        onChange={e => handleUpdatePlan({ userIntention: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase block mb-1">家族等の意向</label>
                      <textarea
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-900 min-h-[60px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：無理せず安全に過ごしてほしい、家族の負担を減らしたい..."
                        value={plan.familyIntention ?? ''}
                        onChange={e => handleUpdatePlan({ familyIntention: e.target.value })}
                      />
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
                        {/* Generated Draft Preview (V2) */}
                        {generatedDraft && (
                            <div className="mt-4 bg-white p-4 rounded-lg border border-violet-200 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-bold text-violet-800 text-sm mb-3 border-b border-violet-100 pb-1">生成されたドラフト案（第2表）</h4>

                                {/* 総合的な援助の方針 */}
                                {generatedDraft.totalDirectionPolicy && (
                                    <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <span className="text-xs font-bold text-blue-700 block mb-1">総合的な援助の方針</span>
                                        <p className="text-sm text-blue-900">{generatedDraft.totalDirectionPolicy}</p>
                                    </div>
                                )}

                                {/* ニーズ別カード */}
                                <div className="space-y-3 mb-4">
                                    {generatedDraft.needs.map((need, idx) => (
                                        <div key={idx} className="border border-stone-200 rounded-lg overflow-hidden">
                                            <div className="bg-stone-50 px-3 py-2 flex items-center gap-2">
                                                <span className="text-xs font-bold text-white bg-violet-600 px-2 py-0.5 rounded-full">
                                                    ニーズ{idx + 1}
                                                </span>
                                                <span className="text-sm font-medium text-stone-800">{need.content}</span>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <div>
                                                    <span className="text-xs font-bold text-stone-500">長期目標</span>
                                                    <p className="text-sm text-stone-800">{need.longTermGoal}</p>
                                                </div>
                                                {need.shortTermGoals.length > 0 && (
                                                    <div>
                                                        <span className="text-xs font-bold text-stone-500">短期目標</span>
                                                        <ul className="list-disc list-inside text-sm text-stone-700 pl-1">
                                                            {need.shortTermGoals.map((g, i) => <li key={i}>{g}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {need.services.length > 0 && (
                                                    <div>
                                                        <span className="text-xs font-bold text-stone-500">サービス内容</span>
                                                        <ul className="text-xs text-stone-600 mt-0.5 space-y-0.5">
                                                            {need.services.map((s, i) => (
                                                                <li key={i} className="flex gap-2">
                                                                    <span className="text-violet-600 font-medium">[{s.type}]</span>
                                                                    {s.content}
                                                                    {s.frequency && <span className="text-stone-400">（{s.frequency}）</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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

                    {plan.needs && plan.needs.length > 0 ? (
                      <CarePlanV2Editor plan={plan} onUpdatePlan={handleUpdatePlan} />
                    ) : (
                      <>
                        {/* V1: フラットレイアウト */}
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
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-stone-500">期間:</span>
                            <input
                              type="date"
                              className="text-xs p-1 border border-stone-300 rounded bg-white text-stone-700"
                              value={plan.longTermGoalStartDate ?? ''}
                              onChange={e => handleUpdatePlan({ longTermGoalStartDate: e.target.value || undefined })}
                            />
                            <span className="text-xs text-stone-400">〜</span>
                            <input
                              type="date"
                              className="text-xs p-1 border border-stone-300 rounded bg-white text-stone-700"
                              value={plan.longTermGoalEndDate ?? ''}
                              onChange={e => handleUpdatePlan({ longTermGoalEndDate: e.target.value || undefined })}
                            />
                          </div>
                        </div>

                        {/* 短期目標 */}
                        <div>
                          <h3 className="font-bold text-stone-700 text-sm mb-2">短期目標 (具体的な取り組み)</h3>
                          <div className="space-y-3 mb-4">
                            {plan.shortTermGoals.map((goal) => (
                              <div key={goal.id} className="bg-white border border-stone-200 p-3 rounded-lg shadow-sm">
                                <div className="flex items-start gap-3">
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
                                    className="text-stone-400 hover:text-red-500 p-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mt-2 ml-9">
                                  <span className="text-xs text-stone-500">期間:</span>
                                  <input
                                    type="date"
                                    className="text-xs p-1 border border-stone-300 rounded bg-white text-stone-700"
                                    value={goal.startDate ?? ''}
                                    onChange={e => handleUpdatePlan({
                                      shortTermGoals: plan.shortTermGoals.map(g =>
                                        g.id === goal.id ? { ...g, startDate: e.target.value || undefined } : g
                                      )
                                    })}
                                  />
                                  <span className="text-xs text-stone-400">〜</span>
                                  <input
                                    type="date"
                                    className="text-xs p-1 border border-stone-300 rounded bg-white text-stone-700"
                                    value={goal.endDate ?? ''}
                                    onChange={e => handleUpdatePlan({
                                      shortTermGoals: plan.shortTermGoals.map(g =>
                                        g.id === goal.id ? { ...g, endDate: e.target.value || undefined } : g
                                      )
                                    })}
                                  />
                                </div>
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
                      </>
                    )}
                  </div>

                  {/* 第3表: 週間サービス計画表 */}
                  <div className="border-t pt-6 border-stone-100">
                    <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">第3表</span>
                      週間サービス計画表
                    </h2>
                    <WeeklyScheduleEditor
                      schedule={plan.weeklySchedule}
                      needs={plan.needs}
                      onChange={(ws) => handleUpdatePlan({ weeklySchedule: ws })}
                    />
                  </div>

                  {/* 変更履歴 */}
                  {plan.id && (
                    <div className="border-t pt-6 border-stone-100">
                      <button
                        type="button"
                        onClick={async () => {
                          if (showHistory) {
                            setShowHistory(false);
                            return;
                          }
                          setHistoryLoading(true);
                          try {
                            const entries = await listCarePlanHistory(user.uid, selectedClient.id, plan.id!);
                            setCarePlanHistory(entries);
                            setShowHistory(true);
                          } catch (e) {
                            console.error('Failed to load history:', e);
                          } finally {
                            setHistoryLoading(false);
                          }
                        }}
                        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        {historyLoading ? '読み込み中...' : showHistory ? '変更履歴を閉じる' : '変更履歴を表示'}
                      </button>
                      {showHistory && (
                        <div className="mt-3 space-y-2">
                          {carePlanHistory.length === 0 ? (
                            <p className="text-sm text-stone-400">変更履歴がありません（次回保存時から記録されます）</p>
                          ) : (
                            carePlanHistory.map((entry) => (
                              <details key={entry.id} className="bg-stone-50 rounded-lg p-3">
                                <summary className="cursor-pointer text-sm text-stone-700 flex items-center gap-2">
                                  <span className="font-medium">
                                    {entry.savedAt.toDate().toLocaleString('ja-JP', {
                                      year: 'numeric', month: 'numeric', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </span>
                                  <span className="text-xs text-stone-400">ステータス: {entry.status}</span>
                                  <span className="text-xs text-stone-400">短期目標 {entry.shortTermGoalCount}件</span>
                                </summary>
                                <ul className="mt-2 space-y-1 pl-2">
                                  {entry.shortTermGoals.map((g, i) => (
                                    <li key={i} className="text-xs text-stone-600">• {g.content}</li>
                                  ))}
                                </ul>
                              </details>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: Monitoring */}
              {activeTab === 'monitoring' && (
                <div className="animate-in fade-in duration-300">
                  {monitoringMode === 'list' ? (
                    <>
                      <MonitoringMonthlyStatus
                        userId={user.uid}
                        clientId={selectedClient.id}
                      />
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-stone-800 mb-1">モニタリング記録</h2>
                          <p className="text-sm text-stone-500">
                            月次モニタリング・目標達成状況の評価
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingMonitoringId(null);
                            setMonitoringMode('edit');
                            markDirty('monitoring');
                          }}
                          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          新規作成
                        </button>
                      </div>
                      <MonitoringRecordList
                        userId={user.uid}
                        clientId={selectedClient.id}
                        carePlanId={plan.id}
                        onSelect={(recordId) => {
                          setEditingMonitoringId(recordId);
                          setMonitoringMode('edit');
                          markDirty('monitoring');
                        }}
                        onDelete={() => {
                          setSaveMessage({ type: 'success', text: 'モニタリング記録を削除しました' });
                        }}
                      />
                    </>
                  ) : (
                    <MonitoringDiffView
                      userId={user.uid}
                      clientId={selectedClient.id}
                      carePlanId={plan.id}
                      goals={plan.shortTermGoals}
                      existingRecordId={editingMonitoringId || undefined}
                      onSave={() => {
                        setSaveMessage({ type: 'success', text: 'モニタリング記録を保存しました' });
                        setMonitoringMode('list');
                        setEditingMonitoringId(null);
                        clearDirty('monitoring');
                      }}
                      onCancel={() => {
                        setMonitoringMode('list');
                        setEditingMonitoringId(null);
                        clearDirty('monitoring');
                      }}
                    />
                  )}
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
                      userId={user.uid}
                      clientId={selectedClient.id}
                      carePlanId={plan.id}
                      onDirtyChange={(isDirty) => isDirty ? markDirty('records') : clearDirty('records')}
                      onSave={() => {
                        setSaveMessage({ type: 'success', text: '支援経過記録を保存しました' });
                        clearDirty('records');
                      }}
                    />
                    <div className="border-t border-stone-200 pt-6">
                      <h3 className="text-lg font-bold text-stone-800 mb-4">記録一覧</h3>
                      <SupportRecordList
                        userId={user.uid}
                        clientId={selectedClient.id}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: Service Meeting */}
              {activeTab === 'meeting' && (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-stone-800 mb-1">サービス担当者会議記録（第4表）</h2>
                    <p className="text-sm text-stone-500">
                      担当者会議の記録・照会内容を管理
                    </p>
                  </div>
                  <div className="space-y-6">
                    <ServiceMeetingForm
                      userId={user.uid}
                      clientId={selectedClient.id}
                      carePlanId={plan.id}
                      onNavigateToCarePlan={() => setActiveTab('plan')}
                      onDirtyChange={(isDirty) => isDirty ? markDirty('meeting') : clearDirty('meeting')}
                      onSave={() => {
                        setSaveMessage({ type: 'success', text: '担当者会議記録を保存しました' });
                        clearDirty('meeting');
                      }}
                    />
                    <div className="border-t border-stone-200 pt-6">
                      <h3 className="text-lg font-bold text-stone-800 mb-4">会議記録一覧</h3>
                      <ServiceMeetingList
                        userId={user.uid}
                        clientId={selectedClient.id}
                        carePlanId={plan.id}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <FeedbackFAB />

      {/* Footer */}
      <footer className="max-w-4xl mx-auto p-6 text-center text-stone-400 text-xs">
        <p className="font-medium mb-1">CareFlow Master 2025 (Demo Build)</p>
        <p>※ 本システムは運営指導対策およびユーザビリティ検証のためのプロトタイプです。<br/>臨床現場での使用前に、セキュリティおよび運用規定の確認が必要です。</p>
      </footer>

    </div>
  );
}
