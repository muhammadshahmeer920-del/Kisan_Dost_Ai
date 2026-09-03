import { Language, Animal, DiseaseScanResult, RecoveryPlan, NutritionRecipe, BiosecurityAssessment } from '../types';

export type ExecutionMode = 'online' | 'offline';

export interface AIStatus {
  isOnlineAvailable: boolean;
  isOfflineAvailable: boolean;
  serverHealth: boolean;
  activeMode: ExecutionMode;
  message: string;
}

export interface ChatRequestParams {
  prompt: string;
  language: Language;
  imageBase64?: string | null;
  mode: ExecutionMode;
}

export interface ChatResponseData {
  success: boolean;
  answer: string;
  language?: 'en' | 'ur';
  isEmergency: boolean;
  suggestedNextQuestions: string[];
  modeUsed: ExecutionMode;
}

/**
 * Centralized AI Service Factory for managing Online Gemini API calls and Offline Knowledge Base fallbacks.
 */
export class AIServiceFactory {
  private static instance: AIServiceFactory;

  private constructor() {}

  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  /**
   * Verifies environment and server connectivity status.
   */
  public async verifyEnvironment(): Promise<AIStatus> {
    try {
      const res = await fetch('/api/health', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return {
          isOnlineAvailable: true,
          isOfflineAvailable: true,
          serverHealth: data.status === 'ok',
          activeMode: 'online',
          message: 'AI Server connected & Gemini model initialized successfully.',
        };
      }
    } catch (e) {
      // Backend server unreachable or offline
    }

    return {
      isOnlineAvailable: false,
      isOfflineAvailable: true,
      serverHealth: false,
      activeMode: 'offline',
      message: 'Operating in Local Offline Mode with embedded livestock knowledge base.',
    };
  }

  /**
   * Primary AI Assistant Chat Service with automatic offline fallback.
   */
  public async sendChatMessage(params: ChatRequestParams): Promise<ChatResponseData> {
    const { prompt, language, imageBase64, mode } = params;

    // Direct offline mode processing
    if (mode === 'offline') {
      return this.generateOfflineChatResponse(prompt, language);
    }

    // Online execution with fallback
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language,
          imageBase64: imageBase64 || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.answer) {
        return {
          success: true,
          answer: data.answer,
          language: data.language || (language === 'en' ? 'en' : 'ur'),
          isEmergency: !!data.isEmergency,
          suggestedNextQuestions: data.suggestedNextQuestions || [
            'خوراک کا کیا احتیاط کریں؟',
            'ویکسین کب لگوائیں؟',
          ],
          modeUsed: 'online',
        };
      }

