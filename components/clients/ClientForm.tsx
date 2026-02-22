import React, { useState } from 'react';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import { CareLevel } from '../../types';
import type { Client, ClientInput } from '../../types';
import { useClient } from '../../contexts/ClientContext';

interface ClientFormProps {
  existingClient?: Client | null;
  onComplete: () => void;
  onCancel: () => void;
}

const careLevelOptions = Object.values(CareLevel);

const genderOptions: Array<{ value: '男' | '女'; label: string }> = [
  { value: '男', label: '男性' },
  { value: '女', label: '女性' },
];

export const ClientForm: React.FC<ClientFormProps> = ({
  existingClient,
  onComplete,
  onCancel,
}) => {
  const { createClient, updateClient } = useClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // フォームデータ
  const [name, setName] = useState(existingClient?.name || '');
  const [kana, setKana] = useState(existingClient?.kana || '');
  const [birthDate, setBirthDate] = useState(existingClient?.birthDate || '');
  const [gender, setGender] = useState<'男' | '女'>(existingClient?.gender || '男');
  const [careLevel, setCareLevel] = useState<CareLevel>(
    existingClient?.careLevel as CareLevel || CareLevel.CARE_1
  );
  const [address, setAddress] = useState(existingClient?.address || '');
  const [phone, setPhone] = useState(existingClient?.phone || '');
  const [medicalAlerts, setMedicalAlerts] = useState<string[]>(
    existingClient?.medicalAlerts || []
  );
  const [newAlert, setNewAlert] = useState('');

  // 生活歴
  const [hobbies, setHobbies] = useState<string[]>(
    existingClient?.lifeHistory?.hobbies || []
  );
  const [newHobby, setNewHobby] = useState('');
  const [previousOccupation, setPreviousOccupation] = useState(
    existingClient?.lifeHistory?.previousOccupation || ''
  );
  const [topicsToAvoid, setTopicsToAvoid] = useState<string[]>(
    existingClient?.lifeHistory?.topicsToAvoid || []
  );
  const [newTopic, setNewTopic] = useState('');
  const [importantMemories, setImportantMemories] = useState(
    existingClient?.lifeHistory?.importantMemories || ''
  );

  // 保険情報
  const [insurerNumber, setInsurerNumber] = useState(existingClient?.insurerNumber || '');
  const [insuredNumber, setInsuredNumber] = useState(existingClient?.insuredNumber || '');
  const [certificationDate, setCertificationDate] = useState(existingClient?.certificationDate || '');
  const [certificationExpiry, setCertificationExpiry] = useState(existingClient?.certificationExpiry || '');

  const addToList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue('');
    }
  };

  const removeFromList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // バリデーション
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    if (!kana.trim()) {
      setError('フリガナを入力してください');
      return;
    }

    // 保険情報バリデーション（入力がある場合のみチェック）
    if (insurerNumber.trim() && !/^\d{6}$/.test(insurerNumber.trim())) {
      errors.insurerNumber = '保険者番号は6桁の数字で入力してください';
    }
    if (insuredNumber.trim() && !/^\d{10}$/.test(insuredNumber.trim())) {
      errors.insuredNumber = '被保険者番号は10桁の数字で入力してください';
    }
    if (certificationDate && certificationExpiry && certificationExpiry <= certificationDate) {
      errors.certificationExpiry = '有効期限は認定日より後の日付を設定してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('入力内容を確認してください');
      return;
    }

    setFieldErrors({});
    setError(null);
    setSaving(true);

    try {
      const data: ClientInput = {
        name: name.trim(),
        kana: kana.trim(),
        birthDate,
        gender,
        careLevel,
        address: address.trim(),
        phone: phone.trim() || null,
        medicalAlerts,
        lifeHistory: {
          hobbies,
          previousOccupation: previousOccupation.trim(),
          topicsToAvoid,
          importantMemories: importantMemories.trim(),
        },
        insurerNumber: insurerNumber.trim() || null,
        insuredNumber: insuredNumber.trim() || null,
        certificationDate: certificationDate || null,
        certificationExpiry: certificationExpiry || null,
      };

      if (existingClient) {
        await updateClient(existingClient.id, data);
      } else {
        await createClient(data);
      }
      onComplete();
    } catch (err) {
      console.error('Failed to save client:', err);
      setError('保存できませんでした。通信状況を確認してもう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!existingClient;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h2 className="text-xl font-bold text-stone-800">
            {isEditing ? '利用者情報の編集' : '新規利用者登録'}
          </h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? '更新' : '登録'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <section className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              フリガナ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={kana}
              onChange={(e) => setKana(e.target.value)}
              placeholder="ヤマダ タロウ"
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              生年月日
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              性別
            </label>
            <div className="flex gap-4">
              {genderOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={() => setGender(opt.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-stone-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              要介護度
            </label>
            <select
              value={careLevel}
              onChange={(e) => setCareLevel(e.target.value as CareLevel)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
            >
              {careLevelOptions.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              住所
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="東京都世田谷区..."
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              電話番号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03-XXXX-XXXX"
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
            />
          </div>
        </div>
      </section>

      {/* 医療アラート */}
      <section className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">医療アラート</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {medicalAlerts.map((alert, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm bg-red-50 text-red-700 border border-red-200"
            >
              {alert}
              <button
                onClick={() => removeFromList(medicalAlerts, setMedicalAlerts, idx)}
                className="hover:text-red-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAlert}
            onChange={(e) => setNewAlert(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addToList(medicalAlerts, setMedicalAlerts, newAlert, setNewAlert)}
            placeholder="ペースメーカー、アレルギーなど"
            className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-stone-800"
          />
          <button
            onClick={() => addToList(medicalAlerts, setMedicalAlerts, newAlert, setNewAlert)}
            className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 text-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 生活歴 */}
      <section className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">生活歴（ライフヒストリー）</h3>
        <div className="space-y-4">
          {/* 趣味 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">趣味・関心</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {hobbies.map((hobby, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {hobby}
                  <button onClick={() => removeFromList(hobbies, setHobbies, idx)} className="hover:text-emerald-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToList(hobbies, setHobbies, newHobby, setNewHobby)}
                placeholder="囲碁、盆栽など"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-stone-800"
              />
              <button
                onClick={() => addToList(hobbies, setHobbies, newHobby, setNewHobby)}
                className="px-3 py-2 bg-stone-100 text-stone-700 border border-stone-200 rounded-md hover:bg-stone-200 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 前職 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">以前の職業</label>
            <input
              type="text"
              value={previousOccupation}
              onChange={(e) => setPreviousOccupation(e.target.value)}
              placeholder="建築士、教師など"
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-stone-800"
            />
          </div>

          {/* 避けるべき話題 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">避けるべき話題（NG）</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {topicsToAvoid.map((topic, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm bg-amber-50 text-amber-700 border border-amber-200"
                >
                  {topic}
                  <button onClick={() => removeFromList(topicsToAvoid, setTopicsToAvoid, idx)} className="hover:text-amber-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToList(topicsToAvoid, setTopicsToAvoid, newTopic, setNewTopic)}
                placeholder="戦争の話など"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-stone-800"
              />
              <button
                onClick={() => addToList(topicsToAvoid, setTopicsToAvoid, newTopic, setNewTopic)}
                className="px-3 py-2 bg-stone-100 text-stone-700 border border-stone-200 rounded-md hover:bg-stone-200 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 大切な思い出 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">大切にしている思い出</label>
            <textarea
              value={importantMemories}
              onChange={(e) => setImportantMemories(e.target.value)}
              placeholder="信頼関係構築のための背景情報..."
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-stone-800"
            />
          </div>
        </div>
      </section>

      {/* 保険情報 */}
      <section className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">介護保険情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">保険者番号<span className="ml-1 text-xs text-stone-400">（6桁）</span></label>
            <input
              type="text"
              value={insurerNumber}
              onChange={(e) => { setInsurerNumber(e.target.value); setFieldErrors(prev => ({ ...prev, insurerNumber: '' })); }}
              placeholder="131001"
              inputMode="numeric"
              maxLength={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm text-stone-800 ${fieldErrors.insurerNumber ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-blue-500'}`}
            />
            {fieldErrors.insurerNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.insurerNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">被保険者番号<span className="ml-1 text-xs text-stone-400">（10桁）</span></label>
            <input
              type="text"
              value={insuredNumber}
              onChange={(e) => { setInsuredNumber(e.target.value); setFieldErrors(prev => ({ ...prev, insuredNumber: '' })); }}
              placeholder="0000000001"
              inputMode="numeric"
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm text-stone-800 ${fieldErrors.insuredNumber ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-blue-500'}`}
            />
            {fieldErrors.insuredNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.insuredNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">認定日</label>
            <input
              type="date"
              value={certificationDate}
              onChange={(e) => { setCertificationDate(e.target.value); setFieldErrors(prev => ({ ...prev, certificationExpiry: '' })); }}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-stone-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">認定有効期限</label>
            <input
              type="date"
              value={certificationExpiry}
              onChange={(e) => { setCertificationExpiry(e.target.value); setFieldErrors(prev => ({ ...prev, certificationExpiry: '' })); }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm text-stone-800 ${fieldErrors.certificationExpiry ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-blue-500'}`}
            />
            {fieldErrors.certificationExpiry && <p className="mt-1 text-xs text-red-600">{fieldErrors.certificationExpiry}</p>}
          </div>
        </div>
      </section>

      {/* 下部アクションボタン */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? '更新する' : '登録する'}
        </button>
      </div>
    </div>
  );
};

export default ClientForm;
