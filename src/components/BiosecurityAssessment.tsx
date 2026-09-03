import React, { useState, useEffect } from 'react';
import { 
  Language, 
  User, 
  Animal, 
  AIExecutionMode, 
  BiosecurityAssessment as BiosecurityAssessmentType 
} from '../types';
import { aiService } from '../lib/aiService';
import { 
  getStoredBiosecurityAssessments, 
  saveStoredBiosecurityAssessment 
} from '../lib/storage';
import { ttsService, speakHybrid, stopHybrid } from '../lib/ttsService';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Download, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  MapPin, 
  Activity, 
  Clock, 
  FileText, 
  Share2, 
  HelpCircle, 
  Info,
  Droplets,
  Syringe,
  Trash2,
  Lock,
  Calendar,
  Check,
  Award,
  Zap,
  Printer,
  Loader2
} from 'lucide-react';

interface BiosecurityAssessmentProps {
  user: User;
  animals?: Animal[];
  language: Language;
  executionMode?: AIExecutionMode;
}

// Popular livestock districts across Pakistan with localized default disease threats
const DISTRICTS_DATA: Record<string, { province: string; activeThreats: { disease: string; severity: 'critical' | 'high' | 'moderate'; affectedRadiusKm: number; precautionUrdu: string; precautionEnglish: string }[] }> = {
  'Sahiwal': {
    province: 'Punjab',
    activeThreats: [
      {
        disease: 'منہ کھُر (Foot & Mouth Disease - FMD)',
        severity: 'critical',
        affectedRadiusKm: 18,
        precautionUrdu: 'فارم داخلے پر پوٹاشیم پرمینگنیٹ (پنکی) کا فٹ باتھ لازمی کریں۔',
        precautionEnglish: 'Mandatory KMnO4 footbath at entry gate.'
      },
      {
        disease: 'لمپی سکن وائرس (LSD)',
        severity: 'high',
        affectedRadiusKm: 30,
        precautionUrdu: 'مکھی مار سپرے کریں اور جلد پر گلٹیاں بننے کی صورت میں جانور الگ کریں۔',
        precautionEnglish: 'Spray anti-vector insecticide and isolate cattle with skin nodules.'
      }
    ]
  },
  'Multan': {
    province: 'Punjab',
    activeThreats: [
      {
        disease: 'لمپی سکن ڈیزیز (Lumpy Skin Disease)',
        severity: 'critical',
        affectedRadiusKm: 12,
        precautionUrdu: 'مچھروں اور مکھیوں کا اسپرے روزانہ کریں اور باڑے میں جراثیم کش دھونی دیں۔',
        precautionEnglish: 'Daily fly repellent spray and smoke fumigation.'
      },
      {
        disease: 'چچڑ بخار / تھیلیریوسس (Theileriosis)',
        severity: 'high',
        affectedRadiusKm: 25,
        precautionUrdu: 'چچڑ مار ادویات (سائپرمیتھرین) باڑے کی دراڑوں میں سپرے کریں۔',
        precautionEnglish: 'Spray Cypermethrin in wall cracks to eradicate ticks.'
      }
    ]
  },
  'Faisalabad': {
    province: 'Punjab',
    activeThreats: [
      {
        disease: 'گل گھوٹو (Hemorrhagic Septicemia - HS)',
        severity: 'high',
        affectedRadiusKm: 22,
        precautionUrdu: 'تمام گائے بھینسوں کو فوری طور پر گل گھوٹو کا حفاظتی ٹیکہ لگوائیں۔',
        precautionEnglish: 'Vaccinate all cattle against HS.'
      },
      {
        disease: 'منہ کھُر (FMD)',
        severity: 'moderate',
        affectedRadiusKm: 35,
        precautionUrdu: 'بیرونی تاجروں اور گاڑیوں کا باڑے میں داخلہ بند کریں۔',
        precautionEnglish: 'Restrict cattle traders and external vehicles from entry.'
      }
    ]
  },
  'Sargodha': {
    province: 'Punjab',
    activeThreats: [
      {
        disease: 'بروسیلوسس (Brucellosis - متعدی اسقاط حمل)',
        severity: 'high',
        affectedRadiusKm: 20,
        precautionUrdu: 'بغیر ٹیسٹ شدہ نئے جانور ریوڑ میں شامل نہ کریں، دستانے استعمال کریں۔',
        precautionEnglish: 'Quarantine and test all incoming breeding stock.'
      }
    ]
  },
  'Bahawalpur': {
    province: 'Punjab',
    activeThreats: [
      {
        disease: 'اینتھراکس / باؤلا پن (Anthrax Alert)',
        severity: 'critical',
        affectedRadiusKm: 15,
        precautionUrdu: 'مردہ جانور کی چیر پھاڑ ہرگز نہ کریں اور چونے کے ساتھ 6 فٹ گہرا دفنائیں۔',
        precautionEnglish: 'Never open dead carcasses; bury 6-feet deep with slaked lime.'
      }
    ]
  },
  'Hyderabad': {
    province: 'Sindh',
    activeThreats: [
      {
        disease: 'لمپی سکن اور تھیلیریوسس (LSD & Tick Fever)',
        severity: 'critical',
        affectedRadiusKm: 16,
        precautionUrdu: 'ریڈ سندھی اور کنکریج نسل کو مچھروں اور مکھیوں سے بچائیں۔',
        precautionEnglish: 'Protect indigenous and crossbred herd from blood-sucking vectors.'
      }
    ]
  },
  'Sukkur': {
    province: 'Sindh',
    activeThreats: [
      {
        disease: 'منہ کھُر و گل گھوٹو (FMD & HS)',
        severity: 'high',
        affectedRadiusKm: 28,
        precautionUrdu: 'دریا کنارے چرنے والے مویشیوں کی کھلیوں میں چونا چھڑکیں۔',
        precautionEnglish: 'Dust slaked lime in grazing alleys and drinking troughs.'
      }
    ]
  },
  'Peshawar': {
    province: 'KPK',
    activeThreats: [
      {
        disease: 'بھیڑ بکریوں کی چیچک (PPR / Goat Pox)',
        severity: 'high',
        affectedRadiusKm: 20,
        precautionUrdu: 'چھوٹی جگالی والے جانوروں کو پی پی آر کا حفاظتی ٹیکہ لگائیں۔',
        precautionEnglish: 'Vaccinate sheep & goats with PPR booster.'
      }
    ]
  },
  'Quetta': {
    province: 'Balochistan',
    activeThreats: [
      {
        disease: 'کانگو ہیمرجک فیور و چچڑ (CCHF Tick Threat)',
        severity: 'critical',
        affectedRadiusKm: 14,
        precautionUrdu: 'جانوروں کے چچڑ ہاتھ سے ہرگز نہ توڑیں، اینٹی ٹک لوشن استعمال کریں۔',
        precautionEnglish: 'Do not crush ticks with bare hands; use approved acaricides.'
      }
    ]
  }
};

