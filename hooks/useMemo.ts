import { useState, useEffect, useCallback } from 'react';
import { VoiceMemo, VoiceMemoList } from '../types';

import { generateMemoName } from '../services/geminiServices'
import indexedDbService from '../services/indexedDbService';

export const useMemos = () => {
  const [memos, setMemos] = useState<VoiceMemoList>([]);
  const [loading, setLoading] = useState(true);
  const [currentMemo, setCurrentMemo] = useState<VoiceMemo | null>(null);

  useEffect(() => {
    loadMemos();
  }, []);
+
  useEffect(() => {
    
    let oldUrl: string | null = null;
    if (currentMemo?.audioBlob) {
      const newUrl = URL.createObjectURL(currentMemo.audioBlob);
     
      setCurrentMemo(prev => prev ? { ...prev, audioUrl: newUrl } : null);
      oldUrl = newUrl;
    }
    return () => {
     
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
    };
  }, [currentMemo?.audioBlob]);

  const loadMemos = useCallback(async () => {
    try {
      setLoading(true);
      const allMemos = await indexedDbService.getAllMemos();
     
      const memosWithUrls = allMemos.map(memo => ({
        ...memo,
        audioUrl: memo.audioBlob ? URL.createObjectURL(memo.audioBlob) : undefined,
      }));
      setMemos(memosWithUrls);
    } catch (error) {
      console.error('Failed to load memos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

 const selectMemo = useCallback(async (id: string) => {
  try {
    const memo = await indexedDbService.getMemoById(id);
    if (!memo) return null;

    if (memo.audioBlob) {
      const audioUrl = URL.createObjectURL(memo.audioBlob);
      const memoWithUrl = { ...memo, audioUrl };
      setCurrentMemo(memoWithUrl);
      return memoWithUrl;
    } else {
      console.warn("Memo has no audioBlob");
      return null;
    }
  } catch (error) {
    console.error("Failed to select memo:", error);
    return null;
  }
}, []);


  const saveMemo = useCallback(async (audioBlob: Blob, transcription?: string,time?:any) => {
    try {
      const date = new Date().toISOString();
      const id = `memo_${Date.now()}`;

    
      let name = 'New Memo';
      if (transcription) {
        name = await generateMemoName(transcription);
      }
      
      const duration=time
      const memo: VoiceMemo = {
        id,
        name,
        date,
        duration,
        audioBlob,
        audioUrl: URL.createObjectURL(audioBlob),
        transcription,
      };

      await indexedDbService.saveMemo(memo);
      await loadMemos();
      return memo;
    } catch (error) {
      console.error('Failed to save memo:', error);
      throw error;
    }
  }, [loadMemos, generateMemoName]); 

  const updateMemo = useCallback(async (memo: VoiceMemo) => {
    try {

      const updatedMemo = memo.audioBlob ? { ...memo, audioUrl: URL.createObjectURL(memo.audioBlob) } : memo;
      await indexedDbService.saveMemo(updatedMemo);
      await loadMemos();
      if (currentMemo?.id === memo.id) {
        setCurrentMemo(updatedMemo);
      }
    } catch (error) {
      console.error('Failed to update memo:', error);
      throw error;
    }
  }, [loadMemos, currentMemo]);

  const updateMemoName = useCallback(async (id: string, newName: string) => {
  try {
    const memo = await indexedDbService.getMemoById(id);
    if (!memo) throw new Error('Memo not found');

    const updatedMemo: VoiceMemo = {
      ...memo,
      name: newName,
    };

    await indexedDbService.saveMemo(updatedMemo);
    await loadMemos();
    
  } catch (error) {
    console.error('Failed to update memo name:', error);
    throw error;
  }
}, [loadMemos, currentMemo]);


  const deleteMemo = useCallback(async (id: string) => {
    try {
      await indexedDbService.deleteMemo(id);
      if (currentMemo?.id === id) {
        setCurrentMemo(null);
      }
      await loadMemos();
    } catch (error) {
      console.error('Failed to delete memo:', error);
      throw error;
    }
  }, [loadMemos, currentMemo]);



  return {
    memos,
    loading,
    currentMemo,
    saveMemo,
    updateMemo,
    deleteMemo,
    selectMemo,
    updateMemoName,
  
  };
};