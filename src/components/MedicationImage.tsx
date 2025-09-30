import React, { useState, useEffect } from 'react';
import { Pill, AlertCircle, Info } from 'lucide-react';
import { getMedicationImage, MedicationImageResult } from '../lib/medicationImages';

interface MedicationImageProps {
  drugName: string;
  dosage: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFallback?: boolean;
  showTooltip?: boolean;
}

export const MedicationImage: React.FC<MedicationImageProps> = ({
  drugName,
  dosage,
  className = '',
  size = 'md',
  showFallback = true,
  showTooltip = false
}) => {
  const [imageResult, setImageResult] = useState<MedicationImageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const result = await getMedicationImage(drugName, dosage);
        setImageResult(result);
      } catch (err) {
        console.error('Error loading medication image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (drugName && dosage) {
      loadImage();
    }
  }, [drugName, dosage]);

  const handleImageError = () => {
    setError(true);
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-100 rounded-xl flex items-center justify-center animate-pulse`}>
        <Pill className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  if (error || !imageResult?.imageUrl) {
    if (!showFallback) return null;
    
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg`}>
        <Pill className="w-1/2 h-1/2 text-white" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-xl overflow-hidden shadow-lg group`}>
      <img
        src={imageResult.imageUrl}
        alt={`${drugName} ${dosage}`}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Confidence indicator */}
      {imageResult.confidence < 0.7 && (
        <div 
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            imageResult.confidence < 0.5 ? 'bg-red-400' : 'bg-yellow-400'
          }`} 
          title={`Image confidence: ${Math.round(imageResult.confidence * 100)}%`}
        />
      )}
      
      {/* Source indicator */}
      <div className={`absolute bottom-1 left-1 w-2 h-2 rounded-full ${
        imageResult.source === 'database' ? 'bg-green-400' : 
        imageResult.source === 'search' ? 'bg-blue-400' : 'bg-gray-400'
      }`} title={`Source: ${imageResult.source}`} />
      
      {/* Tooltip */}
      {showTooltip && imageResult.description && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs text-center px-2">
            {imageResult.description}
          </div>
        </div>
      )}
    </div>
  );
};