// 5 Core Biosecurity Assessment Pillars
const AUDIT_QUESTIONS = [
  {
    category: 'entryControl',
    categoryTitleUrdu: '1. باڑہ داخلہ اور آمد و رفت کا تحفظ (Entry & Boundary Control)',
    categoryTitleEn: '1. Entry & Visitor Biosecurity',
    categoryIcon: Lock,
    items: [
      {
        key: 'entry_disinfection',
        labelUrdu: 'کیا فارم کے مین گیٹ پر گاڑیوں کے ٹائروں اور جوتوں کے لیے ڈس انفیکشن ٹینک / چونے کا ٹریک موجود ہے؟',
        labelEn: 'Is there a vehicle tire dip or slaked lime footbath at the farm entrance?',
        descUrdu: 'گاڑیوں کے ٹائر اور باہر سے آنے والے جوتے خطرناک وائرس فارم میں لاتے ہیں۔',
        descEn: 'Tires and footwear are primary vectors bringing FMD & viral pathogens into sheds.'
      },
      {
        key: 'boot_bath',
        labelUrdu: 'کیا ہر شیڈ کے داخلے پر پوٹاشیم پرمینگنیٹ (پنکی) یا چونے کا فٹ باتھ موجود ہے؟',
        labelEn: 'Is there a disinfectant foot-mat (KMnO4 / Virkon-S) at every shed entrance?',
        descUrdu: 'ایک شیڈ سے دوسرے شیڈ میں جراثیم کی منتقلی کو روکتا ہے۔',
        descEn: 'Prevents cross-contamination between different animal holding pens.'
      },
      {
        key: 'visitor_log',
        labelUrdu: 'کیا مہمانوں اور قصابوں/تاجروں کا داخلہ محدود ہے اور ان کے لیے الگ بوٹ/اوورآل ہیں؟',
        labelEn: 'Are visitors & cattle traders restricted with dedicated boots/coveralls?',
        descUrdu: 'منڈی سے آنے والے تاجر سب سے زیادہ بیماریاں پھیلاتے ہیں۔',
        descEn: 'Traders arriving straight from livestock markets carry severe infection loads.'
      },
      {
        key: 'perimeter_fence',
        labelUrdu: 'کیا فارم کے گرد چاردیواری یا باڑ موجود ہے تاکہ آوارہ کتے اور جنگلی جانور نہ آئیں؟',
        labelEn: 'Is the perimeter securely fenced against stray dogs and wild animals?',
        descUrdu: 'آوارہ کتے اینتھراکس اور نیوسپورا بیماریاں پھیلاتے ہیں۔',
        descEn: 'Stray dogs and wildlife spread rabies, anthrax, and abortion-causing agents.'
      }
    ]
  },
  {
    category: 'quarantine',
    categoryTitleUrdu: '2. قرنطینہ اور نئے جانوروں کا الگ باڑہ (Quarantine & Inflow)',
    categoryTitleEn: '2. Quarantine & Isolation Protocol',
    categoryIcon: ShieldAlert,
    items: [
      {
        key: 'quarantine_shed',
        labelUrdu: 'کیا منڈی سے خریدے گئے نئے جانوروں کو کم از کم 21 دن تک اصل ریوڑ سے الگ رکھا جاتا ہے؟',
        labelEn: 'Are newly purchased animals kept in a separate 21-day quarantine pen?',
        descUrdu: 'اکثر بیماریوں کے جراثیم 14 سے 21 دن بعد ظاہر ہوتے ہیں۔',
        descEn: 'Most contagious viral incubation cycles manifest within 14-21 days.'
      },
      {
        key: 'isolation_sick',
        labelUrdu: 'کیا بیمار جانور کو فوری طور پر تندرست جانوروں سے دور الگ آئسولیشن شیڈ میں منتقل کیا جاتا ہے؟',
        labelEn: 'Are sick cattle showing fever or cough immediately isolated?',
        descUrdu: 'بیمار جانور سے ایک ہی رات میں پورا ریوڑ متاثر ہو سکتا ہے۔',
        descEn: 'A single infected animal can contaminate the entire herd overnight.'
      },
      {
        key: 'vet_check_inflow',
        labelUrdu: 'کیا ریوڑ میں ملانے سے پہلے نئے جانور کا ڈاکٹر سے معائنہ، ڈیورمنگ اور ویکسین کی جاتی ہے؟',
        labelEn: 'Are new animals checked by a vet, dewormed, and vaccinated before integration?',
        descUrdu: 'پیٹ کے کیڑے اور چھپی بیماریاں فارم کو تباہ کر دیتی ہیں۔',
        descEn: 'Eliminates subclinical parasites and blood protozoans before entry.'
      }
    ]
  },
  {
    category: 'sanitation',
    categoryTitleUrdu: '3. صفائی، چارہ اور پینے کے پانی کا تحفظ (Sanitation & Hygiene)',
    categoryTitleEn: '3. Sanitation, Water & Feed Safety',
    categoryIcon: Droplets,
    items: [
      {
        key: 'daily_dung_removal',
        labelUrdu: 'کیا باڑے سے گوبر، پیشاب اور کیچڑ روزانہ باقاعدگی سے شیڈ سے دور نکالا جاتا ہے؟',
        labelEn: 'Is dung, slurry, and wet bedding cleared out of pens daily?',
        descUrdu: 'گیلی جگہ اور بدبو بیکٹیریا کی افزائش گاہ بنتی ہے۔',
        descEn: 'Moist organic waste breeds deadly bacteria, foot rot, and flies.'
      },
      {
        key: 'clean_water_source',
        labelUrdu: 'کیا جانوروں کے پینے کا پانی صاف فلٹرڈ ہے اور کھلیوں کی ہفتہ وار بلیچ سے صفائی ہوتی ہے؟',
        labelEn: 'Is drinking water clean/tested and troughs scrubbed weekly?',
        descUrdu: 'گندا کائی والا پانی جگر کے کیڑے اور پیچش پیدا کرتا ہے۔',
        descEn: 'Algae-covered troughs spread liver fluke and enteric pathogens.'
      },
      {
        key: 'feed_pest_proof',
        labelUrdu: 'کیا ونڈا اور سائلج خشک، ہوادار اور چوہوں و پرندوں سے محفوظ جگہ پر رکھا جاتا ہے؟',
        labelEn: 'Is feed, silage, and concentrate stored dry and pest-proof?',
        descUrdu: 'پھپھوندی لگا ونڈا افلاٹوکسن زہر پیدا کرتا ہے جس سے دودھ خراب ہوتا ہے۔',
        descEn: 'Moldy fodder generates aflatoxins which poison liver and contaminate milk.'
      },
      {
        key: 'fly_tick_control',
        labelUrdu: 'کیا باڑے میں باقاعدگی سے مکھی، مچھر اور چچڑ مار سپرے (سائپرمیتھرین) کیا جاتا ہے؟',
        labelEn: 'Is there a routine weekly fly, mosquito, and tick control spraying program?',
        descUrdu: 'لمپی سکن اور چچڑ بخار 100% خون چوسنے والے کیڑوں سے پھیلتے ہیں۔',
        descEn: 'Vectors transmit 100% of Lumpy Skin and Theileriosis blood infections.'
      }
    ]
  },
  {
    category: 'vaccination',
    categoryTitleUrdu: '4. حفاظتی ٹیکہ جات اور طبی احتیاط (Vaccines & Health)',
    categoryTitleEn: '4. Immunization & Medical Hygiene',
    categoryIcon: Syringe,
    items: [
      {
        key: 'fmd_vaccinated',
        labelUrdu: 'کیا تمام مویشیوں کو منہ کھُر (FMD) کا سالانہ ٹیکہ اور بوسٹر لگا ہوا ہے؟',
        labelEn: 'Are all herd cattle up-to-date with FMD (Foot & Mouth) vaccination?',
        descUrdu: 'منہ کھر سے دودھ کی پیداوار 80 فیصد گر جاتی ہے اور کھر گل جاتے ہیں۔',
        descEn: 'FMD causes catastrophic milk loss and permanent hoof damage.'
      },
      {
        key: 'lsd_vaccinated',
        labelUrdu: 'کیا گائے کے ریوڑ کو لمپی سکن وائرس (LSD) یا بکریوں کو چیچک کا ٹیکہ لگا ہوا ہے؟',
        labelEn: 'Is the herd immunized against Lumpy Skin Disease (LSD) / Pox?',
        descUrdu: 'لمپی سکن سے جانور کی جلد، پھیپھڑے اور بچہ ضائع ہو جاتا ہے۔',
        descEn: 'Prevents necrotic skin nodules, severe fever, and abortions.'
      },
      {
        key: 'hs_vaccinated',
        labelUrdu: 'کیا برسات کے موسم سے پہلے تمام جانوروں کو گل گھوٹو (HS) کا ٹیکہ لگا تھا؟',
        labelEn: 'Was pre-monsoon Hemorrhagic Septicemia (HS) vaccine administered?',
        descUrdu: 'گل گھوٹو چند گھنٹوں میں گائے اور بھینس کی جان لے لیتا ہے۔',
        descEn: 'HS is a hyper-acute fatal disease killing animals within 24 hours.'
      },
      {
        key: 'single_use_needle',
        labelUrdu: 'کیا ایک جانور پر استعمال شدہ سوئی اور سرنج دوسرے جانور پر لگانے سے پرہیز کیا جاتا ہے؟',
        labelEn: 'Are sterile single-use needles utilized to prevent cross-injection infection?',
        descUrdu: 'گندی سوئی سے خون کے کینسر اور متعدی جراثیم منتقل ہوتے ہیں۔',
        descEn: 'Reusing needles directly inoculates blood protozoans between animals.'
      }
    ]
  },
  {
    category: 'wasteManagement',
    categoryTitleUrdu: '5. فضلہ تلفی اور چوآئی کی صفائی (Disposal & Milking Hygiene)',
    categoryTitleEn: '5. Biowaste Disposal & Milking Hygiene',
    categoryIcon: Trash2,
    items: [
      {
        key: 'clean_milking',
        labelUrdu: 'کیا دودھ دوہنے سے پہلے اور بعد تھنوں کی پاوویڈون آئوڈین سے صفائی و ڈپنگ کی جاتی ہے؟',
        labelEn: 'Are teats cleaned and dipped with antiseptic (Povidone Iodine) before & after milking?',
        descUrdu: 'تھنوں کی بیماری (ساڑو / Mastitis) سے بچاؤ کا سب سے مؤثر طریقہ ہے۔',
        descEn: 'Post-milking teat dipping slashes clinical mastitis by up to 70%.'
      },
      {
        key: 'safe_carcass_burial',
        labelUrdu: 'کیا مردہ جانور اور جیر کو فارم سے دور چونے کے ساتھ 6 فٹ گہرے گڑھے میں دبایا جاتا ہے؟',
        labelEn: 'Are deceased livestock or placentas buried deeply with slaked lime?',
        descUrdu: 'مردہ جانور کو کھلے میں پھینکنا پورے گاؤں میں بیماری پھیلا دیتا ہے۔',
        descEn: 'Open carcass dumping exposes scavenger dogs and air to deadly spores.'
      }
    ]
  }
];

