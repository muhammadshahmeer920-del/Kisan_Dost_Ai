import { Animal, Species, Vaccination } from '../types';

export interface VaccineProtocol {
  key: string;
  nameUrdu: string;
  nameEnglish: string;
  diseaseTarget: string;
  targetSpecies: Species[];
  firstDoseAgeMonths: number;
  frequencyMonths: number;
  seasonAlertUrdu?: string;
  dosageUrdu: string;
  routeUrdu: string;
  importance: 'critical' | 'high' | 'medium';
  descriptionUrdu: string;
}

export const VACCINE_PROTOCOLS: VaccineProtocol[] = [
  {
    key: 'hs',
    nameUrdu: 'گل گھوٹو (Hemorrhagic Septicemia - HS)',
    nameEnglish: 'Hemorrhagic Septicemia (HS)',
    diseaseTarget: 'Hemorrhagic Septicemia (گل گھوٹو)',
    targetSpecies: ['cow', 'buffalo', 'camel'],
    firstDoseAgeMonths: 4,
    frequencyMonths: 6,
    seasonAlertUrdu: 'مون سون سے قبل (مئی/جون) اور سردیوں سے قبل (نومبر/دسمبر) لازمی',
    dosageUrdu: '5 ملی لیٹر (زیر جلد / SC)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'critical',
    descriptionUrdu: 'گائے اور بھینسوں کی انتہائی جان لیوا بیماری۔ ہر 6 ماہ بعد بوسٹر ضروری ہے۔',
  },
  {
    key: 'fmd',
    nameUrdu: 'منہ کھُر (Foot & Mouth Disease - FMD)',
    nameEnglish: 'Foot & Mouth Disease (FMD)',
    diseaseTarget: 'Foot & Mouth Disease (منہ کھُر)',
    targetSpecies: ['cow', 'buffalo', 'goat', 'sheep'],
    firstDoseAgeMonths: 3,
    frequencyMonths: 6,
    seasonAlertUrdu: 'فروری/مارچ اور ستمبر/اکتوبر میں سالانہ دو بار',
    dosageUrdu: '3 تا 5 ملی لیٹر (گائے/بھینس) یا 2 ملی لیٹر (بکری)',
    routeUrdu: 'گوشت میں (Intramuscular)',
    importance: 'critical',
    descriptionUrdu: 'منہ اور کھروں میں چھالے، دودھ میں شدید کمی۔ سال میں 2 بار باقاعدہ ٹیکہ کاری۔',
  },
  {
    key: 'lsd',
    nameUrdu: 'لمپی سکن (Lumpy Skin Disease - LSD)',
    nameEnglish: 'Lumpy Skin Disease (LSD)',
    diseaseTarget: 'Lumpy Skin Disease (لمپی سکن)',
    targetSpecies: ['cow', 'buffalo'],
    firstDoseAgeMonths: 4,
    frequencyMonths: 12,
    seasonAlertUrdu: 'مچھر اور مکھیاں بڑھنے سے پہلے (فروری/مارچ) سالانہ ٹیکہ',
    dosageUrdu: '3 ملی لیٹر (زیرِ جلد / SC)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'critical',
    descriptionUrdu: 'جلد پر گلٹیاں اور تیز بخار۔ سالانہ ایک بار حفاظتی ٹیکہ لگانا لازم ہے۔',
  },
  {
    key: 'bq',
    nameUrdu: 'چوڑے دی بیماری / چرچڑی بخار (Black Quarter - BQ)',
    nameEnglish: 'Black Quarter (BQ)',
    diseaseTarget: 'Black Quarter (چرچڑی بخار)',
    targetSpecies: ['cow', 'buffalo', 'sheep'],
    firstDoseAgeMonths: 6,
    frequencyMonths: 12,
    seasonAlertUrdu: 'برسات اور مون سون سے قبل (جون/جولائی)',
    dosageUrdu: '5 ملی لیٹر (زیرِ جلد)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'high',
    descriptionUrdu: 'پٹھوں میں گیس اور لنگڑا پن پیدا کرنے والا جان لیوا جراثیمی حملہ۔',
  },
  {
    key: 'anthrax',
    nameUrdu: 'اینتھریکس (Anthrax Vaccine)',
    nameEnglish: 'Anthrax Vaccine',
    diseaseTarget: 'Anthrax (اینتھریکس)',
    targetSpecies: ['cow', 'buffalo', 'sheep', 'goat', 'horse'],
    firstDoseAgeMonths: 6,
    frequencyMonths: 12,
    seasonAlertUrdu: 'سالانہ مئی/جون میں گرمی کے آغاز پر',
    dosageUrdu: '1 ملی لیٹر (زیرِ جلد)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'high',
    descriptionUrdu: 'اچانک موت کا باعث بننے والا جراثیم۔ متاثرہ علاقوں میں سالانہ ٹیکہ۔',
  },
  {
    key: 'brucellosis',
    nameUrdu: 'بروسیلوسس حفاظتی ٹیکہ (Brucellosis S19/RB51)',
    nameEnglish: 'Brucellosis (Calfhood)',
    diseaseTarget: 'Brucellosis (حمل گرنے کی بیماری)',
    targetSpecies: ['cow', 'buffalo'],
    firstDoseAgeMonths: 4,
    frequencyMonths: 999, // Once in lifetime for heifers (4-8 months)
    seasonAlertUrdu: 'صرف 4 سے 8 ماہ کی بچھڑیوں کو زندگی میں ایک بار',
    dosageUrdu: '2 ملی لیٹر (زیرِ جلد)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'high',
    descriptionUrdu: 'آخری سہ ماہی میں حمل ضائع ہونے سے بچاؤ کے لیے چھوٹی بچھڑیوں کی ویکسین۔',
  },
  {
    key: 'et',
    nameUrdu: 'فڑکی بخار (Enterotoxemia - ET)',
    nameEnglish: 'Enterotoxemia (Pulpy Kidney - ET)',
    diseaseTarget: 'Enterotoxemia (فڑکی بخار)',
    targetSpecies: ['goat', 'sheep'],
    firstDoseAgeMonths: 2,
    frequencyMonths: 6,
    seasonAlertUrdu: 'موسم بہار اور نئے سرسبز چارے کے آغاز پر',
    dosageUrdu: '2.5 ملی لیٹر (زیرِ جلد)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'critical',
    descriptionUrdu: 'بھیڑ بکریوں میں زیادہ چارہ کھانے سے زہریلے اثرات اور اچانک موت کا سدباب۔',
  },
  {
    key: 'ppr',
    nameUrdu: 'بکری طاعون / کاٹا (PPR Vaccine)',
    nameEnglish: 'Peste des Petits Ruminants (PPR)',
    diseaseTarget: 'PPR (بکری طاعون)',
    targetSpecies: ['goat', 'sheep'],
    firstDoseAgeMonths: 3,
    frequencyMonths: 24, // 2 to 3 years immunity
    seasonAlertUrdu: 'سال میں کسی بھی وقت (نئے جانور شامل کرنے سے قبل)',
    dosageUrdu: '1 ملی لیٹر (زیرِ جلد)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'critical',
    descriptionUrdu: 'بکریوں میں اسہال، نمونیا اور منہ کے چھالوں کی مہلک وائرل بیماری۔',
  },
  {
    key: 'ccpp',
    nameUrdu: 'بکریوں کا نمونیا (CCPP Vaccine)',
    nameEnglish: 'Contagious Caprine Pleuropneumonia (CCPP)',
    diseaseTarget: 'CCPP (بکریوں کا نمونیا)',
    targetSpecies: ['goat'],
    firstDoseAgeMonths: 3,
    frequencyMonths: 12,
    seasonAlertUrdu: 'سردیوں کے آغاز سے قبل (اکتوبر/نومبر)',
    dosageUrdu: '1 ملی لیٹر (زیرِ جلد)',
    routeUrdu: 'زیرِ جلد (Subcutaneous)',
    importance: 'high',
    descriptionUrdu: 'بکریوں کے پھیپھڑوں کا سخت انفیکشن اور کھانسی۔ سالانہ حفاظتی ٹیکہ۔',
  },
  {
    key: 'deworming',
    nameUrdu: 'پیٹ کے کیڑوں کا خاتمہ (Deworming Drench)',
    nameEnglish: 'Deworming Drench',
    diseaseTarget: 'Internal Parasites (پیٹ کے کیڑے)',
    targetSpecies: ['cow', 'buffalo', 'goat', 'sheep', 'camel', 'horse'],
    firstDoseAgeMonths: 1,
    frequencyMonths: 3,
    seasonAlertUrdu: 'ہر 3 ماہ بعد (موسم کی تبدیلی کے ساتھ بدل کر شربت پلائیں)',
    dosageUrdu: 'وزن کے حساب سے البینڈازول یا آئیورمیکٹن',
    routeUrdu: 'پلانا / Oral Drench یا سب کٹ',
    importance: 'high',
    descriptionUrdu: 'دودھ اور گوشت میں اضافہ، خون کی کمی اور جگر کے کیڑوں کا مکمل سدباب۔',
  },
];

