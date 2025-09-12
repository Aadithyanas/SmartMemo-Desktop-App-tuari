// use serde::{Deserialize, Serialize};
// use sqlx::FromRow;


// #[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
// pub struct VoiceMemo {
//     pub id: String,
//     pub user_id:String,
//     pub name: String,
//     pub date: String,
//     pub duration: i32,
//     pub audio_blob: Vec<u8>,
//     pub transcription: Option<String>,
//     pub translate: Option<String>,
//     pub summary: Option<String>,
  
//     #[sqlx(skip)]
//     pub tags: Vec<String>,
// }


// #[derive(Debug, Serialize, Deserialize)]
// pub struct ApiKey {
//     pub user_id: String,
//     pub gemini_key: String,
//     pub elelabs_key:String,
//     pub created_at: String,
//     pub helper_app_enabled: bool,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Users {
//     pub user_id:String,
//     pub username:String,
//     pub email:String,
//     pub password:String,
//     pub created_at:String,
// }