export const BiosecurityAssessment: React.FC<BiosecurityAssessmentProps> = ({
  user,
  animals = [],
  language,
  executionMode = 'online'
}) => {
  const isEn = language === 'en';

  // State management
  const [selectedDistrict, setSelectedDistrict] = useState<string>(user.district || 'Sahiwal');
  const [selectedProvince, setSelectedProvince] = useState<string>('Punjab');
  const [farmName, setFarmName] = useState<string>(user.farmName || 'Al-Rehman Cattle Farm');
  const [farmerName, setFarmerName] = useState<string>(user.name || 'Chaudhry Ahmed');
  const [herdSize, setHerdSize] = useState<number>(animals.length > 0 ? animals.length : 16);
  const [speciesPrimary, setSpeciesPrimary] = useState<string>('cow');

  // Checklist answers state
  const [answers, setAnswers] = useState<Record<string, boolean>>({
    entry_disinfection: false,
    boot_bath: false,
    visitor_log: false,
    perimeter_fence: true,
    quarantine_shed: false,
    isolation_sick: true,
    vet_check_inflow: false,
    daily_dung_removal: true,
    clean_water_source: true,
    feed_pest_proof: true,
    fly_tick_control: false,
    fmd_vaccinated: true,
    lsd_vaccinated: false,
    hs_vaccinated: true,
    single_use_needle: false,
    clean_milking: true,
    safe_carcass_burial: false
  });

  const [activeTab, setActiveTab] = useState<'assessment' | 'history' | 'guide'>('assessment');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<BiosecurityAssessmentType | null>(null);
  const [history, setHistory] = useState<BiosecurityAssessmentType[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [ttsLoading, setTtsLoading] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [expandedPillar, setExpandedPillar] = useState<string>('entryControl');

  // Load history on mount
  useEffect(() => {
    const saved = getStoredBiosecurityAssessments();
    setHistory(saved);
    if (saved.length > 0 && !currentAssessment) {
      setCurrentAssessment(saved[0]);
    }
  }, []);

  // Update province when district changes
  useEffect(() => {
    if (DISTRICTS_DATA[selectedDistrict]) {
      setSelectedProvince(DISTRICTS_DATA[selectedDistrict].province);
    }
  }, [selectedDistrict]);

  // Calculate live preview score from current checklist
  const calculateLiveScore = () => {
    const total = Object.keys(answers).length;
    let yesCount = 0;
    for (const k in answers) {
      if (answers[k]) yesCount++;
    }
    return Math.round((yesCount / total) * 100);
  };

  const liveScore = calculateLiveScore();
  const liveGrade = liveScore >= 80 ? 'A' : liveScore >= 60 ? 'B' : 'C';

  // Toggle checklist checkbox
  const handleToggle = (key: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Run AI Assessment Generation
  const handleRunAssessment = async () => {
    setLoadingAI(true);
    stopHybrid();
    setIsSpeaking(false);
    setTtsLoading(false);

    try {
      const activeThreats = DISTRICTS_DATA[selectedDistrict]?.activeThreats || [
        {
          disease: 'منہ کھُر و لمپی سکن (FMD & LSD)',
          severity: 'high',
          affectedRadiusKm: 20,
          precautionUrdu: 'داخلی گیٹ پر چونے کا فٹ باتھ بنائیں اور مکھی مار سپرے کریں۔',
          precautionEnglish: 'Install gate footbath and anti-vector spray.'
        }
      ];

      const result = await aiService.assessBiosecurity({
        farmName,
        farmerName,
        district: selectedDistrict,
        province: selectedProvince,
        herdSize,
        speciesPrimary,
        answers,
        activeLocalThreats: activeThreats,
        language,
        mode: executionMode === 'offline' ? 'offline' : 'online'
      });

      setCurrentAssessment(result);
      saveStoredBiosecurityAssessment(result);
      setHistory(getStoredBiosecurityAssessments());
    } catch (e) {
      console.error('Biosecurity evaluation failed:', e);
    } finally {
      setLoadingAI(false);
    }
  };

  // Voice playback of AI summary
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopHybrid();
      setIsSpeaking(false);
      setTtsLoading(false);
    } else if (currentAssessment?.aiSummary) {
      setIsSpeaking(true);
      setTtsLoading(true);
      speakHybrid(currentAssessment.aiSummary, {
        onReady: () => setTtsLoading(false),
        onEnd: () => {
          setIsSpeaking(false);
          setTtsLoading(false);
        },
        onError: () => {
          setIsSpeaking(false);
          setTtsLoading(false);
        },
      });
    }
  };

  const activeDistrictThreats = DISTRICTS_DATA[selectedDistrict]?.activeThreats || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl">
        <div className="absolute -top-16 -end-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -start-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
              <span>{isEn ? 'Biosecurity Shield & Threat Defense' : 'فارم بائیو سیکیورٹی و وبائی دفاعی نظام'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isEn ? 'Farm Biosecurity Self-Assessment' : 'فارم بائیو سیکیورٹی اسسمنٹ و تحفظ'}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isEn 
                ? 'Conduct a comprehensive self-check of your shed environment, gate entry protocols, and disease barriers. Get Gemini AI recommendations customized to active outbreaks in your district.'
                : 'اپنے فارم کے داخلی راستوں، قرنطینہ باڑے، صفائی اور ٹیکہ جات کا مکمل معائنہ کریں۔ اپنے ضلع میں پھیلنے والی بیماریوں سے بچاؤ کا اے آئی حل حاصل کریں۔'}
            </p>
          </div>

          {/* Quick Score Gauge in Header */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 self-start md:self-auto shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-white/20"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className={`${
                    liveScore >= 80 ? 'text-emerald-400' : liveScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                  } transition-all duration-500`}
                  fill="transparent"
                  strokeDasharray="163.36"
                  strokeDashoffset={163.36 - (163.36 * liveScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-black">{liveScore}%</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {isEn ? 'Live Shield Score' : 'موجودہ حفاظتی اسکور'}
              </div>
              <div className="text-sm font-black flex items-center space-x-1.5 rtl:space-x-reverse">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  liveScore >= 80 ? 'bg-emerald-400' : liveScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
                <span>Grade {liveGrade}</span>
                <span className="text-xs font-normal text-slate-300">
                  {liveGrade === 'A' ? (isEn ? 'Secure' : 'محفوظ') : liveGrade === 'B' ? (isEn ? 'Moderate' : 'درمیانہ') : (isEn ? 'Vulnerable' : 'خطرناک')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-6 pt-4 border-t border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              activeTab === 'assessment'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isEn ? 'Live Self-Audit' : 'فارم معائنہ و چیک لسٹ'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isEn ? 'Audit History' : 'سابقہ ریکارڈز'} ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isEn ? 'Biosecurity Protocols Guide' : 'رہنما اصول و ڈس انفیکٹنٹ'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Tab Viewports */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          
          {/* Farm & Regional Settings Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                  {isEn ? 'Location & Herd Parameters' : 'فارم اور علاقائی معلومات'}
                </h3>
              </div>

              <span className="text-[11px] font-bold text-slate-400">
                {isEn ? 'Select your district to load local disease radar' : 'ضلع منتخب کریں تاکہ مقامی وبائی الرٹ لوڈ ہو'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* District Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'District (ضلع)' : 'ضلع منتخب کریں:'}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {Object.keys(DISTRICTS_DATA).map(d => (
                    <option key={d} value={d}>
                      {d} ({DISTRICTS_DATA[d].province})
                    </option>
                  ))}
                </select>
              </div>

              {/* Farm Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Farm Name' : 'فارم کا نام:'}
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Al-Madina Cattle Farm"
                />
              </div>

              {/* Herd Size */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Total Cattle Count' : 'کل جانوروں کی تعداد:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={herdSize}
                  onChange={(e) => setHerdSize(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Primary Species */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Primary Livestock' : 'بنیادی جانور:'}
                </label>
                <select
                  value={speciesPrimary}
                  onChange={(e) => setSpeciesPrimary(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="cow">گائے (Dairy Cows)</option>
                  <option value="buffalo">بھینس (Nili Ravi Buffaloes)</option>
                  <option value="goat">بکریاں (Goats & Sheep)</option>
                  <option value="mixed">مکس فارم (Mixed Herd)</option>
                </select>
              </div>
            </div>

            {/* Real-time District Disease Radar Alert */}
            {activeDistrictThreats.length > 0 && (
              <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center space-x-2 rtl:space-x-reverse">
                      <span>{isEn ? `Active Outbreak Radar in ${selectedDistrict}:` : `ضلع ${selectedDistrict} میں فعال وبائی الرٹ:`}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        HIGH RISK
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                      {activeDistrictThreats.map(t => isEn ? `${t.disease} (within ${t.affectedRadiusKm}km) - ${t.precautionEnglish}` : `${t.disease} (${t.affectedRadiusKm} کلومیٹر کے دائرے میں) - ${t.precautionUrdu}`).join(' • ')}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-end">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    {isEn ? 'Biosecurity Mandatory' : 'حفاظتی تدابیر لازمی'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. 5-Pillar Audit Checklist Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? '5-Pillar Biosecurity Inspection Checklist' : 'پانچ بنیادی بائیو سیکیورٹی ستون و معائنہ'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn ? 'Toggle the checkboxes for the safety protocols currently active on your farm.' : 'وہ تمام حفاظتی تدابیر منتخب کریں جو آپ کے فارم پر اس وقت موجود ہیں۔'}
                </p>
              </div>

              <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {Object.values(answers).filter(Boolean).length} / {Object.keys(answers).length} {isEn ? 'Active' : 'مکمل'}
              </div>
            </div>

            {/* Accordion Pillars */}
            <div className="space-y-3">
              {AUDIT_QUESTIONS.map(pillar => {
                const Icon = pillar.categoryIcon;
                const isExpanded = expandedPillar === pillar.category;
                const pillarAnswered = pillar.items.filter(i => answers[i.key]).length;
                const pillarTotal = pillar.items.length;
                const pillarPercent = Math.round((pillarAnswered / pillarTotal) * 100);

                return (
                  <div
                    key={pillar.category}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Pillar Header */}
                    <div
                      onClick={() => setExpandedPillar(isExpanded ? '' : pillar.category)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-sm shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {isEn ? pillar.categoryTitleEn : pillar.categoryTitleUrdu}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {pillarAnswered} of {pillarTotal} {isEn ? 'Protections Active' : 'حفاظتی اقدامات فعال'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse w-28">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                pillarPercent >= 80 ? 'bg-emerald-500' : pillarPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              } transition-all`}
                              style={{ width: `${pillarPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">{pillarPercent}%</span>
                        </div>

                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180" />
                        )}
                      </div>
                    </div>

                    {/* Pillar Checklist Items */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-1 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
                        {pillar.items.map(item => {
                          const isChecked = !!answers[item.key];
                          return (
                            <div
                              key={item.key}
                              onClick={() => handleToggle(item.key)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 rtl:space-x-reverse ${
                                isChecked
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isChecked 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold leading-snug ${
                                  isChecked ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {isEn ? item.labelEn : item.labelUrdu}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                                  {isEn ? item.descEn : item.descUrdu}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-900 p-6 rounded-3xl text-white shadow-lg">
            <div className="space-y-1">
              <h4 className="text-base font-black flex items-center space-x-2 rtl:space-x-reverse">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span>{isEn ? 'Ready for AI Vulnerability Analysis?' : 'اے آئی بائیو سیکیورٹی تجزیہ و پلان حاصل کریں'}</span>
              </h4>
              <p className="text-xs text-emerald-200">
                {isEn 
                  ? 'Gemini will cross-reference your answers with local epidemics in your district and synthesize an immediate defense plan.'
                  : 'جیمینائی اے آئی آپ کی چیک لسٹ اور مقامی وبائی صورتحال کا تجزیہ کر کے 7 روزہ ایکشن پلان تیار کرے گا۔'}
              </p>
            </div>

            <button
              onClick={handleRunAssessment}
              disabled={loadingAI}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 cursor-pointer shrink-0"
            >
              {loadingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isEn ? 'Analyzing Biosecurity...' : 'بائیو سیکیورٹی کا تجزیہ ہو رہا ہے...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{isEn ? 'Run AI Assessment & Plan' : 'اے آئی بائیو سیکیورٹی پلان بنائیں'}</span>
                </>
              )}
            </button>
          </div>

          {/* 5. Assessment Result Card Display */}
          {currentAssessment && (
            <div className="space-y-6 pt-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
                
                {/* Result Header & Score Summary */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        currentAssessment.grade === 'A' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' 
                          : currentAssessment.grade === 'B'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                      }`}>
                        Grade {currentAssessment.grade} • {currentAssessment.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(currentAssessment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {currentAssessment.farmName} — {isEn ? 'Biosecurity Shield Analysis' : 'بائیو سیکیورٹی شیلڈ رپورٹ'}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isEn ? `Location: ${currentAssessment.district}, ${currentAssessment.province} • Herd: ${currentAssessment.herdSize} ${currentAssessment.speciesPrimary}s` : `مقام: ضلع ${currentAssessment.district}، صوبہ ${currentAssessment.province} • مویشی: ${currentAssessment.herdSize}`}
                    </p>
                  </div>

                  {/* Actions: Voice, Certificate, Print */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                    <button
                      onClick={handleToggleVoice}
                      disabled={ttsLoading}
                      className={`p-3 rounded-2xl border transition-all flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold ${
                        isSpeaking
                          ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      } disabled:opacity-70`}
                      title={isEn ? 'Listen to AI Analysis' : 'آواز میں سنیں'}
                    >
                      {ttsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSpeaking ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {ttsLoading
                          ? (isEn ? 'Loading...' : 'لوڈ ہو رہا ہے...')
                          : isSpeaking
                            ? (isEn ? 'Stop' : 'بند کریں')
                            : (isEn ? 'Listen' : 'سنیں')}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowCertificateModal(true)}
                      className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isEn ? 'View Certificate' : 'حفاظتی سرٹیفکیٹ'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Executive Summary Box */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-black text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? 'AI Biosecurity Officer Verdict' : 'اے آئی ویٹرنری بائیو سیکیورٹی تجزیہ'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {currentAssessment.aiSummary}
                  </p>
                </div>

                {/* Pillar Category Progress Bars */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {isEn ? 'Category Score Breakdown' : 'بنیادی شعبہ جات کی کارکردگی:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(currentAssessment.categoryScores || {}).map(([key, rawVal]) => {
                      const val = Number(rawVal) || 0;
                      const titles: Record<string, string> = {
                        entryControl: isEn ? 'Entry Control' : 'گیٹ داخلہ',
                        quarantine: isEn ? 'Quarantine Pen' : 'قرنطینہ باڑہ',
                        sanitation: isEn ? 'Sanitation & Water' : 'صفائی و پانی',
                        vaccination: isEn ? 'Vaccinations' : 'حفاظتی ٹیکے',
                        wasteManagement: isEn ? 'Waste Disposal' : 'فضلہ تلفی'
                      };
                      return (
                        <div key={key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{titles[key] || key}</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">{val}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Critical Vulnerabilities Alert */}
                {currentAssessment.criticalVulnerabilities?.length > 0 && (
                  <div className="p-5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2.5">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-black text-rose-800 dark:text-rose-300">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>{isEn ? 'Critical Vulnerabilities Detected' : 'فارم کے اہم ترین خطرات و خامیاں:'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                      {currentAssessment.criticalVulnerabilities.map((vuln, idx) => (
                        <li key={idx} className="flex items-start space-x-2 rtl:space-x-reverse">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{vuln}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prioritized Action Steps */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{isEn ? 'Prioritized Immediate Remediation Actions' : 'فوری ترجیحی حفاظتی اقدامات'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentAssessment.actionSteps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              step.priority === 'urgent' 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : step.priority === 'high'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {step.priority}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              {step.timeFrame}
                            </span>
                          </div>

                          <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {isEn ? step.title : step.titleUrdu}
                          </h5>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isEn ? step.detail : step.detailUrdu}
                          </p>
                        </div>

                        {step.estimatedCostPKR && (
                          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {isEn ? `Est. Cost: ${step.estimatedCostPKR}` : `تخمینہ لاگت: ${step.estimatedCostPKR}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Upgrade Roadmap */}
                {currentAssessment.upgradePlan7Days?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? '7-Day Farm Biosecurity Upgrade Schedule' : '7 روزہ بائیو سیکیورٹی بہتری کا شیڈول'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {currentAssessment.upgradePlan7Days.map((plan, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                              {plan.day}
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                              {plan.dayTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                            {isEn ? plan.taskEnglish : plan.taskUrdu}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Disinfectants in Pakistan */}
                {currentAssessment.recommendedDisinfectants?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                      <Droplets className="w-4 h-4 text-teal-600" />
                      <span>{isEn ? 'Recommended Disinfectant Formulations (Pakistani Market)' : 'منظور شدہ جراثیم کش ادویات اور فارمولے'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {currentAssessment.recommendedDisinfectants.map((chem, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/80 space-y-1 text-xs"
                        >
                          <h5 className="font-extrabold text-teal-950 dark:text-teal-200">
                            {isEn ? chem.name : chem.nameUrdu}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            <strong>{isEn ? 'Dilution:' : 'مقدار:'}</strong> {chem.dilution}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            <strong>{isEn ? 'Usage:' : 'استعمال:'}</strong> {chem.usage}
                          </p>
                          <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 mt-1">
                            {chem.costEstimate}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? 'Past Biosecurity Self-Audit History' : 'سابقہ بائیو سیکیورٹی آڈٹ کا ریکارڈ'}</span>
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {isEn ? 'No past assessments recorded yet. Conduct your first self-check above.' : 'ابھی تک کوئی سابقہ ریکارڈ موجود نہیں۔ اوپر فارم کا معائنہ کریں۔'}
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentAssessment(item);
                      setActiveTab('assessment');
                    }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : item.grade === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Grade {item.grade} • {item.score}%
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{item.farmName}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {item.district}, {item.province} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 rtl:space-x-reverse">
                      <span>{isEn ? 'View Report' : 'تفصیل دیکھیں'}</span>
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Guides & Knowledge Tab */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isEn ? 'Standard Biosecurity Operating Procedures (SOPs) for Livestock' : 'مویشی فارم بائیو سیکیورٹی کے لازمی رہنما اصول (SOPs)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isEn ? 'Official protocols formulated with Livestock & Dairy Development Department guidelines.' : 'محکمہ لائیو سٹاک کے منظور شدہ حفاظتی اصول برائے مویشی پال کسان۔'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  {isEn ? '1. Isolation & Quarantine Rule of 21 Days' : '1. اکیس (21) روزہ قرنطینہ کا اصول'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEn 
                    ? 'Never introduce cattle bought from animal mandis (markets) directly into your herd. Keep them in a dedicated pen 30 feet away for 21 days while checking for fever, nasal discharge, and skin nodules.'
                    : 'منڈی سے خریدے گئے کسی بھی جانور کو فوراً اپنے پرانے ریوڑ میں نہ ملائیں۔ کم از کم 21 دن تک 30 فٹ دور الگ باڑے میں رکھیں اور روزانہ درجہ حرارت اور جلد چیک کریں۔'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                <h4 className="text-sm font-extrabold text-teal-900 dark:text-teal-200">
                  {isEn ? '2. Slaked Lime (چونا) & Potassium Permanganate (پنکی)' : '2. بجھے ہوئے چونے اور پنکی کا استعمال'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEn 
                    ? 'Slaked lime is the most cost-effective disinfectant in Pakistan (Rs. 40/kg). Dust floors weekly and maintain a 1:1000 pink KMnO4 footbath at the entrance gate to neutralize viruses on boots.'
                    : 'بجھا ہوا چونا سب سے سستا اور کارآمد جراثیم کش ہے۔ ہفتے میں ایک بار فرش پر چونے کا چھڑکاؤ کریں اور فارم گیٹ پر پنکی کے پانی کا فٹ باتھ بنائیں۔'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                <h4 className="text-sm font-extrabold text-blue-900 dark:text-blue-200">
                  {isEn ? '3. Needle & Syringe Sanitation' : '3. سرنج اور سوئی کی صفائی'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEn 
                    ? 'Never use one injection needle on multiple cattle. Blood-borne parasites like Theileriosis, Anaplasmosis, and Bovine Leucosis are spread rapidly via dirty reused needles.'
                    : 'ایک جانور کی استعمال شدہ سوئی دوسرے جانور کو ہرگز نہ لگائیں۔ اس سے چچڑ بخار، ایناپلازموسس اور خون کی متعدی بیماریاں ایک سے دوسرے میں منتقل ہو جاتی ہیں۔'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                <h4 className="text-sm font-extrabold text-purple-900 dark:text-purple-200">
                  {isEn ? '4. Carcass Disposal Protocols' : '4. مردہ جانور اور جیر کی محفوظ تدفین'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEn 
                    ? 'Dead animals must be buried 6 feet deep with a generous layer of slaked lime. Never dump carcasses in open canals or fields as it spreads anthrax and water-borne pathogens.'
                    : 'مردہ جانور یا جیر کو کھلے میں نہ پھینکیں بلکہ 6 فٹ گہرے گڑھے میں چونا ڈال کر دفنائیں۔ کھلے میں پھینکنے سے کتے اور پرندے وائرس پورے گاؤں میں پھیلا دیتے ہیں۔'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Official Certificate Modal */}
      {showCertificateModal && currentAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            
            {/* Certificate Header Stamp */}
            <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {isEn ? 'Farm Biosecurity Safety Certificate' : 'قومی فارم بائیو سیکیورٹی سرٹیفکیٹ'}
              </h3>
              <p className="text-xs text-slate-400">
                Kisan Dost AI Livestock Verification Registry • Ref #{currentAssessment.id.substring(4, 12)}
              </p>
            </div>

            {/* Certificate Details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 font-bold">{isEn ? 'Farm Name:' : 'فارم کا نام:'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentAssessment.farmName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 font-bold">{isEn ? 'Farmer Name:' : 'کسان کا نام:'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentAssessment.farmerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 font-bold">{isEn ? 'District & Province:' : 'ضلع و صوبہ:'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentAssessment.district}, {currentAssessment.province}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 font-bold">{isEn ? 'Herd Size:' : 'جانوروں کی تعداد:'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentAssessment.herdSize} Animals</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-400 font-bold">{isEn ? 'Biosecurity Grade:' : 'حفاظتی گریڈ:'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">Grade {currentAssessment.grade} ({currentAssessment.score}%)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold">{isEn ? 'Audit Date:' : 'تاریخ معائنہ:'}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(currentAssessment.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              ✓ Verified by Kisan Dost AI Veterinary Expert Engine & Local Outbreak Radar
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
              >
                <Printer className="w-4 h-4" />
                <span>{isEn ? 'Print Certificate' : 'پرنٹ / ڈاؤن لوڈ'}</span>
              </button>

              <button
                onClick={() => setShowCertificateModal(false)}
                className="py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                {isEn ? 'Close' : 'بند کریں'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
