import React, { useState } from 'react';
import { Animal, NutritionRecipe, Language, AIExecutionMode } from '../types';
import { t } from '../lib/translations';
import { aiService } from '../lib/aiService';
import { Wheat, Sparkles, CheckCircle2 } from 'lucide-react';

interface NutritionPlannerProps {
  animals: Animal[];
  language: Language;
  executionMode?: AIExecutionMode;
}

export const NutritionPlanner: React.FC<NutritionPlannerProps> = ({ animals, language, executionMode = 'online' }) => {
  const isEn = language === 'en';
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.id || '');
  const [targetMilkLiters, setTargetMilkLiters] = useState(16);
  const [lactationStage, setLactationStage] = useState<'early' | 'mid' | 'late' | 'dry'>('early');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<NutritionRecipe | null>(null);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  const handleGenerateRecipe = async () => {
    if (!selectedAnimal) return;
    setIsGenerating(true);
    setRecipe(null);

    try {
      const resultRecipe = await aiService.generateNutritionRecipe(
        selectedAnimal,
        targetMilkLiters,
        lactationStage,
        language,
        executionMode === 'offline' ? 'offline' : 'online'
      );

      setIsGenerating(false);
      setRecipe(resultRecipe);
    } catch (e) {
      setIsGenerating(false);
      // Fallback Recipe
      setRecipe({
        id: 'rec_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        targetMilkLiters,
        totalDailyCostPKR: 420,
        greenFodderKg: 25,
        dryFodderKg: 5,
        concentrateKg: 4.5,
        mineralMixGrams: 100,
        waterLitersDay: 60,
        ingredients: [
          { name: isEn ? 'Berseem / Lucerne (Green Fodder)' : 'برسیم یا لوسرن (سبز چارہ)', amountKg: 25, costPKR: 125, category: 'green_fodder' },
          { name: isEn ? 'Wheat Straw / Bhusa' : 'گندم کا بھوسا / توڑی', amountKg: 5, costPKR: 75, category: 'dry_fodder' },
          { name: isEn ? 'Cottonseed Cake (Banola Khall)' : 'بَنولہ کھل (Cottonseed Cake)', amountKg: 2.5, costPKR: 150, category: 'concentrate' },
          { name: isEn ? 'Maize Silage' : 'مئیز سائلج (Maize Silage)', amountKg: 8, costPKR: 60, category: 'green_fodder' },
          { name: isEn ? 'Mineral Mixture (DCP & Salts)' : 'منرل مکسچر (DCP & Salts)', amountKg: 0.1, costPKR: 10, category: 'mineral' },
        ],
        mixingInstructions: isEn
          ? 'Mix green fodder and wheat straw in the morning. Soak concentrate cake and mineral mix in water before evening milking.'
          : 'صبح کے وقت سبز چارہ اور توڑی ملا کر دیں۔ ونڈا اور منرل مکسچر پانی میں بھگو کر شام کی چوآئی سے پہلے کھلائیں۔',
        benefitsUrdu: isEn
          ? 'This balanced ration will boost milk yield & fat content by up to 15% while maintaining bone and herd health.'
          : 'یہ متوازن خوراک دودھ کی فیٹ (Fat %) اور مقدار میں 15٪ تک اضافہ کرے گی اور جانور کی ہڈیوں کو مضبوط رکھے گی۔',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Wheat className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('nutritionPlanner', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isEn
            ? 'Formulate affordable, balanced ration recipes for your cattle using local feeds (green fodder, wheat straw, cottonseed cake, silage, minerals).'
            : 'مقامی پاکستانی چارے (سبز چارہ، توڑی، کھل، سائلج، منرلز) سے سستا اور متوازن ترین ونڈا ریسیپی تیار کریں۔'}
        </p>
      </div>

      {/* Inputs Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {isEn ? 'Animal Selection & Feeding Information' : 'جانور کا انتخاب اور خوراک کی معلومات'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Select Animal:' : 'جانور کا نام:'}
            </label>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.breed} • {a.weightKg} {isEn ? 'kg' : 'کلو'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Target Milk Yield (Liters/day):' : 'مطلوبہ دودھ کی پیداوار (لیٹر/دن):'}
            </label>
            <input
              type="number"
              value={targetMilkLiters}
              onChange={(e) => setTargetMilkLiters(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Lactation Stage:' : 'دودھ دینے کا مرحلہ (Lactation):'}
            </label>
            <select
              value={lactationStage}
              onChange={(e) => setLactationStage(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="early">{isEn ? 'Early Stage (High Milk Yield)' : 'ابتدائی مرحلہ (Early - زیادہ دودھ)'}</option>
              <option value="mid">{isEn ? 'Mid Stage' : 'درمیانی مرحلہ (Mid)'}</option>
              <option value="late">{isEn ? 'Late Stage' : 'آخری مرحلہ (Late)'}</option>
              <option value="dry">{isEn ? 'Dry / Pregnant Stage' : 'خشک مرحلہ (Dry/Pregnant)'}</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateRecipe}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse"
        >
          {isGenerating ? (
            <span>{isEn ? 'Generating optimal balanced ration formula...' : 'بہترین سستا ریشن فارمولا تیار ہو رہا ہے...'}</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{isEn ? 'Generate AI Balanced Feed Formula' : 'AI متوازن چارہ فارمولا بنائیں'}</span>
            </>
          )}
        </button>
      </div>

      {/* Output Recipe */}
      {recipe && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                {isEn ? `Formulated Feed Recipe (Target: ${recipe.targetMilkLiters} L Milk)` : `تخلیق شدہ چارہ ریسیپی (Target: ${recipe.targetMilkLiters} L Milk)`}
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isEn ? `Daily Ration Chart (${recipe.animalName})` : `روزانہ خوراک چارٹ (${recipe.animalName})`}
              </h3>
            </div>

            <div className="text-end">
              <span className="text-xs text-slate-400 block">{isEn ? 'Total Daily Cost:' : 'روزانہ کا کل خرچہ:'}</span>
              <span className="text-xl font-bold text-emerald-600">PKR {recipe.totalDailyCostPKR} {isEn ? '/ day' : '/ دن'}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
              <span className="text-slate-400 block">{isEn ? 'Green Fodder:' : 'سبز چارہ:'}</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{recipe.greenFodderKg} {isEn ? 'kg' : 'کلوگرم'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800">
              <span className="text-slate-400 block">{isEn ? 'Dry Straw:' : 'خشک توڑی:'}</span>
              <span className="font-bold text-amber-800 dark:text-amber-300 text-sm">{recipe.dryFodderKg} {isEn ? 'kg' : 'کلوگرم'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800">
              <span className="text-slate-400 block">{isEn ? 'Concentrate / Cake:' : 'ونڈا / کھل:'}</span>
              <span className="font-bold text-blue-800 dark:text-blue-300 text-sm">{recipe.concentrateKg} {isEn ? 'kg' : 'کلوگرم'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800">
              <span className="text-slate-400 block">{isEn ? 'Minerals & Water:' : 'منرل و پانی:'}</span>
              <span className="font-bold text-purple-800 dark:text-purple-300 text-sm">{recipe.mineralMixGrams}g • {recipe.waterLitersDay}L</span>
            </div>
          </div>

          {/* Detailed Ingredients Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isEn ? 'Local Feed Breakdown:' : 'مقامی اجزاء کا بریک ڈاؤن:'}</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              {recipe.ingredients.map((ing, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">{ing.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse font-medium">
                    <span>{ing.amountKg} {isEn ? 'kg' : 'کلو'}</span>
                    <span className="text-emerald-600 font-bold">PKR {ing.costPKR}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mixing Instructions & Benefits */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 border border-slate-100 dark:border-slate-700">
            <p className="text-slate-700 dark:text-slate-200">
              <strong>{isEn ? 'Feeding Instructions:' : 'ترکیبِ کھلائی:'}</strong> {recipe.mixingInstructions}
            </p>
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
              💡 {recipe.benefitsUrdu}
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
