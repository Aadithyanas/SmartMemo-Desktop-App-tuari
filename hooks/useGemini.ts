import { useState } from 'react';

import { Language } from '../types';

interface UseTranslateProps {
    translateText: (text: string, targetLanguage: string) => Promise<string>;
    summarizeText:(text:string)=>Promise<string>;
    onUpdateTranslation?: (language: Language, translation: string) => void;
    onUpdateSummary?:(text:string)=>void
}


export function useTranslate({translateText,summarizeText,onUpdateSummary,onUpdateTranslation} : UseTranslateProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
   

  const handleTranslate = async (selectedLanguage: Language, transcription: string) => {
    if (!selectedLanguage) return;

    setIsTranslating(true);
    try {
      const translation = await translateText(transcription, selectedLanguage.code);
      setTranslatedText(translation);
       if (onUpdateTranslation) {
        onUpdateTranslation(selectedLanguage, translation);
      }
      
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSummarize = async (transcription: string) => {
  if (!transcription) return;
  setIsSummarizing(true);
  try {
    const summaryText = await summarizeText(transcription);
    setSummary(summaryText);

    
    if (onUpdateSummary) {
      onUpdateSummary(summaryText);
    }
  } catch (error) {
    console.error('Summary error:', error);
  } finally {
    setIsSummarizing(false);
  }
};

  
  return {
    handleTranslate,
    handleSummarize,
    isSummarizing,
    summary,
    isTranslating,
    translatedText,
  };
}
