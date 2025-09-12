import Dexie from "dexie";
import { VoiceMemo } from "../types";


const db=new Dexie('voiceMemoApp')

db.version(1).stores({
    memos:"id",
})

const memoTable = db.table<VoiceMemo,string>("memos");

const saveMemo = async(memo:VoiceMemo)=>{
    await memoTable.put(memo)
}

const getAllMemos = async():Promise<VoiceMemo[]>=>{
    return memoTable.toArray()
}

const getMemoById = async(id:string):Promise<VoiceMemo | undefined>=>{
    return memoTable.get(id)
}

const deleteMemo = async(id:string):Promise<void>=>{
    await memoTable.delete(id)
}

const clearAllMemos = async() :Promise<void>=>{
    await memoTable.clear()
}

export default {
    saveMemo,
    getAllMemos,
    getMemoById,
    deleteMemo,
    clearAllMemos,
}