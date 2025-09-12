export interface VoiceMemo {
    
    id:string;
    name:string;
    date:string;
    duration:string;
    audioBlob:Blob;
    audioUrl:string| undefined;
    transcription?:string;
    translation?:{
        language:string;
        text:string;
    };
    summary?:string;


}

export type VoiceMemoList = VoiceMemo[];

export type Language={
  code:string;
    name:string;
}


export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  {code : 'ml',name : 'Malayalam'}
];