export interface CalculatedVaccineDue {
  id: string;
  animalId: string;
  animalName: string;
  tagId: string;
  species: Species;
  ageMonths: number;
  vaccineKey: string;
  vaccineName: string;
  diseaseTarget: string;
  recommendedAgeMonths: number;
  frequencyMonths: number;
  lastGivenDate?: string;
  calculatedDueDate: string; // YYYY-MM-DD
  daysRemaining: number; // < 0 is overdue, 0 is today, > 0 is future
  status: 'overdue' | 'due_today' | 'due_soon' | 'upcoming';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  seasonAlertUrdu?: string;
  dosageUrdu: string;
  routeUrdu: string;
  isPrimaryDose: boolean;
  notesUrdu: string;
}

export interface VaccinationSummary {
  totalDueCount: number; // overdue + due_today + due_soon (<= 30 days)
  overdueCount: number;
  dueTodayCount: number;
  dueSoonCount: number; // 1-30 days
  upcomingCount: number; // > 30 days
  totalAnimalsProtected: number;
  protectionRatePercent: number;
  urgentActionRequired: boolean;
  items: CalculatedVaccineDue[];
}

/**
 * Calculates upcoming vaccination due dates based on age and history.
 */
export function calculateLivestockVaccinationSchedule(
  animals: Animal[],
  referenceDateStr: string = '2026-08-18'
): VaccinationSummary {
  const refDate = new Date(referenceDateStr);
  const calculatedItems: CalculatedVaccineDue[] = [];

  let protectedAnimalsCount = 0;

  animals.forEach((animal) => {
    const species = animal.species || 'cow';
    const ageMonths = animal.ageMonths || 12;
    const history = animal.vaccinationHistory || [];

    // Filter relevant protocols for this animal species
    const applicableProtocols = VACCINE_PROTOCOLS.filter((p) =>
      p.targetSpecies.includes(species)
    );

    let animalHasOverdue = false;

    applicableProtocols.forEach((protocol) => {
      // Check if animal is eligible based on age or lifetime restrictions
      if (protocol.key === 'brucellosis' && (animal.gender === 'male' || ageMonths > 12)) {
        // Brucellosis only for heifer calves 4-8 months
        return;
      }

      // Find matching vaccination in history (completed or scheduled)
      const matchingRecords = history.filter((v) => {
        const vName = (v.vaccineName || '').toLowerCase();
        const dTarget = (v.diseaseTarget || '').toLowerCase();
        const pKey = protocol.key.toLowerCase();
        const pTarget = protocol.diseaseTarget.toLowerCase();

        return (
          vName.includes(pKey) ||
          dTarget.includes(pKey) ||
          (pKey === 'hs' && (vName.includes('hs') || vName.includes('گھوٹو') || dTarget.includes('septicemia'))) ||
          (pKey === 'fmd' && (vName.includes('fmd') || vName.includes('کھُر') || dTarget.includes('mouth'))) ||
          (pKey === 'lsd' && (vName.includes('lsd') || vName.includes('لمپی') || dTarget.includes('lumpy'))) ||
          (pKey === 'bq' && (vName.includes('bq') || vName.includes('چرچڑی') || dTarget.includes('quarter'))) ||
          (pKey === 'anthrax' && (vName.includes('anthrax') || vName.includes('اینتھریکس'))) ||
          (pKey === 'et' && (vName.includes('et') || vName.includes('فڑکی') || dTarget.includes('enterotoxemia'))) ||
          (pKey === 'ppr' && (vName.includes('ppr') || vName.includes('طاعون') || dTarget.includes('ruminants'))) ||
          (pKey === 'ccpp' && (vName.includes('ccpp') || vName.includes('نمونیا'))) ||
          (pKey === 'deworming' && (vName.includes('deworm') || vName.includes('کیڑے') || dTarget.includes('parasite')))
        );
      });

      // Sort by dateGiven or scheduledDate descending to find the latest
      matchingRecords.sort((a, b) => {
        const dateA = new Date(a.dateGiven || a.scheduledDate || '1970-01-01').getTime();
        const dateB = new Date(b.dateGiven || b.scheduledDate || '1970-01-01').getTime();
        return dateB - dateA;
      });

      const latestRecord = matchingRecords[0];
      let calculatedDueDateStr: string;
      let isPrimaryDose = false;
      let lastGivenDate: string | undefined = undefined;

      if (latestRecord && (latestRecord.dateGiven || latestRecord.scheduledDate)) {
        lastGivenDate = latestRecord.dateGiven || latestRecord.scheduledDate;
        
        if (latestRecord.nextDueDate) {
          calculatedDueDateStr = latestRecord.nextDueDate;
        } else {
          // Add frequency months
          const lastDate = new Date(lastGivenDate);
          lastDate.setMonth(lastDate.getMonth() + protocol.frequencyMonths);
          calculatedDueDateStr = lastDate.toISOString().split('T')[0];
        }
      } else {
        // Never given in history
        isPrimaryDose = true;
        
        if (ageMonths >= protocol.firstDoseAgeMonths) {
          // Overdue / Due Now!
          // Calculate when it was first due based on DOB or age
          let dobDate = animal.dob ? new Date(animal.dob) : new Date(refDate);
          if (!animal.dob) {
            dobDate.setMonth(dobDate.getMonth() - ageMonths);
          }
          dobDate.setMonth(dobDate.getMonth() + protocol.firstDoseAgeMonths);
          calculatedDueDateStr = dobDate.toISOString().split('T')[0];
        } else {
          // Future due date when calf reaches eligible age
          let dobDate = animal.dob ? new Date(animal.dob) : new Date(refDate);
          if (!animal.dob) {
            dobDate.setMonth(dobDate.getMonth() - ageMonths);
          }
          dobDate.setMonth(dobDate.getMonth() + protocol.firstDoseAgeMonths);
          calculatedDueDateStr = dobDate.toISOString().split('T')[0];
        }
      }

      // Calculate days difference
      const dueDate = new Date(calculatedDueDateStr);
      const diffTime = dueDate.getTime() - refDate.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let status: 'overdue' | 'due_today' | 'due_soon' | 'upcoming';
      if (daysRemaining < 0) {
        status = 'overdue';
        animalHasOverdue = true;
      } else if (daysRemaining === 0) {
        status = 'due_today';
      } else if (daysRemaining <= 30) {
        status = 'due_soon';
      } else {
        status = 'upcoming';
      }

      let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (status === 'overdue') {
        urgency = protocol.importance === 'critical' ? 'critical' : 'high';
      } else if (status === 'due_today' || status === 'due_soon') {
        urgency = protocol.importance === 'critical' ? 'high' : 'medium';
      } else {
        urgency = 'low';
      }

      let notesUrdu = isPrimaryDose
        ? `عمر ${ageMonths} ماہ کی مناسبت سے پہلی بنیادی خوراک (Primary Dose)`
        : `پچھلی خوراک مورخہ ${lastGivenDate} کے مطابق اگلا بوسٹر شیڈول`;

      calculatedItems.push({
        id: `calc_${animal.id}_${protocol.key}`,
        animalId: animal.id,
        animalName: animal.name,
        tagId: animal.tagId,
        species: animal.species,
        ageMonths,
        vaccineKey: protocol.key,
        vaccineName: protocol.nameUrdu,
        diseaseTarget: protocol.diseaseTarget,
        recommendedAgeMonths: protocol.firstDoseAgeMonths,
        frequencyMonths: protocol.frequencyMonths,
        lastGivenDate,
        calculatedDueDate: calculatedDueDateStr,
        daysRemaining,
        status,
        urgency,
        seasonAlertUrdu: protocol.seasonAlertUrdu,
        dosageUrdu: protocol.dosageUrdu,
        routeUrdu: protocol.routeUrdu,
        isPrimaryDose,
        notesUrdu,
      });
    });

    if (!animalHasOverdue) {
      protectedAnimalsCount++;
    }
  });

  // Sort items: Overdue first (most overdue first), then Due Today, then Due Soon, then Upcoming
  calculatedItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdueCount = calculatedItems.filter((i) => i.status === 'overdue').length;
  const dueTodayCount = calculatedItems.filter((i) => i.status === 'due_today').length;
  const dueSoonCount = calculatedItems.filter((i) => i.status === 'due_soon').length;
  const upcomingCount = calculatedItems.filter((i) => i.status === 'upcoming').length;
  const totalDueCount = overdueCount + dueTodayCount + dueSoonCount;

  const protectionRatePercent =
    animals.length > 0
      ? Math.round(((animals.length - overdueCount) / animals.length) * 100)
      : 100;

  return {
    totalDueCount,
    overdueCount,
    dueTodayCount,
    dueSoonCount,
    upcomingCount,
    totalAnimalsProtected: protectedAnimalsCount,
    protectionRatePercent: Math.max(0, Math.min(100, protectionRatePercent)),
    urgentActionRequired: overdueCount > 0,
    items: calculatedItems,
  };
}
