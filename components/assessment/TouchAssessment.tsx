
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AssessmentData } from '../../types';
import { Mic, Check, Loader2, Sparkles, ArrowDownCircle, Activity, Home, Brain, Users, ClipboardList, Lightbulb, MessageSquarePlus, Clock, RefreshCw, AlertTriangle, StopCircle, PlayCircle, RotateCcw } from 'lucide-react';
import { analyzeAssessmentConversation } from '../../services/geminiService';
import { getCareManagementSuggestions } from '../../services/complianceService';

interface Props {
  data: AssessmentData;
  onChange: (key: keyof AssessmentData, value: string) => void;
}

// Initial Advice Constant (Docs 49)
const INITIAL_ADVICE = [
    "本日の体調はいかがですか？（顔色、バイタル、気分の確認）",
    "現在利用している介護サービスや医療サービスはありますか？",
    "今、生活の中で一番困っていること、不安なことは何ですか？"
];

// Phase 3 & 4: Hybrid Input with AI Highlight Support
const QuickOptions = ({
    label,
    options,
    selected,
    onSelect,
    placeholder = "詳細を入力...",
    isAiUpdated = false,
    isEmpty = false
}: {
    label: string,
    options: string[],
    selected: string,
    onSelect: (val: string) => void,
    placeholder?: string,
    isAiUpdated?: boolean,
    isEmpty?: boolean
}) => {
    return (
        <div className={`mb-6 p-4 rounded-lg border shadow-sm transition-all duration-500 ${
            isAiUpdated ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
            : isEmpty ? 'bg-amber-50/50 border-amber-200'
            : 'bg-white border-stone-100'
        }`}>
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-stone-700 flex items-center gap-2">
                    <span className={`w-1.5 h-4 rounded-full ${
                        isAiUpdated ? 'bg-indigo-500' : isEmpty ? 'bg-amber-400' : 'bg-blue-500'
                    }`}></span>
                    {label}
                </label>
                <div className="flex items-center gap-2">
                    {isEmpty && !isAiUpdated && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            未入力
                        </span>
                    )}
                    {isAiUpdated && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                            <Sparkles className="w-3 h-3" />
                            AI自動入力
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => onSelect(opt)}
                        className={`
                            p-3 rounded-lg text-left text-sm font-medium transition-all duration-200 flex justify-between items-center
                            ${selected.includes(opt)
                                ? 'bg-blue-600 text-white shadow-md transform scale-[1.01]'
                                : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'}
                        `}
                    >
                        {opt}
                        {selected.includes(opt) && <Check className="w-4 h-4" />}
                    </button>
                ))}
            </div>
            <textarea
                className="w-full p-3 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-stone-900"
                rows={2}
                placeholder={placeholder}
                value={selected}
                onChange={(e) => onSelect(e.target.value)}
            />
        </div>
    );
};

