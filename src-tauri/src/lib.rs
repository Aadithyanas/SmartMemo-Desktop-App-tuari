mod api_key_ops;
mod events;
mod memo_ops;
mod gemini;
mod models;
mod db; 
mod user_ops; // NEW: Added the user_ops module

// Corrected 'use' statements
use tauri::{command, AppHandle, Emitter, Manager};
use std::env;
use tokio::fs;
use uuid::Uuid;

// Import the specific functions and the correct VoiceMemo struct from our modules
use api_key_ops::*;
use memo_ops::{
    save_audio, save_memo, get_memos, get_memo, delete_memo, delete_all_memos, VoiceMemo
};
// NEW: Import user operations and payloads
use user_ops::{signup, login, SignupPayload, LoginPayload, SignupResponse, LoginResponse};


// Re-export for clarity
pub use gemini::{
    transcribe_audio,
    translate_text,
    summarize_text,
    generate_memo_name
};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            // Spawn an async task to initialize the database if it's needed locally
            // tauri::async_runtime::spawn(async move {
            //     db::init_db().await.expect("Failed to initialize local database");
            // });

            println!("App setup completed successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // User Auth Commands
            signup_command,
            login_command,

            // Memo Commands
            save_audio_command,
            save_memo_command,
            get_memos_command,
            get_memo_command,
            delete_memo_command,
            clear_all_memos,

            // AI Commands
            transcribe_audio_command,
            translate_text_command,
            summarize_text_command,
            generate_memo_name_command,

            // API Key Commands
            save_api_key_command,
            get_api_key_command,
            delete_gemini_api_key_command,
            delete_elevenlabs_api_key_command,

            // Helper Window and Test Commands
            toggle_helper_window_command,
            get_helper_window_state_command,
            test_event_emission
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// --- COMMANDS ---

// NEW: User Auth Commands
#[command]
async fn signup_command(username: String, email: String, password: String) -> Result<SignupResponse, String> {
    let payload = SignupPayload { username, email, password };
    signup(payload).await.map_err(|e| e.to_string())
}

#[command]
async fn login_command(email: String, password: String) -> Result<LoginResponse, String> {
    let payload = LoginPayload { email, password };
    login(payload).await.map_err(|e| e.to_string())
}


#[command]
async fn save_audio_command(app: AppHandle, token: String, audio_blob: Vec<u8>, duration: String, tags: Vec<String>) -> Result<VoiceMemo, String> {
    save_audio(&app, &token, audio_blob, duration, tags).await.map_err(|e| e.to_string())
}

#[command]
async fn save_memo_command(app: AppHandle, token: String, id: String, name: String, transcription: Option<String>, translate: Option<String>, summary: Option<String>, tags: Option<Vec<String>>) -> Result<VoiceMemo, String> {
    save_memo(&app, &token, &id, &name, transcription, translate, summary, tags).await.map_err(|e| e.to_string())
}

#[command]
async fn get_memos_command(token: String) -> Result<Vec<VoiceMemo>, String> {
    get_memos(&token).await.map_err(|e| e.to_string())
}

#[command]
async fn get_memo_command(token: String, id: String) -> Result<Option<VoiceMemo>, String> {
    get_memo(&id, &token).await.map_err(|e| e.to_string())
}

#[command]
async fn delete_memo_command(app: AppHandle, token: String, id: String) -> Result<(), String> {
    delete_memo(&app, &id, &token).await.map_err(|e| e.to_string())
}

#[command]
async fn clear_all_memos(app: AppHandle, token: String) -> Result<String, String> {
    delete_all_memos(&app, &token).await.map_err(|e| e.to_string())
}

#[command]
async fn transcribe_audio_command(token: String, audio_blob: Vec<u8>) -> Result<String, String> {
    let temp_dir = env::temp_dir();
    let file_path = temp_dir.join(format!("{}.tmp", Uuid::new_v4()));
    
    fs::write(&file_path, audio_blob)
        .await
        .map_err(|e| e.to_string())?;
    
    let file_path_str = file_path.to_str()
        .ok_or("Invalid temporary file path".to_string())?;
    
    let result = transcribe_audio(file_path_str, &token)
        .await
        .map_err(|e| e.to_string());
    
    let _ = fs::remove_file(file_path).await;
    
    result
}

#[command]
async fn translate_text_command(token: String, text: String, target_language: String) -> Result<String, String> {
    translate_text(&text, &target_language, &token).await.map_err(|e| e.to_string())
}

#[command]
async fn summarize_text_command(token: String, text: String) -> Result<String, String> {
    summarize_text(&text, &token).await.map_err(|e| e.to_string())
}

#[command]
async fn generate_memo_name_command(token: String, transcription: String) -> Result<String, String> {
    generate_memo_name(&transcription, &token).await.map_err(|e| e.to_string())
}

#[command]
async fn save_api_key_command(token: String, gemini_key: String) -> Result<(), String> {
    save_api_key(&token, &gemini_key).await.map_err(|e| e.to_string())
}

#[command]
async fn get_api_key_command(token: String) -> Result<Option<String>, String> {
    get_api_key(&token).await.map_err(|e| e.to_string())
}

#[command]
async fn delete_gemini_api_key_command(token: String) -> Result<(), String> {
    delete_gemini_api_key(&token).await.map_err(|e| e.to_string())
}

#[command]
async fn delete_elevenlabs_api_key_command(token: String) -> Result<(), String> {
    delete_elevenlabs_api_key(&token).await.map_err(|e| e.to_string())
}

// --- Helper Window and Test Commands ---

#[command]
async fn toggle_helper_window_command(
    app: AppHandle,
    token: String,
    enabled: bool,
) -> Result<(), String> {
    // This function now calls the API to update the state
    update_helper_app_state(&token, enabled).await.map_err(|e| e.to_string())?;
    
    if let Some(helper_window) = app.get_webview_window("helper") {
        if enabled {
            helper_window.show().map_err(|e| e.to_string())?;
            helper_window.set_focus().map_err(|e| e.to_string())?;
        } else {
            helper_window.hide().map_err(|e| e.to_string())?;
        }
    } else {
        return Err("Helper window not found".to_string());
    }
    
    Ok(())
}

#[command]
async fn get_helper_window_state_command(app: AppHandle, token: String) -> Result<bool, String> {
    // This function now calls the API to get the state
    let db_state = get_helper_app_state(&token).await.map_err(|e| e.to_string())?;
    
    if let Some(helper_window) = app.get_webview_window("helper") {
        let is_visible = helper_window.is_visible().map_err(|e| e.to_string())?;
        Ok(db_state && is_visible)
    } else {
        Ok(false)
    }
}

#[command]
fn test_event_emission(app_handle: tauri::AppHandle) -> Result<String, String> {
    println!("🧪 Testing event emission...");
    match app_handle.emit("memo:updated", "test_payload") {
        Ok(_) => {
            println!("✅ Test event emitted successfully");
            Ok("Event emitted successfully".to_string())
        }
        Err(e) => {
            println!("❌ Failed to emit test event: {:?}", e);
            Err(format!("Failed to emit event: {:?}", e))
        }
    }
}