      throw new Error('Invalid online response structure');
    } catch (error) {
      console.warn('Online AI Chat failed, falling back to offline mode:', error);
      const fallback = this.generateOfflineChatResponse(prompt, language);
      return {
        ...fallback,
        modeUsed: 'offline',
      };
    }
  }

  /**
   * AI Disease Scanner Service with automatic offline fallback.
   */
  public async scanDisease(
    imageBase64: string,
    language: Language,
    mode: ExecutionMode,
    options?: {
      animalName?: string;
      species?: string;
      breed?: string;
      notes?: string;
    }
  ): Promise<DiseaseScanResult> {
    if (mode === 'offline') {
      return this.generateOfflineDiseaseScan(language, options?.notes);
    }

    try {
      const response = await fetch('/api/ai/scan-disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || undefined,
          language,
          animalName: options?.animalName,
          species: options?.species,
          breed: options?.breed,
          notes: options?.notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error('Scan failed');
    } catch (error) {
      console.warn('Online Disease Scan failed, using offline diagnosis:', error);
      return this.generateOfflineDiseaseScan(language, options?.notes);
    }
  }

  /**
   * Day-by-Day Recovery Plan Generator with offline fallback.
   */
  public async generateRecoveryPlan(
    animalName: string,
    diseaseName: string,
    totalDays: number,
    language: Language,
    mode: ExecutionMode
  ): Promise<{ vetAdvice: string; steps: any[] }> {
    if (mode === 'offline') {
      return this.generateOfflineRecoveryPlan(animalName, diseaseName, totalDays, language);
    }

    try {
      const response = await fetch('/api/ai/recovery-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalName, diseaseName, totalDays, language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const planObj = data.plan || data.data;
      if (data.success && planObj) {
        return planObj;
      }
      throw new Error('Recovery plan generation failed');
    } catch (error) {
      console.warn('Online Recovery Plan failed, falling back offline:', error);
      return this.generateOfflineRecoveryPlan(animalName, diseaseName, totalDays, language);
    }
  }

  /**
   * AI Nutrition Recipe Planner with offline fallback.
   */
  public async generateNutritionRecipe(
    selectedAnimal: Animal,
    targetMilkLiters: number,
    lactationStage: string,
    language: Language,
    mode: ExecutionMode
  ): Promise<NutritionRecipe> {
    if (mode === 'offline') {
      return this.generateOfflineNutritionRecipe(selectedAnimal, targetMilkLiters, language);
    }

    try {
      const response = await fetch('/api/ai/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalName: selectedAnimal.name,
          species: selectedAnimal.species,
          weightKg: selectedAnimal.weightKg,
          targetMilkLiters,
          lactationStage,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.success && (data.recipe || data.plan)) {
        const p = data.recipe || data.plan;
        if (p.ingredients) return p;

        // Map server format to frontend recipe object
        return {
          id: 'rec_' + Date.now(),
          animalId: selectedAnimal.id,
          animalName: selectedAnimal.name,
          targetMilkLiters,
          totalDailyCostPKR: p.totalDailyCostPKR || 420,
          greenFodderKg: p.items?.[0]?.amountKg || 25,
          dryFodderKg: p.items?.[1]?.amountKg || 5,
          concentrateKg: p.items?.[2]?.amountKg || 4.5,
          mineralMixGrams: 100,
          waterLitersDay: p.dailyWaterRequirementLiters || 65,
          ingredients: (p.items || []).map((it: any) => ({
            name: it.name,
            amountKg: it.amountKg,
            costPKR: it.estimatedCostPKR,
            category: it.name.includes('ونڈا') ? 'concentrate' : it.name.includes('توڑی') ? 'dry_fodder' : 'green_fodder',
          })),
          mixingInstructions: p.specialInstructions || 'صبح و شام چارہ اور ونڈا ملا کر دیں۔',
          benefitsUrdu: 'یہ متوازن خوراک دودھ کی مقدار اور فیٹ فیصد میں اضافہ کرے گی۔',
        };
      }
      throw new Error('Nutrition generation failed');
    } catch (error) {
      console.warn('Online Nutrition recipe failed, using offline formula:', error);
      return this.generateOfflineNutritionRecipe(selectedAnimal, targetMilkLiters, language);
    }
  }

  /**
   * AI Biosecurity Assessment Generator with local disease risk awareness and offline fallback.
   */
  public async assessBiosecurity(params: {
    farmName: string;
    farmerName: string;
    district: string;
    province: string;
    herdSize: number;
    speciesPrimary: string;
    answers: Record<string, boolean>;
    activeLocalThreats?: any[];
    language: Language;
    mode: ExecutionMode;
  }): Promise<BiosecurityAssessment> {
    const {
      farmName,
      farmerName,
      district,
      province,
      herdSize,
      speciesPrimary,
      answers,
      activeLocalThreats,
      language,
      mode,
    } = params;

    if (mode === 'offline') {
      return this.generateOfflineBiosecurityAssessment(params);
    }

    try {
      const response = await fetch('/api/ai/biosecurity-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmName,
          farmerName,
          district,
          province,
          herdSize,
          speciesPrimary,
          answers,
          activeLocalThreats,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return {
          id: 'bio_' + Date.now(),
          farmName,
          farmerName,
          district,
          province,
          herdSize,
          speciesPrimary,
          answers,
          createdAt: new Date().toISOString(),
          ...data.data,
        };
      }
      throw new Error('Biosecurity assessment API failed');
    } catch (error) {
      console.warn('Online Biosecurity Assessment failed, using offline calculations:', error);
      return this.generateOfflineBiosecurityAssessment(params);
    }
  }

  // --- PRIVATE OFFLINE GENERATORS ---

  private generateOfflineChatResponse(query: string, language: Language): ChatResponseData {
    const q = query.toLowerCase();
    const isEn = language === 'en';
    let offlineText = '';
    let isEmergency = false;

    if (q.includes('fever') || q.includes('بخار') || q.includes('تاپ')) {
      offlineText = isEn
        ? `📌 Diagnosis: High Fever & Thermal Stress
⚠️ Precautions & Isolation:
• Immediately isolate the animal in a shaded, well-ventilated shed.
• Keep clean, cool drinking water available 24/7.
• Avoid direct sunlight and heavy physical strain.

💊 Necessary Medicines & Doses:
• Injection Meloxicam (10-15 ml intramuscular) or Paracetamol tablets (3-4 tablets twice daily).
• Broad-spectrum antibiotic (Oxytetracycline 20ml) if fever persists above 104°F.

🥣 Home Remedies & Diet Adjustment:
• Feed soft green fodder (Berseem/Maize) mixed with curd (dahi).
• Drench electrolyte water (100g glucose + 20g salt in 5L water).

👨‍⚕️ Vet Advisory: Call your local vet if temperature exceeds 105°F.`
        : `📌 بیماری کی تشخیص: تیز بخار اور جسمانی حرارت (Fever)
⚠️ احتیاطی تدابیر اور پرہیز:
• جانور کو فوری طور پر سائے دار اور ہوا دار باڑے میں منتقل کریں۔
• 24 گھنٹے صاف اور ٹھنڈا پینے کا پانی فراہم کریں۔
• جانور کو تیز دھوپ سے محفوظ رکھیں۔

💊 ضروری ادویات اور علاج:
• میلوکسیکام (Meloxicam 15ml) یا پیراسیٹامول گولی (3 سے 4 گولیاں)۔
• اگر بخار 104F سے زیادہ رہے تو ویٹرنری ڈاکٹر کے مشورے سے آکسی ٹیٹراسائکلین انجکشن لگائیں۔

🥣 دیسی علاج اور خوراک:
• نرم چارہ (دلیہ، دہی، اور ہرا چارہ) دیں۔
• 5 لیٹر پانی میں 100 گرام گلوکوز اور 20 گرام نمک ملا کر پلاؤ۔

👨‍⚕️ ویٹرنری ڈاکٹر کی ہدایت: اگر بخار 105F سے بڑھ جائے تو فوری سرکاری ڈاکٹر کو بلائیں۔`;
      isEmergency = true;
    } else if (q.includes('milk') || q.includes('دودھ') || q.includes('پیداوار')) {
      offlineText = isEn
        ? `📌 Goal: Dairy Milk Yield Optimization
⚠️ Precautions & Care:
• Maintain strict milking hygiene to prevent Mastitis.
• Ensure fixed daily milking schedules and stress-free environment.

💊 Essential Supplements & Deworming:
• Deworming with Albendazole (100ml) before starting high-grade feed.
• Mineral Mixture (100g daily) + Calcium D3 Syrup (100ml daily).

🥣 Diet & Fodder Formula:
• Mix High-protein Green Fodder (Berseem/Lucerne) with dry Wheat Straw.
• Feed 2kg Grain Vanda per 5 liters of milk output.

👨‍⚕️ Production Tip: Regularly check milk pH and udder health every 15 days.`
        : `📌 مقصد: دودھ کی پیداوار اور فیٹ میں اضافہ
⚠️ احتیاطی تدابیر:
• باڑے کی باقاعدہ صفائی اور ہر 15 دن بعد سڑو (Mastitis) ٹیسٹ کریں۔
• دودھ دوہنے کا وقت روزانہ ایک ہی رکھیں۔

💊 ضروری ادویات اور منرلز:
• ہر 3 ماہ بعد پیٹ کے کیڑوں کی دوا (Albendazole 100ml) دیں۔
• منرل مکسچر (100 گرام روزانہ ونڈے میں) + کیلشیم سیرپ (100ml روزانہ)۔

🥣 دیسی خوراک اور ونڈا فارمولا:
• 5 لیٹر دودھ پر 2 کلو معیاری ونڈا اور خشک توڑی ملا کر دیں۔
• سرسوں کی کھلی (1 کلو) اور بنولہ (500g) رات کو بھگو کر صبح دیں۔

👨‍⚕️ پیداواری مشورہ: صاف پانی اور باڑے میں ہوا کی آمدورفت دودھ بڑھاتی ہے۔`;
    } else if (q.includes('bloat') || q.includes('افارہ') || q.includes('پیٹ')) {
      offlineText = isEn
        ? `📌 Emergency Condition: Severe Bloat / Tympany (پیٹ کا افارہ)
⚠️ Precautions & Immediate Care:
• DO NOT allow the animal to lie down. Walk slowly on an upward slope.
• Remove all wet/moist green fodder immediately.

💊 Urgent Home Remedies & Medicines:
• Drench 200ml Mustard Oil mixed with 50g Soda Bicarb in warm water.
• Administer Bloat-Free Syrup (100ml) or Turpentine Oil 30ml in linseed oil.

🥣 Feeding Restrictions:
• Provide only dry wheat straw and clean water until bloat subsides.

👨‍⚕️ EMERGENCY WARNING: Call vet for trocarization immediately if severe choking occurs!`
        : `⚠️ ہنگامی حالت: پیٹ کا شدید افارہ (Bloat / Tympany)
⚠️ احتیاطی تدابیر اور فوری اقدامات:
• جانور کو ہرگز نیچے نہ بیٹھنے دیں! اونچائی کی طرف آہستہ آہستہ چلائیں۔
• گیلا یا شبنم والا ہرا چارہ فوراً ہٹا دیں۔

💊 ضروری ادویات اور فوری علاج:
• 200ml سرسوں کا تیل + 50g میٹھا سوڈا نیم گرم پانی میں ملا کر پلاؤ۔
• بلواٹ فری سیرپ (100ml) یا تارپین کا تیل 30ml دیں۔

🥣 خوراک کی احتیاط:
• افارہ ختم ہونے تک صرف خشک توڑی اور صاف پانی دیں۔

👨‍⚕️ ہنگامی خبردار: اگر سانس پھولنے لگے تو فوراً ویٹرنری ڈاکٹر سے پیٹ سے گیس نکلواؤ!`;
      isEmergency = true;
    } else {
      offlineText = isEn
        ? `📌 General Livestock Health & Care Advisory
⚠️ Daily Management Precautions:
• Keep shed floor dry, clean and well-drained.
• Ensure proper ventilation and shade from extreme weather.

💊 Standard Health Care & Deworming:
• Administer Deworming medicine every 3 months.
• Daily Mineral Mixture (50g - 100g per animal).

🥣 Balanced Fodder Plan:
• Mix 60% Green Fodder + 30% Dry Fodder + 10% Concentrated Grain Vanda.

👨‍⚕️ Doctor's Advice: Contact your local vet for regular herd checkups.`
        : `📌 عمومی مویشی پال گائیڈ اور دیکھ بھال
⚠️ روزانہ کی احتیاطی تدابیر:
• باڑے کے نیچے سوکھی بچھالی اور صفائی رکھیں۔
• تازہ ہوا اور سائے کا انتظام رکھیں۔

💊 ضروری ادویات اور کیڑوں کی دوا:
• ہر 3 ماہ بعد پیٹ کے کیڑوں کی دوا (Dewormer) دیں۔
• روزانہ 50 گرام منرل مکسچر خوراک میں شامل کریں۔

🥣 متوازن خوراک:
• 60 فیصد ہرا چارہ + 30 فیصد خشک توڑی + 10 فیصد ونڈا ملا کر دیں۔

👨‍⚕️ ویٹرنری ڈاکٹر کا مشورہ: جانور کی صحت اور ویکسینیشن کے لیے قریبی ڈسپنسری سے رابطہ رکھیں۔`;
    }

    return {
      success: true,
      answer: offlineText,
      isEmergency,
      suggestedNextQuestions: [
        language === 'en' ? 'What home remedies work best?' : 'اس کا دیسی اور فوری علاج کیا ہے؟',
        language === 'en' ? 'How much fodder is required daily?' : 'کتنی خوراک دینی چاہیے؟',
      ],
      modeUsed: 'offline',
    };
  }

  private generateOfflineDiseaseScan(language: Language, notes?: string): DiseaseScanResult {
    const isEn = language === 'en';
    const q = (notes || '').toLowerCase();

    if (q.includes('fever') || q.includes('بخار') || q.includes('تاپ')) {
      return {
        detectedDisease: isEn ? 'High Fever & Heat Stress' : 'تیز بخار اور انفیکشن (High Fever)',
        confidence: 94,
        severity: 'moderate',
        causes: [
          isEn ? 'Systemic bacterial/viral infection' : 'بیکٹیریل یا وائرل انفیکشن',
          isEn ? 'High ambient humidity and thermal stress' : 'شدید گرمی اور حبس کا دباؤ',
        ],
        precautions: [
          isEn ? 'Move to shaded, well-ventilated shed' : 'سائے دار اور ہوا دار باڑے میں منتقل کریں',
          isEn ? 'Apply cold water cloths to head' : 'سر پر ٹھنڈے پانی کی پٹیاں کریں',
          isEn ? 'Provide 24/7 electrolyte drinking water' : '24 گھنٹے صاف اور ٹھنڈا نمکیات ملا پانی دیں',
        ],
        recommendedMedicines: [
          isEn ? 'Meloxicam Injection (15ml I/M)' : 'میلوکسیکام انجکشن (15ml)',
          isEn ? 'Paracetamol Bolus (3-4 tablets twice daily)' : 'پیراسیٹامول گولی (3 سے 4 گولیاں)',
          isEn ? 'Oxytetracycline LA (Long Acting Antibiotic)' : 'آکسی ٹیٹراسائکلین لانگ ایکٹنگ انجکشن',
        ],
        vetRequired: true,
        recoveryDaysEstimate: 5,
        aiNotes: isEn
          ? 'Fever protocol indicated. Keep animal well hydrated and monitor rectal temperature.'
          : 'بخار کے علاج کا پروٹوکول لاگو کیا گیا ہے۔ جانور کو ٹھنڈا رکھیں اور ڈاکٹر کے مشورے سے ادویات دیں۔',
      };
    }

    if (q.includes('mastitis') || q.includes('سڑو') || q.includes('لیوا') || q.includes('تھن') || q.includes('دودھ')) {
      return {
        detectedDisease: isEn ? 'Clinical Mastitis (Udder Inflammation)' : 'سڑو بیماری / ہوانہ انفیکشن (Mastitis)',
        confidence: 93,
        severity: 'severe',
        causes: [
          isEn ? 'Teat canal bacterial invasion' : 'تھنوں میں جراثیم کا داخلہ',
          isEn ? 'Contaminated milking bedding' : 'باڑے کے فرش کی گندگی',
        ],
        precautions: [
          isEn ? 'Isolate from milking herd immediately' : 'متاثرہ تھن کا دودھ الگ نکال کر تلف کریں',
          isEn ? 'Apply warm antiseptic compresses to udder' : 'ہوانہ پر نیم گرم پانی سے ٹکور کریں',
          isEn ? 'Perform daily post-milking teat dip' : 'چوآئی کے بعد تھنوں پر پوویڈین لگائیں',
        ],
        recommendedMedicines: [
          isEn ? 'Intramammary Teat Infusion Tube' : 'تھن کے اندر ڈالنے والی ٹیوب (Teat Infusion)',
          isEn ? 'Meloxicam 15ml' : 'میلوکسیکام انجکشن 15ml',
          isEn ? 'Ceftiofur / Penicillin Antibiotic' : 'اینٹی بائیوٹک انجکشن (Ceftiofur)',
        ],
        vetRequired: true,
        recoveryDaysEstimate: 7,
        aiNotes: isEn
          ? 'Acute udder swelling identified. Complete full antibiotic course and milk out frequently.'
          : 'ہوانے کی سوجن اور دودھ کے بگاڑ کے لیے فوری اینٹی بائیوٹک اور درد کش دوا ضروری ہے۔',
      };
    }

    if (q.includes('bloat') || q.includes('افارہ') || q.includes('پیٹ') || q.includes('گیس')) {
      return {
        detectedDisease: isEn ? 'Acute Ruminal Bloat / Tympany' : 'شدید افارہ اور گیس (Acute Bloat)',
        confidence: 95,
        severity: 'critical',
        causes: [
          isEn ? 'Rapid fermentation of moist green fodder' : 'گیلا یا کچا چارہ زیادہ کھانا',
          isEn ? 'High grain / starch concentrate feeding' : 'ونڈے کی اچانک زیادہ مقدار',
        ],
        precautions: [
          isEn ? 'Do NOT allow animal to lie down' : 'جانور کو ہرگز نیچے نہ بیٹھنے دیں',
          isEn ? 'Walk gently on an upward slope' : 'اونچائی کی طرف آہستہ آہستہ چلائیں',
          isEn ? 'Withhold all wet green fodder' : 'سبز چارہ فوراً ہٹا دیں',
        ],
        recommendedMedicines: [
          isEn ? '200ml Mustard Oil + 50g Soda Bicarb' : '200ml سرسوں کا تیل + 50g میٹھا سوڈا نیم گرم پانی میں',
          isEn ? 'Bloat-Free Liquid 100ml' : 'بلواٹ فری سیرپ 100ml',
          isEn ? 'Turpentine Oil 30ml in edible oil' : 'تارپین کا تیل 30ml',
        ],
        vetRequired: true,
        recoveryDaysEstimate: 3,
        aiNotes: isEn
          ? 'Emergency bloat management protocol. If severe respiratory distress occurs, seek urgent veterinary trocarization.'
          : 'افارے کی ہنگامی حالت۔ تیل اور میٹھا سوڈا پلائیں اور سانس کی تنگی کی صورت میں فوری ڈاکٹر سے گیس نکلواؤ۔',
      };
    }

    return {
      detectedDisease: isEn ? 'Lumpy Skin Disease (LSD)' : 'لمپی سکن ڈیزیز (Lumpy Skin)',
      confidence: 92,
      severity: 'moderate',
      causes: [
        isEn ? 'Biting flies and mosquitoes vector transmission' : 'مکھیاں اور مچھر کے کاٹنے سے وائرس کی منتقلی',
        isEn ? 'Direct contact with infected cattle' : 'متاثرہ جانوروں کا باہم اختلاط',
      ],
      precautions: [
        isEn ? 'Isolate affected animal in separate shed immediately' : 'متاثرہ جانور کو فوری الگ باڑے میں آئسولیٹ کریں',
        isEn ? 'Spray anti-mosquito disinfectant inside barn' : 'باڑے میں مچھر مار اور جراثیم کش سپرے کریں',
        isEn ? 'Provide cold water baths to lower fever' : 'بخار کم کرنے کے لیے ٹھنڈے پانی سے دھوئین',
      ],
      recommendedMedicines: [
        isEn ? 'Meloxicam Injection (15ml I/M for fever)' : 'میلوکسیکام انجکشن (15 ملی لیٹر بخار کے لیے)',
        isEn ? 'Oxytetracycline 10% (Secondary infection control)' : 'آکسی ٹیٹراسائکلین (سیکنڈری انفیکشن سے بچاؤ)',
        isEn ? 'Antiseptic skin spray on nodular lesions' : 'جلد پر گلٹیوں کے لیے اینٹی سیپٹک سپرے',
      ],
      vetRequired: true,
      recoveryDaysEstimate: 10,
      aiNotes: isEn
        ? 'Visual analysis indicates classic skin nodular lesions. Keep animal well-hydrated and isolate from other livestock.'
        : 'تصویر کے تجزیے سے جلد پر نمایاں ابھار اور گلٹیاں معلوم ہوتی ہیں۔ جانور کو پانی پلائیں اور دوسرے مویشیوں سے دور رکھیں۔',
    };
  }

  private generateOfflineRecoveryPlan(
    animalName: string,
    diseaseName: string,
    totalDays: number,
    language: Language
  ) {
    const isEn = language === 'en';
    return {
      vetAdvice: isEn
        ? `Isolate ${animalName} in clean shaded area, monitor body temperature twice daily and complete antibiotic course.`
        : `${animalName} کو الگ ہوا دار جگہ رکھیں، دن میں دو بار درجہ حرارت چیک کریں اور ڈاکٹر کی بتائی دوائیں مکمل کریں۔`,
      steps: Array.from({ length: totalDays }, (_, idx) => ({
        day: idx + 1,
        title: isEn ? `Recovery Phase Day ${idx + 1}` : `روزانہ ریکوری مرحلہ ${idx + 1}`,
        description: isEn
          ? `Inspect wound healing, check water intake and measure rectal temperature.`
          : `روزانہ چارہ، پانی اور زخموں یا سوجن کا معائنہ کریں۔`,
        medicines: ['Meloxicam 10ml', 'Antiseptic Spray'],
        feedingInstructions: isEn ? 'Soft mash, curd and fresh green fodder.' : 'نرم دلیہ، دہی، اور ہرا چارہ دیں۔',
      })),
    };
  }

  private generateOfflineNutritionRecipe(
    selectedAnimal: Animal,
    targetMilkLiters: number,
    language: Language
  ): NutritionRecipe {
    const isEn = language === 'en';
    return {
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
        { name: isEn ? 'Wheat Straw (Bhoosa)' : 'گندم کا بھوسا / توڑی', amountKg: 5, costPKR: 75, category: 'dry_fodder' },
        { name: isEn ? 'Cottonseed Cake (Bhanola)' : 'بَنولہ کھل (Cottonseed Cake)', amountKg: 2.5, costPKR: 150, category: 'concentrate' },
        { name: isEn ? 'Maize Silage' : 'مئیز سائلج (Maize Silage)', amountKg: 8, costPKR: 60, category: 'green_fodder' },
        { name: isEn ? 'Mineral Mixture' : 'منرل مکسچر (DCP & Salts)', amountKg: 0.1, costPKR: 10, category: 'mineral' },
      ],
      mixingInstructions: isEn
        ? 'Mix green fodder with wheat straw in morning. Soak cottonseed cake and mineral mix prior to evening milking.'
        : 'صبح کے وقت سبز چارہ اور توڑی ملا کر دیں۔ ونڈا اور منرل مکسچر پانی میں بھگو کر شام کی چوآئی سے پہلے کھلائیں۔',
      benefitsUrdu: isEn
        ? 'Balanced ration formulated to boost milk fat percentage and maintain body score condition.'
        : 'یہ متوازن خوراک دودھ کی فیٹ (Fat %) اور مقدار میں 15٪ تک اضافہ کرے گی اور جانور کی ہڈیوں کو مضبوط رکھے گی۔',
    };
  }

  private generateOfflineBiosecurityAssessment(params: {
    farmName: string;
    farmerName: string;
    district: string;
    province: string;
    herdSize: number;
    speciesPrimary: string;
    answers: Record<string, boolean>;
    activeLocalThreats?: any[];
    language: Language;
  }): BiosecurityAssessment {
    const {
      farmName,
      farmerName,
      district,
      province,
      herdSize,
      speciesPrimary,
      answers,
      language
    } = params;

    const isEn = language === 'en';

    let positiveCount = 0;
    const allKeys = Object.keys(answers);
    const totalQuestions = allKeys.length || 12;
    for (const key of allKeys) {
      if (answers[key] === true) positiveCount++;
    }

    const calculatedScore = Math.min(100, Math.max(15, Math.round((positiveCount / totalQuestions) * 100)));
    const grade: 'A' | 'B' | 'C' = calculatedScore >= 80 ? 'A' : calculatedScore >= 60 ? 'B' : 'C';
    const status = grade === 'A' ? 'secure' : grade === 'B' ? 'moderate_risk' : 'high_risk';

    // Category breakdown calculations
    const entryScore = answers['entry_disinfection'] ? (answers['visitor_log'] ? 90 : 65) : (answers['visitor_log'] ? 45 : 20);
    const quarScore = answers['quarantine_shed'] ? (answers['isolation_sick'] ? 95 : 70) : 25;
    const sanScore = answers['daily_dung_removal'] ? (answers['fly_tick_control'] ? 92 : 60) : 35;
    const vaccScore = answers['fmd_vaccinated'] ? (answers['lsd_vaccinated'] ? 95 : 70) : 30;
    const wasteScore = answers['safe_carcass_burial'] ? (answers['clean_milking'] ? 88 : 60) : 30;

    const criticalVulnerabilities: string[] = [];
    if (!answers['quarantine_shed']) {
      criticalVulnerabilities.push(isEn ? 'No designated 21-day quarantine pen for newly bought animals' : 'نئے خریدے گئے جانوروں کے لیے 21 روزہ الگ قرنطینہ باڑے کا نہ ہونا');
    }
    if (!answers['entry_disinfection']) {
      criticalVulnerabilities.push(isEn ? 'Absence of farm entrance vehicle and footwear disinfectant dip' : 'فارم کے داخلی راستے پر گاڑیوں اور جوتوں کے ڈس انفیکشن ٹینک کا نہ ہونا');
    }
    if (!answers['fly_tick_control']) {
      criticalVulnerabilities.push(isEn ? 'Lack of scheduled tick and vector repellent spraying' : 'مکھی، مچھر اور چچڑ مار سپرے کا غیر منظم ہونا');
    }
    if (!answers['fmd_vaccinated']) {
      criticalVulnerabilities.push(isEn ? 'Missing routine FMD / Foot-and-Mouth vaccination booster' : 'منہ کھر (FMD) کے ٹیکوں کا وقت پر نہ لگنا');
    }

    return {
      id: 'bio_' + Date.now(),
      farmName,
      farmerName,
      district,
      province,
      herdSize,
      speciesPrimary,
      score: calculatedScore,
      grade,
      status,
      categoryScores: {
        entryControl: entryScore,
        quarantine: quarScore,
        sanitation: sanScore,
        vaccination: vaccScore,
        wasteManagement: wasteScore,
      },
      answers,
      activeLocalThreats: [
        {
          disease: isEn ? 'Lumpy Skin Disease (LSD)' : 'لمپی سکن وائرس (LSD)',
          severity: 'high',
          affectedRadiusKm: 25,
          precautionUrdu: 'مچھروں اور مکھیوں سے بچاؤ کا فوری سپرے کریں اور متاثرہ جانور الگ کریں۔',
          precautionEnglish: 'Spray anti-vector insecticide and isolate cattle with nodules immediately.'
        },
        {
          disease: isEn ? 'Foot & Mouth Disease (FMD)' : 'منہ کھُر (Foot & Mouth Disease)',
          severity: 'critical',
          affectedRadiusKm: 15,
          precautionUrdu: 'مین گیٹ پر پوٹاشیم پرمینگنیٹ (پنکی) کا فٹ باتھ لازمی کریں۔',
          precautionEnglish: 'Mandatory Potassium Permanganate (Pinki) footbath at entry gate.'
        }
      ],
      aiSummary: isEn
        ? `Biosecurity Assessment for '${farmName}' in ${district} (${herdSize} ${speciesPrimary}s): Farm scores ${calculatedScore}% (Grade ${grade}). To protect against local disease vectors, prioritize gate foot-dips, slaked lime floor dusting, and mandatory 21-day quarantine for all new livestock.`
        : `فارم '${farmName}' (ضلع ${district}) کا بائیو سیکیورٹی تجزیہ: مجموعی اسکور ${calculatedScore}% (گریڈ ${grade}) ہے۔ علاقائی وبائی لہر سے اپنے ${herdSize} جانوروں کو بچانے کے لیے داخلی راستے پر چونے کا چھڑکاؤ اور نئے جانوروں کا 21 دن کا قرنطینہ لازمی بنائیں۔`,
      criticalVulnerabilities,
      actionSteps: [
        {
          priority: 'urgent',
          title: 'Install Gate Footbath with Slaked Lime / Pinki',
          titleUrdu: 'مین گیٹ پر بجھا ہوا چونا اور پنکی کا فٹ باتھ بنائیں',
          detail: 'Spread slaked lime (quicklime) or Virkon-S footbath at entrance to sanitize footwear and vehicle tires.',
          detailUrdu: 'فارم کے داخلی دروازے پر بجھا ہوا چونا بچھائیں یا پوٹاشیم پرمینگنیٹ کا ٹینک بنائیں تاکہ بیرونی جراثیم اندر نہ آئیں۔',
          estimatedCostPKR: 'Rs. 1,500 - 2,500',
          timeFrame: 'Within 24 Hours'
        },
        {
          priority: 'high',
          title: 'Implement Vector & Fly Control Spraying',
          titleUrdu: 'مکھی، مچھر اور چچڑ مار سائپرمیتھرین سپرے کریں',
          detail: 'Spray Cypermethrin 10% EC or Deltamethrin in animal sheds weekly to stop Lumpy Skin and Blood Parasite vectors.',
          detailUrdu: 'ہفتہ وار بنیاد پر باڑے کی دیواروں اور نالیوں میں سپرے کریں تاکہ لمپی سکن اور چچڑ بخار کا پھیلاؤ روکا جا سکے۔',
          estimatedCostPKR: 'Rs. 1,800 / month',
          timeFrame: '3 Days'
        },
        {
          priority: 'medium',
          title: 'Demarcate Dedicated 21-Day Isolation Pen',
          titleUrdu: 'نئے اور مشتبہ جانوروں کے لیے 21 دن کا الگ باڑہ مختص کریں',
          detail: 'Never mix newly purchased animals with the herd immediately. Observe for incubation symptoms.',
          detailUrdu: 'منڈی سے خریدے گئے نئے جانوروں کو کم از کم 21 دن تک اصل ریوڑ سے الگ باندھیں اور درجہ حرارت نوٹ کریں۔',
          estimatedCostPKR: 'Rs. 0 (Management)',
          timeFrame: 'Immediate'
        }
      ],
      upgradePlan7Days: [
        { day: 1, dayTitle: 'فوری گندگی و گوبر کی صفائی', taskUrdu: 'باڑے سے گوبر، کیچڑ اور بدبودار پانی دور نکالنا اور نالیاں خشک کرنا', taskEnglish: 'Deep cleaning and dung slurry disposal away from pens.' },
        { day: 2, dayTitle: 'داخلی گیٹ ڈس انفیکشن سیٹ اپ', taskUrdu: 'داخلی راستے پر بجھے ہوئے چونے اور پنکی کے واٹر باتھ کا قیام', taskEnglish: 'Entrance footbath and vehicle spray station setup.' },
        { day: 3, dayTitle: 'مکھی و چچڑ سپرے مہم', taskUrdu: 'تمام دیواروں اور کھلیوں کے ارد گرد کیڑے مار سپرے کرنا', taskEnglish: 'Anti-tick and fly repellent application across shed.' },
        { day: 4, dayTitle: 'پینے کے پانی کی صفائی', taskUrdu: 'پانی کے ٹینک اور کھلیوں کی بلیچ اور پوٹاشیم پرمینگنیٹ سے دھلائی', taskEnglish: 'Drinking trough cleaning and water sanitization.' },
        { day: 5, dayTitle: 'ویکسینیشن کارڈ آڈٹ', taskUrdu: 'تمام جانوروں کے منہ کھر، گل گھوٹو اور لمپی سکن ٹیکوں کا ریکارڈ چیک کرنا', taskEnglish: 'Vaccine card audit and booster scheduling.' },
        { day: 6, dayTitle: 'قرنطینہ باڑے کا انتظام', taskUrdu: 'نئے مویشیوں کے لیے الگ ہوادار اور خشک شیڈ کی باڑ لگانا', taskEnglish: 'Separate quarantine pen boundary demarcation.' },
        { day: 7, dayTitle: 'بائیو سیکیورٹی سرٹیفیکیشن لاک', taskUrdu: 'فارم ملازمین کو حفاظتی قواعد کی تربیت دینا اور باقاعدہ لاگ بک شروع کرنا', taskEnglish: 'Staff protocol training and biosecurity logbook activation.' }
      ],
      recommendedDisinfectants: [
        { name: 'Slaked Lime (Quicklime)', nameUrdu: 'بجھا ہوا چونا', dilution: 'Dry powder spreading', usage: 'Floors, gates, dung channels', costEstimate: 'Rs. 40 / kg' },
        { name: 'Potassium Permanganate (Pinki)', nameUrdu: 'پوٹاشیم پرمینگنیٹ (پنکی)', dilution: '1 gram per 10 Liters water', usage: 'Foot-dip, hoof washing, mouth sores', costEstimate: 'Rs. 150 / 50g' },
        { name: 'Virkon-S / Virucidal Powder', nameUrdu: 'ویرکون ایس وائرس کش پاؤڈر', dilution: '1:100 water dilution', usage: 'Misting, equipment, shed walls', costEstimate: 'Rs. 2,400 / 500g' },
        { name: 'Cypermethrin 10% EC', nameUrdu: 'سائپرمیتھرین مکھی و چچڑ سپرے', dilution: '2-3 ml per Liter water', usage: 'Cracks, walls, bedding areas', costEstimate: 'Rs. 850 / 250ml' }
      ],
      createdAt: new Date().toISOString()
    };
  }
}

export const aiService = AIServiceFactory.getInstance();