// Phase 3: Logic Assistant Component
const CareManagementAssistant = ({ suggestions }: { suggestions: string[] }) => {
    if (suggestions.length === 0) return null;
    return (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="bg-indigo-100 p-1.5 rounded-full">
                    <Lightbulb className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="font-bold text-indigo-900 text-sm">適切なケアマネジメント手法に基づく提案</h4>
            </div>
            <ul className="space-y-2">
                {suggestions.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-indigo-800 bg-white/60 p-2 rounded-lg">
                        <span className="mt-0.5 text-indigo-500">•</span>
                        {s}
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Phase 4 & 5: Interview Co-pilot Component
const InterviewCoPilot = ({ advice }: { advice: string[] }) => {
    if (advice.length === 0) return null;
    return (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-100 p-1.5 rounded-full">
                    <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-bold text-emerald-900 text-sm">インタビューコパイロット (聞き漏らしチェック)</h4>
            </div>
            <ul className="space-y-2">
                {advice.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-emerald-800 bg-white/60 p-2 rounded-lg">
                        <span className="mt-0.5 text-emerald-500">?</span>
                        {s}
                    </li>
                ))}
            </ul>
        </div>
    );
};

// タブ定義
const tabDefinitions = [
    { id: 'health', label: '基本・健康', icon: Activity, fields: ['serviceHistory', 'healthStatus', 'pastHistory', 'skinCondition', 'oralHygiene', 'fluidIntake'] },
    { id: 'adl', label: '生活機能', icon: Home, fields: ['adlTransfer', 'adlEating', 'adlToileting', 'adlBathing', 'adlDressing', 'iadlCooking', 'iadlShopping', 'iadlMoney', 'medication'] },
    { id: 'mental', label: '認知・精神', icon: Brain, fields: ['cognition', 'communication'] },
    { id: 'social', label: '社会・環境', icon: Users, fields: ['socialParticipation', 'residence', 'familySituation', 'maltreatmentRisk', 'environment'] },
    { id: 'summary', label: '全体サマリー', icon: ClipboardList, fields: [] },
];

// environment以外の全フィールド（進捗バー計算用）
const assessmentFields = [
    'serviceHistory', 'healthStatus', 'pastHistory', 'skinCondition', 'oralHygiene', 'fluidIntake',
    'adlTransfer', 'adlEating', 'adlToileting', 'adlBathing', 'adlDressing',
    'iadlCooking', 'iadlShopping', 'iadlMoney', 'medication',
    'cognition', 'communication',
    'socialParticipation', 'residence', 'familySituation', 'maltreatmentRisk',
] as const;

export const TouchAssessment: React.FC<Props> = ({ data, onChange }) => {
    const [activeTab, setActiveTab] = useState('health');

    // Logic Engines
    const suggestions = useMemo(() => getCareManagementSuggestions(data), [data]);

    // Phase 4 & 5 State
    const [aiUpdatedFields, setAiUpdatedFields] = useState<string[]>([]);
    // v1.2.3 Update: Set Initial Advice
    const [coPilotAdvice, setCoPilotAdvice] = useState<string[]>(INITIAL_ADVICE);

    // Phase 5: Interval Setting (null = manual, number = ms)
    // DEMO UPDATE: Default to 30s for better first impression
    const [autoAnalysisInterval, setAutoAnalysisInterval] = useState<number | null>(30000);
    const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false); // New: Track if session exists
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false); // New: Feedback state for copy button

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const intervalIdRef = useRef<number | null>(null);

    // Critical for Phase 5: Fix Stale Closure in Interval
    const latestDataRef = useRef(data);
    useEffect(() => { latestDataRef.current = data; }, [data]);

    const isRecordingRef = useRef(isRecording);
    useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

    const autoAnalysisIntervalRef = useRef(autoAnalysisInterval);
    useEffect(() => { autoAnalysisIntervalRef.current = autoAnalysisInterval; }, [autoAnalysisInterval]);

    // New: Keep track of summary for context injection
    const generatedTextRef = useRef(generatedText);
    useEffect(() => { generatedTextRef.current = generatedText; }, [generatedText]);

    // 進捗計算
    const progressInfo = useMemo(() => {
        const filled = assessmentFields.filter((f) => data[f as keyof AssessmentData]?.trim()).length;
        const total = assessmentFields.length;
        const percent = Math.round((filled / total) * 100);
        return { filled, total, percent };
    }, [data]);

    // タブ別未入力数
    const tabEmptyCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const tab of tabDefinitions) {
            if (tab.id === 'summary') {
                counts[tab.id] = 0;
                continue;
            }
            counts[tab.id] = tab.fields.filter((f) => {
                if (f === 'environment') return false; // 特記事項は除外
                return !data[f as keyof AssessmentData]?.trim();
            }).length;
        }
        return counts;
    }, [data]);

    // Debug Logger
    const logDebug = (action: string, payload: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[CFM-DEBUG] ${timestamp} | Action: ${action} |`, payload);
    };

    // UAT FIX: Safety Stop on Unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                console.log('[Safety Stop] Component unmounting, stopping active recording.');
                mediaRecorderRef.current.stop();
            }
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, []);

    // Handle AI Analysis Result
    const handleAnalysisResult = (result: any) => {
        logDebug('AnalysisResultReceived', {
            summaryLength: result.summary?.length || 0,
            fieldsUpdated: Object.keys(result.structuredData).length
        });

        // 1. Text Summary (Overwrite strategy)
        if (result.summary) {
            setGeneratedText(result.summary);
        }

        // 2. Auto-Update Fields (Differential Update)
        const updatedKeys: string[] = [];
        Object.entries(result.structuredData).forEach(([key, value]) => {
            if (value && value !== '') {
                onChange(key as keyof AssessmentData, String(value));
                updatedKeys.push(key);
            }
        });

        setAiUpdatedFields(prev => [...Array.from(new Set([...prev, ...updatedKeys]))]);

        // 3. Update Co-pilot Advice
        if (result.missingInfoAdvice && result.missingInfoAdvice.length > 0) {
            setCoPilotAdvice(result.missingInfoAdvice);
        }

        // 4. Update Timestamp
        setLastAnalysisTime(new Date().toLocaleTimeString());
    };

    const startRecording = async (resume: boolean = false) => {
        try {
            logDebug('StartRecording', { interval: autoAnalysisInterval, resume });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = []; // Always start with fresh chunks for this session

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);

                    // Phase 5: Real-time Analysis logic
                    if (autoAnalysisIntervalRef.current && isRecordingRef.current) {
                        setIsProcessing(true);
                        const blobSize = chunksRef.current.reduce((acc: number, chunk: any) => acc + chunk.size, 0);
                        const sizeKB = (blobSize / 1024).toFixed(2);

                        logDebug('IntervalAnalysisStart', { blobSize: `${sizeKB} KB` });

                        // Create Blob from current session chunks
                        const currentSessionBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                        try {
                            // v1.2.1: Pass isFinal=false for interval analysis
                            // Phase 6: Pass currentSummary for context
                            const result = await analyzeAssessmentConversation(
                                currentSessionBlob,
                                latestDataRef.current,
                                false,
                                generatedTextRef.current || ""
                            );
                            handleAnalysisResult(result);
                        } catch (err) {
                            console.error("Real-time analysis failed", err);
                            logDebug('AnalysisError', err);
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            };

            mediaRecorder.onstop = async () => {
                logDebug('RecordingStopped', {});
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                try {
                    // v1.2.1: Pass isFinal=true for stop analysis
                    const result = await analyzeAssessmentConversation(
                        audioBlob,
                        latestDataRef.current,
                        true,
                         generatedTextRef.current || ""
                    );
                    handleAnalysisResult(result);
                } catch (error) {
                    console.error("Final analysis failed", error);
                } finally {
                    setIsProcessing(false);
                    setIsFinalizing(false);
                    setHasRecorded(true); // Mark as having recorded
                }

                stream.getTracks().forEach(track => track.stop());
                if (intervalIdRef.current) {
                    clearInterval(intervalIdRef.current);
                    intervalIdRef.current = null;
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setIsFinalizing(false);

            // Reset state only if NOT resuming
            if (!resume) {
                setGeneratedText(null);
                setAiUpdatedFields([]);
                // v1.2.3: Reset to INITIAL_ADVICE instead of empty to guide user
                setCoPilotAdvice(INITIAL_ADVICE);
                setLastAnalysisTime(null);
                setHasRecorded(false);
            }

            if (autoAnalysisIntervalRef.current) {
                intervalIdRef.current = window.setInterval(() => {
                    if (mediaRecorder.state === 'recording') {
                        logDebug('RequestData', { interval: autoAnalysisIntervalRef.current });
                        mediaRecorder.requestData();
                    }
                }, autoAnalysisIntervalRef.current);
            }
        } catch (err) {
            console.error('Microphone access denied:', err);
            alert('マイクへのアクセスが許可されていません。');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            setIsFinalizing(true);
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        }
    };

    const handleApplyToTextarea = () => {
        if (generatedText) {
            const current = data.environment || '';
            const separator = current ? '\n\n' : '';
            onChange('environment', current + separator + generatedText);

            // Feedback Logic
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);

            // UX Improvement: Automatically switch to the tab where "Environment" field exists
            setActiveTab('social');
        }
    };

    const fieldLabels: {[key: string]: string} = {
        serviceHistory: '1. サービス利用状況',
        healthStatus: '2. 健康状態',
        pastHistory: '3. 既往歴',
        skinCondition: '4. 皮膚・褥瘡',
        oralHygiene: '5. 口腔衛生',
        fluidIntake: '6. 水分摂取',
        adlTransfer: '7. 移動・移乗',
        adlEating: '8. 食事',
        adlToileting: '9. 排泄',
        adlBathing: '10. 入浴',
        adlDressing: '11. 衣服着脱',
        iadlCooking: '12. 調理・家事',
        iadlShopping: '13. 買い物',
        iadlMoney: '14. 金銭管理',
        medication: '15. 服薬管理',
        cognition: '16. 認知機能',
        communication: '17. 意思疎通',
        socialParticipation: '18. 社会参加',
        residence: '19. 居住環境',
        familySituation: '20. 家族状況',
        maltreatmentRisk: '21. 虐待リスク',
        environment: '22. 特記事項'
    };

    return (
        <div className="space-y-4">
            <CareManagementAssistant suggestions={suggestions} />
            <InterviewCoPilot advice={coPilotAdvice} />

            {/* AI Control Panel */}
            <div className={`bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-start gap-4 shadow-sm transition-all ${isFinalizing ? 'bg-blue-100 ring-2 ring-blue-300' : ''}`}>
                <div className="w-full flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-blue-900 flex items-center gap-2">
                            <div className="bg-blue-200 p-1 rounded">
                                <Mic className="w-4 h-4 text-blue-700" />
                            </div>
                            AIオートマッピング (Real-time)
                        </h4>
                        <p className="text-xs text-blue-700 mt-1 pl-1">
                            会話を聞き取り、該当する項目を自動選択します。<br className="hidden sm:block"/>
                            不足している項目をアドバイスします。
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-blue-100">
                            <Clock className="w-3 h-3 text-stone-400 ml-1" />
                            <select
                                className="text-xs font-bold text-stone-600 bg-transparent border-none focus:ring-0 p-1 pr-6 cursor-pointer"
                                value={autoAnalysisInterval || ''}
                                onChange={(e) => setAutoAnalysisInterval(e.target.value ? Number(e.target.value) : null)}
                                disabled={isRecording || isFinalizing}
                            >
                                <option value="">手動解析 (終了時)</option>
                                <option value="30000">30秒毎 (デモ)</option>
                                <option value="60000">1分毎</option>
                                <option value="300000">5分毎</option>
                            </select>
                        </div>
                        {lastAnalysisTime && (
                            <span className="text-[10px] text-stone-500 mt-1 flex items-center gap-1 animate-in fade-in">
                                <RefreshCw className="w-3 h-3" />
                                最終更新: {lastAnalysisTime}
                            </span>
                        )}
                    </div>
                </div>

                <div className="w-full flex flex-col sm:flex-row gap-3">
                    {!isRecording ? (
                        <>
                            {hasRecorded ? (
                                <>
                                    <button
                                        onClick={() => startRecording(true)} // Resume
                                        disabled={isFinalizing}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        <span className="text-sm font-bold">続きから録音 (追記)</span>
                                    </button>
                                    <button
                                        onClick={() => startRecording(false)} // New
                                        disabled={isFinalizing}
                                        className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span className="text-sm font-bold">クリアして新規</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => startRecording(false)}
                                    disabled={isFinalizing}
                                    className="flex-1 bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-200 px-4 py-3 rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isFinalizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                                    <span className="text-sm font-bold">
                                        {isFinalizing ? '保存処理中...' : '録音・分析開始'}
                                    </span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <div className="flex-1 bg-white border border-red-200 rounded-lg px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <span className="text-red-600 font-bold text-sm">録音中...</span>
                                </div>
                                {isProcessing && (
                                    <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span className="text-xs font-bold">AI思考中...</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={stopRecording}
                                className="bg-red-50 text-red-600 border-2 border-red-200 px-6 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <StopCircle className="w-5 h-5" />
                                終了
                            </button>
                        </div>
                    )}
                </div>

                {/* UX Fix: Explicit Finalizing Feedback */}
                {isFinalizing && (
                    <div className="w-full bg-indigo-600 text-white rounded-lg p-3 flex items-center justify-center gap-3 shadow-lg animate-in slide-in-from-top-1">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-bold text-sm">AIが会話の最終分析を行っています。お待ちください...</span>
                    </div>
                )}

                {autoAnalysisInterval && isRecording && (
                    <div className="w-full text-center">
                        <p className="text-[10px] text-stone-400">
                            ※ リアルタイム解析有効: {autoAnalysisInterval / 1000}秒ごとにAIが自動チェックを行います
                        </p>
                    </div>
                )}
            </div>

            {/* Generated Summary Area */}
            {(generatedText || isFinalizing) && (
                <div className={`bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-top-4 shadow-sm transition-opacity ${isFinalizing ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2 mb-2 text-indigo-800">
                        <Sparkles className="w-4 h-4" />
                        <h5 className="font-bold text-xs">AI生成要約 (特記事項ドラフト)</h5>
                    </div>
                    <textarea
                        className="w-full p-3 bg-white border border-indigo-200 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-indigo-500"
                        rows={4}
                        value={generatedText || ''}
                        onChange={(e) => setGeneratedText(e.target.value)}
                        disabled={isFinalizing}
                        placeholder={isFinalizing ? "解析中..." : ""}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            onClick={handleApplyToTextarea}
                            disabled={isProcessing || isFinalizing || !generatedText || isCopied}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${isCopied ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:bg-stone-400 disabled:cursor-not-allowed`}
                        >
                            {isFinalizing ? <Loader2 className="w-3 h-3 animate-spin" /> :
                             isCopied ? <Check className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                            {isFinalizing ? "最終解析待ち..." : isCopied ? "追記しました" : "特記事項へ追記"}
                        </button>
                    </div>
                </div>
            )}

            {/* 進捗バー */}
            <div className="bg-white rounded-lg border border-stone-200 p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-stone-700">入力進捗</span>
                    <span className="text-sm font-bold text-stone-600">
                        {progressInfo.filled}/{progressInfo.total}項目 ({progressInfo.percent}%)
                    </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                            progressInfo.percent === 100 ? 'bg-green-500' : progressInfo.percent >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressInfo.percent}%` }}
                    ></div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-stone-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {tabDefinitions.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-bold whitespace-nowrap transition-all relative
                            ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tabEmptyCounts[tab.id] > 0 && (
                            <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-amber-200">
                                {tabEmptyCounts[tab.id]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 min-h-[400px]">
                {activeTab === 'health' && (
                    <div className="animate-in fade-in duration-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">基本情報・健康状態</h3>

                        <QuickOptions
                            label="1. サービス利用状況"
                            selected={data.serviceHistory}
                            onSelect={(val) => onChange('serviceHistory', val)}
                            options={["利用なし", "介護保険のみ利用中", "医療・障害併用", "自費サービス利用"]}
                            placeholder="現在のサービス利用状況を入力..."
                            isAiUpdated={aiUpdatedFields.includes('serviceHistory')}
                            isEmpty={!data.serviceHistory?.trim()}
                        />

                        <QuickOptions
                            label="2. 健康状態"
                            selected={data.healthStatus}
                            onSelect={(val) => onChange('healthStatus', val)}
                            options={['安定している', '定期的な通院が必要', '体調変動が大きい', '終末期・重篤']}
                            placeholder="現在の健康状態や予後について..."
                            isAiUpdated={aiUpdatedFields.includes('healthStatus')}
                            isEmpty={!data.healthStatus?.trim()}
                        />
                        <QuickOptions
                            label="3. 既往歴"
                            selected={data.pastHistory}
                            onSelect={(val) => onChange('pastHistory', val)}
                            options={['特になし', '脳血管疾患', '心疾患', '骨折', '認知症']}
                            placeholder="発症時期や後遺症の詳細..."
                            isAiUpdated={aiUpdatedFields.includes('pastHistory')}
                            isEmpty={!data.pastHistory?.trim()}
                        />

                        <QuickOptions
                            label="4. 皮膚・褥瘡"
                            selected={data.skinCondition}
                            onSelect={(val) => onChange('skinCondition', val)}
                            options={["問題なし", "乾燥・痒みあり", "褥瘡・発赤あり", "医療処置中"]}
                            placeholder="皮膚の状態、褥瘡のリスク..."
                            isAiUpdated={aiUpdatedFields.includes('skinCondition')}
                            isEmpty={!data.skinCondition?.trim()}
                        />

                        <QuickOptions
                            label="5. 口腔衛生"
                            selected={data.oralHygiene}
                            onSelect={(val) => onChange('oralHygiene', val)}
                            options={["問題なし", "歯科受診が必要", "義歯不適合", "咀嚼・嚥下困難"]}
                            placeholder="口腔ケアの状況、歯科通院の必要性..."
                            isAiUpdated={aiUpdatedFields.includes('oralHygiene')}
                            isEmpty={!data.oralHygiene?.trim()}
                        />

                        <QuickOptions
                            label="6. 水分摂取"
                            selected={data.fluidIntake}
                            onSelect={(val) => onChange('fluidIntake', val)}
                            options={["十分摂取", "意識して摂取中", "不足気味", "制限あり(医師指示)"]}
                            placeholder="1日の水分量、摂取方法..."
                            isAiUpdated={aiUpdatedFields.includes('fluidIntake')}
                            isEmpty={!data.fluidIntake?.trim()}
                        />
                    </div>
                )}

                {activeTab === 'adl' && (
                    <div className="animate-in fade-in duration-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">生活機能 (ADL/IADL)</h3>

                        <div className="mb-6">
                            <h4 className="font-bold text-blue-800 text-sm mb-2 bg-blue-50 p-2 rounded">ADL (起居・身体動作)</h4>
                            <QuickOptions
                                label="7. 移動・移乗"
                                selected={data.adlTransfer}
                                onSelect={(val) => onChange('adlTransfer', val)}
                                options={['自立', '見守りが必要', '一部介助', '全介助']}
                                placeholder="寝返り、起き上がり、歩行状態..."
                                isAiUpdated={aiUpdatedFields.includes('adlTransfer')}
                                isEmpty={!data.adlTransfer?.trim()}
                            />
                            <QuickOptions
                                label="8. 食事"
                                selected={data.adlEating}
                                onSelect={(val) => onChange('adlEating', val)}
                                options={['自立', '見守り・セッティング', '一部介助', '全介助']}
                                placeholder="摂取動作、食事形態..."
                                isAiUpdated={aiUpdatedFields.includes('adlEating')}
                                isEmpty={!data.adlEating?.trim()}
                            />
                            <QuickOptions
                                label="9. 排泄"
                                selected={data.adlToileting}
                                onSelect={(val) => onChange('adlToileting', val)}
                                options={['自立', 'ポータブルトイレ使用', 'オムツ使用(介助)', '全介助']}
                                placeholder="トイレ移動、後始末、失敗の有無..."
                                isAiUpdated={aiUpdatedFields.includes('adlToileting')}
                                isEmpty={!data.adlToileting?.trim()}
                            />
                            <QuickOptions
                                label="10. 入浴"
                                selected={data.adlBathing}
                                onSelect={(val) => onChange('adlBathing', val)}
                                options={['自立', '見守り', '一部介助', '全介助・清拭']}
                                placeholder="洗身、洗髪、浴槽出入り..."
                                isAiUpdated={aiUpdatedFields.includes('adlBathing')}
                                isEmpty={!data.adlBathing?.trim()}
                            />
                            <QuickOptions
                                label="11. 衣服着脱"
                                selected={data.adlDressing}
                                onSelect={(val) => onChange('adlDressing', val)}
                                options={["自立", "ボタン等一部介助", "着脱全介助", "季節に合わない"]}
                                placeholder="整容、更衣の手順、手指機能..."
                                isAiUpdated={aiUpdatedFields.includes('adlDressing')}
                                isEmpty={!data.adlDressing?.trim()}
                            />
                        </div>

                        <div>
                            <h4 className="font-bold text-blue-800 text-sm mb-2 bg-blue-50 p-2 rounded">IADL (手段的日常生活動作)</h4>
                            <QuickOptions
                                label="12. 調理・家事"
                                selected={data.iadlCooking}
                                onSelect={(val) => onChange('iadlCooking', val)}
                                options={['自立', '一部困難', '全般的に困難', '実施していない']}
                                placeholder="調理、洗濯、掃除の状況..."
                                isAiUpdated={aiUpdatedFields.includes('iadlCooking')}
                                isEmpty={!data.iadlCooking?.trim()}
                            />
                            <QuickOptions
                                label="13. 買い物"
                                selected={data.iadlShopping}
                                onSelect={(val) => onChange('iadlShopping', val)}
                                options={['自立', '付き添いが必要', '代行が必要', '困難']}
                                placeholder="外出頻度、重い物の購入..."
                                isAiUpdated={aiUpdatedFields.includes('iadlShopping')}
                                isEmpty={!data.iadlShopping?.trim()}
                            />
                            <QuickOptions
                                label="14. 金銭管理"
                                selected={data.iadlMoney}
                                onSelect={(val) => onChange('iadlMoney', val)}
                                options={['自立', '家族が支援', '後見人等が管理', '困難']}
                                placeholder="日常の金銭管理、預貯金管理..."
                                isAiUpdated={aiUpdatedFields.includes('iadlMoney')}
                                isEmpty={!data.iadlMoney?.trim()}
                            />
                            <QuickOptions
                                label="15. 服薬管理"
                                selected={data.medication}
                                onSelect={(val) => onChange('medication', val)}
                                options={['自立', 'カレンダー等で自立', '声掛けが必要', '管理困難']}
                                placeholder="飲み忘れ、セット状況..."
                                isAiUpdated={aiUpdatedFields.includes('medication')}
                                isEmpty={!data.medication?.trim()}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'mental' && (
                    <div className="animate-in fade-in duration-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">認知・精神・意思疎通</h3>
                        <QuickOptions
                            label="16. 認知機能"
                            selected={data.cognition}
                            onSelect={(val) => onChange('cognition', val)}
                            options={['自立', '年齢相応の物忘れ', '認知症の疑い', '認知症(診断済)']}
                            placeholder="記憶力、見当識、BPSDの有無..."
                            isAiUpdated={aiUpdatedFields.includes('cognition')}
                            isEmpty={!data.cognition?.trim()}
                        />
                        <QuickOptions
                            label="17. 意思疎通"
                            selected={data.communication}
                            onSelect={(val) => onChange('communication', val)}
                            options={['良好', '聞き返しが必要', '意思伝達困難', '反応なし']}
                            placeholder="視力、聴力、構音障害..."
                            isAiUpdated={aiUpdatedFields.includes('communication')}
                            isEmpty={!data.communication?.trim()}
                        />
                    </div>
                )}

                {activeTab === 'social' && (
                    <div className="animate-in fade-in duration-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">社会・環境</h3>
                        <QuickOptions
                            label="18. 社会参加"
                            selected={data.socialParticipation}
                            onSelect={(val) => onChange('socialParticipation', val)}
                            options={['積極的', '週1回程度', '閉じこもりがち', '交流拒否']}
                            placeholder="近所付き合い、趣味活動、役割..."
                            isAiUpdated={aiUpdatedFields.includes('socialParticipation')}
                            isEmpty={!data.socialParticipation?.trim()}
                        />
                        <QuickOptions
                            label="19. 居住環境"
                            selected={data.residence}
                            onSelect={(val) => onChange('residence', val)}
                            options={['問題なし', '段差あり(改修済)', '段差等の課題あり', '著しく不衛生']}
                            placeholder="家屋状況、住宅改修の必要性..."
                            isAiUpdated={aiUpdatedFields.includes('residence')}
                            isEmpty={!data.residence?.trim()}
                        />
                        <QuickOptions
                            label="20. 家族状況"
                            selected={data.familySituation}
                            onSelect={(val) => onChange('familySituation', val)}
                            options={['同居家族が主介護', '独居・近隣に支援者', '独居・支援者なし', '老老介護']}
                            placeholder="キーパーソン、介護力、介護疲れ..."
                            isAiUpdated={aiUpdatedFields.includes('familySituation')}
                            isEmpty={!data.familySituation?.trim()}
                        />
                        <QuickOptions
                            label="21. 虐待リスク"
                            selected={data.maltreatmentRisk}
                            onSelect={(val) => onChange('maltreatmentRisk', val)}
                            options={['兆候なし', '介護疲れの兆候', '経済的虐待の懸念', '身体的虐待の懸念']}
                            placeholder="養護者による虐待の兆候..."
                            isAiUpdated={aiUpdatedFields.includes('maltreatmentRisk')}
                            isEmpty={!data.maltreatmentRisk?.trim()}
                        />
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-stone-700 mb-2">22. 特記事項・総合的課題</label>
                            <textarea
                                className="w-full p-4 border border-stone-200 rounded-lg h-32 bg-stone-50 focus:bg-white transition-colors"
                                value={data.environment}
                                onChange={e => onChange('environment', e.target.value)}
                                placeholder="その他の課題、アセスメントのまとめ..."
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="animate-in fade-in duration-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">全体サマリー (確認用)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-stone-600">
                                <thead className="text-xs text-stone-700 uppercase bg-stone-100">
                                    <tr>
                                        <th className="px-6 py-3 rounded-l-lg">項目</th>
                                        <th className="px-6 py-3 rounded-r-lg">記録内容</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(data).map(([key, value]) => {
                                        if (key === 'environment') return null;
                                        return (
                                            <tr key={key} className="bg-white border-b hover:bg-stone-50">
                                                <td className="px-6 py-4 font-bold text-stone-800">
                                                    {fieldLabels[key] || key}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {value ? (
                                                        <span className="text-stone-800">{value}</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            未確認
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 font-bold text-stone-800">22. 特記事項</td>
                                        <td className="px-6 py-4 whitespace-pre-wrap">{data.environment || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
