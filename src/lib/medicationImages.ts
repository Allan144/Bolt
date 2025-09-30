// Simple medication icon system without external image searches
export interface MedicationImageResult {
  imageUrl: string;
  source: 'icon';
  confidence: number;
  description?: string;
}

// Cache for medication icons
const medicationCache = new Map<string, MedicationImageResult>();

// Normalize drug name for consistent processing
const normalizeDrugName = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(hcl|hctz|er|xl|sr|cr|la|od|xr|dr|mg|mcg|g|ml|tablet|capsule|cap|tab)\b/g, '') // Remove common suffixes
    .trim();
};

// Extract dosage amount and unit
const extractDosageInfo = (dosage: string): { amount: string; unit: string; strength: string } => {
  const dosageLower = dosage.toLowerCase();
  
  // Extract numeric amount
  const amountMatch = dosageLower.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? amountMatch[1] : '';
  
  // Extract unit
  const unitMatch = dosageLower.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|μg|g|ml|l|iu|units?|cc)/);
  const unit = unitMatch ? unitMatch[2] : 'mg';
  
  const strength = amount + unit;
  
  return { amount, unit, strength };
};

// Basic medication database for icon generation
const medicationDatabase = {
  // Pain Relief
  'acetaminophen': {
    aka: ['tylenol', 'paracetamol', 'apap'],
    category: 'pain-relief',
    shape: 'round',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  'ibuprofen': {
    aka: ['advil', 'motrin', 'nuprin'],
    category: 'pain-relief',
    shape: 'round',
    color: '#D2691E',
    textColor: '#FFFFFF'
  },
  'aspirin': {
    aka: ['bayer', 'bufferin', 'ecotrin'],
    category: 'pain-relief',
    shape: 'round',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  
  // Diabetes
  'metformin': {
    aka: ['glucophage', 'fortamet', 'glumetza'],
    category: 'diabetes',
    shape: 'oval',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  'insulin': {
    aka: ['humalog', 'lantus', 'novolog', 'humulin'],
    category: 'diabetes',
    shape: 'vial',
    color: '#E6F3FF',
    textColor: '#1E40AF'
  },
  
  // Blood Pressure
  'lisinopril': {
    aka: ['prinivil', 'zestril'],
    category: 'blood-pressure',
    shape: 'round',
    color: '#FFB6C1',
    textColor: '#8B0000'
  },
  'amlodipine': {
    aka: ['norvasc'],
    category: 'blood-pressure',
    shape: 'round',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  
  // Mental Health
  'sertraline': {
    aka: ['zoloft'],
    category: 'mental-health',
    shape: 'capsule',
    color: '#ADD8E6',
    textColor: '#000080'
  },
  'alprazolam': {
    aka: ['xanax'],
    category: 'mental-health',
    shape: 'oval',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  
  // Cholesterol
  'atorvastatin': {
    aka: ['lipitor'],
    category: 'cholesterol',
    shape: 'oval',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  
  // Acid Reflux
  'omeprazole': {
    aka: ['prilosec'],
    category: 'acid-reflux',
    shape: 'capsule',
    color: '#DDA0DD',
    textColor: '#4B0082'
  },
  
  // Vitamins
  'vitamin d': {
    aka: ['cholecalciferol', 'ergocalciferol', 'vitamin d3', 'vitamin d2'],
    category: 'vitamin',
    shape: 'round',
    color: '#FFFF99',
    textColor: '#B8860B'
  },
  'multivitamin': {
    aka: ['centrum', 'one a day', 'vitafusion'],
    category: 'vitamin',
    shape: 'round',
    color: '#FFD700',
    textColor: '#8B4513'
  },
  
  // Antibiotics
  'amoxicillin': {
    aka: ['amoxil'],
    category: 'antibiotic',
    shape: 'capsule',
    color: '#FFB6C1',
    textColor: '#8B0000'
  },
  'azithromycin': {
    aka: ['zithromax', 'z-pack'],
    category: 'antibiotic',
    shape: 'oval',
    color: '#FFFFFF',
    textColor: '#333333'
  },
  
  // Thyroid
  'levothyroxine': {
    aka: ['synthroid', 'levoxyl'],
    category: 'thyroid',
    shape: 'round',
    color: '#FFA500',
    textColor: '#8B4513'
  }
};

// Generate SVG pill icon based on medication characteristics
const generateMedicationIcon = (
  drugName: string,
  dosage: string,
  size: number = 64
): string => {
  const normalizedName = normalizeDrugName(drugName);
  const dosageInfo = extractDosageInfo(dosage);
  
  // Find medication info from database
  const medInfo = Object.entries(medicationDatabase).find(([key, info]) => {
    return key === normalizedName || 
           info.aka.some(alias => alias === normalizedName) ||
           info.aka.some(alias => normalizedName.includes(alias));
  })?.[1];
  
  // Default characteristics
  const shape = medInfo?.shape || 'round';
  const color = medInfo?.color || '#E5E7EB';
  const textColor = medInfo?.textColor || '#374151';
  
  // Shape definitions
  const shapes = {
    round: `<circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="${color}" stroke="#9CA3AF" stroke-width="2"/>`,
    oval: `<ellipse cx="${size/2}" cy="${size/2}" rx="${size/2 - 8}" ry="${size/3}" fill="${color}" stroke="#9CA3AF" stroke-width="2"/>`,
    capsule: `<rect x="8" y="${size/4}" width="${size-16}" height="${size/2}" rx="${size/4}" fill="${color}" stroke="#9CA3AF" stroke-width="2"/>`,
    diamond: `<polygon points="${size/2},8 ${size-8},${size/2} ${size/2},${size-8} 8,${size/2}" fill="${color}" stroke="#9CA3AF" stroke-width="2"/>`,
    square: `<rect x="8" y="8" width="${size-16}" height="${size-16}" rx="4" fill="${color}" stroke="#9CA3AF" stroke-width="2"/>`,
    octagon: `<polygon points="${size/4},8 ${3*size/4},8 ${size-8},${size/4} ${size-8},${3*size/4} ${3*size/4},${size-8} ${size/4},${size-8} 8,${3*size/4} 8,${size/4}" fill="${color}" stroke="#9CA3AF" stroke-width="2"/>`,
    vial: `<rect x="${size/4}" y="8" width="${size/2}" height="${size-16}" rx="4" fill="${color}" stroke="#9CA3AF" stroke-width="2"/><rect x="${size/4-2}" y="8" width="${size/2+4}" height="8" rx="2" fill="#9CA3AF"/>`
  };
  
  const shapeElement = shapes[shape as keyof typeof shapes] || shapes.round;
  
  // Add dosage text
  const dosageText = dosageInfo.amount || drugName.substring(0, 3).toUpperCase();
  const fontSize = Math.min(size/5, 12);
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
        <linearGradient id="pillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <g filter="url(#shadow)">
        ${shapeElement.replace(color, 'url(#pillGradient)')}
      </g>
      <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}">${dosageText}</text>
      <circle cx="${size - 12}" cy="12" r="3" fill="#10B981" opacity="0.8" />
    </svg>
  `)}`;
};

// Main function to get medication image
export const getMedicationImage = async (
  drugName: string, 
  dosage: string
): Promise<MedicationImageResult> => {
  const cacheKey = `${drugName.toLowerCase()}-${dosage.toLowerCase()}`;
  
  // Check cache first
  if (medicationCache.has(cacheKey)) {
    return medicationCache.get(cacheKey)!;
  }
  
  try {
    const normalizedName = normalizeDrugName(drugName);
    
    // Check local database for known medications
    const medInfo = Object.entries(medicationDatabase).find(([key, info]) => {
      return key === normalizedName || 
             info.aka.some(alias => alias === normalizedName) ||
             info.aka.some(alias => normalizedName.includes(alias));
    });
    
    let confidence = 0.5; // Base confidence
    
    if (medInfo) {
      confidence = 0.8; // Higher confidence for known medications
      
      const dosageInfo = extractDosageInfo(dosage);
      // Additional confidence boost for dosage recognition
      if (dosageInfo.amount) {
        confidence = 0.9;
      }
    }
    
    // Generate SVG icon
    const iconUrl = generateMedicationIcon(drugName, dosage, 64);
    
    const result: MedicationImageResult = {
      imageUrl: iconUrl,
      source: 'icon',
      confidence,
      description: `${drugName} ${dosage} - ${medInfo?.[1]?.category || 'medication'} icon`
    };
    
    medicationCache.set(cacheKey, result);
    return result;
    
  } catch (error) {
    console.error('Error generating medication icon:', error);
    
    // Generate basic fallback icon
    const fallbackIcon = generateMedicationIcon(drugName, dosage, 64);
    
    const result: MedicationImageResult = {
      imageUrl: fallbackIcon,
      source: 'icon',
      confidence: 0.3,
      description: `${drugName} ${dosage} - basic icon`
    };
    
    medicationCache.set(cacheKey, result);
    return result;
  }
};

// Search medications (simplified without external API)
export const searchMedications = async (query: string): Promise<Array<{name: string; type: 'generic' | 'brand'}>> => {
  try {
    const normalizedQuery = normalizeDrugName(query);
    
    if (normalizedQuery.length < 2) {
      return [];
    }
    
    const results: Array<{name: string; type: 'generic' | 'brand'}> = [];
    
    // Search local database
    Object.entries(medicationDatabase).forEach(([name, info]) => {
      // Check main name
      if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) {
        results.push({ name: name, type: 'generic' });
      }
      
      // Check aliases (brand names)
      info.aka.forEach(alias => {
        if (alias.includes(normalizedQuery) || normalizedQuery.includes(alias)) {
          results.push({ name: alias, type: 'brand' });
        }
      });
    });
    
    // Remove duplicates and limit results
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.name === result.name)
    );
    
    return uniqueResults.slice(0, 10);
    
  } catch (error) {
    console.error('Error searching medications:', error);
    return [];
  }
};

// Preload images for better performance (simplified)
export const preloadMedicationImages = async (prescriptions: Array<{ name: string; dosage: string }>) => {
  const promises = prescriptions.map(p => getMedicationImage(p.name, p.dosage));
  await Promise.allSettled(promises);
};

// Clear image cache
export const clearImageCache = () => {
  medicationCache.clear();
};

// Get cache statistics
export const getCacheStats = () => {
  return {
    size: medicationCache.size,
    keys: Array.from(medicationCache.keys())
  };
};