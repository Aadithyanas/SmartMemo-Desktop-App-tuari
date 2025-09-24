use crate::events::emit_memo_updated;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

const API_BASE_URL: &str = "https://smartmemo-backend-rust.onrender.com/api";

// This struct should match the `MemoOutput` from your backend API
// It's used to deserialize the responses from GET requests.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VoiceMemo {
    pub id: String,
    pub title: String,
    pub transcript: Option<String>,
    pub translate: Option<String>,
    pub summary: Option<String>,
    pub tags: Option<Vec<String>>,
    pub duration: String,
    pub created_at: String,
    pub audio_blob: Option<Vec<u8>>,
}

// This struct matches the response from create/update/delete operations
#[derive(Deserialize, Debug)]
struct MemoResponse {
    message: String,
    memo_id: String,
}

/// Creates a new memo by sending the audio data and initial info to the backend.
pub async fn save_audio(
    app: &AppHandle,
    token: &str,
    audio_blob: Vec<u8>,
    duration: String,
    tags: Vec<String>,
) -> Result<VoiceMemo, Box<dyn std::error::Error>> {
    let client = Client::new();

    // The backend's `save_memo` endpoint handles the initial creation.
    let payload = serde_json::json!({
        "title": format!("Untitled Recording - {}", chrono::Local::now().format("%Y-%m-%d %H:%M")),
        "duration": duration,
        "audio_blob": audio_blob,
        "tags": tags,
    });

    let res = client
        .post(&format!("{}/save_memo", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response: MemoResponse = res.json().await?;
    println!("💾 New memo created via API with ID: {}", response.memo_id);

    // After creating, fetch the full memo object to return it
    let new_memo = get_memo(&response.memo_id, token).await?;
    emit_memo_updated(app);

    Ok(new_memo.expect("Memo should exist immediately after creation"))
}

/// Updates an existing voice memo with new details.
pub async fn save_memo(
    app: &AppHandle,
    token: &str,
    id: &str,
    name: &str,
    transcription: Option<String>,
    translate: Option<String>,
    summary: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<VoiceMemo, Box<dyn std::error::Error>> {
    let client = Client::new();

    let payload = serde_json::json!({
        "title": name,
        "transcript": transcription,
        "translate": translate,
        "summary": summary,
        "tags": tags,
    });

    let res = client
        .patch(&format!("{}/update_memo/{}", API_BASE_URL, id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response: MemoResponse = res.json().await?;
    println!("📝 Memo updated via API with ID: {}", response.memo_id);
    
    // Fetch the updated memo to return it
    let updated_memo = get_memo(id, token).await?;
    emit_memo_updated(app);

    Ok(updated_memo.expect("Memo should exist after update"))
}

/// Retrieves all voice memos for the authenticated user.
pub async fn get_memos(token: &str) -> Result<Vec<VoiceMemo>, Box<dyn std::error::Error>> {
    let client = Client::new();

    let res = client
        .get(&format!("{}/get_memos", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let memos: Vec<VoiceMemo> = res.json().await?;
    println!("📋 Retrieved {} memos from API", memos.len());
    Ok(memos)
}

/// Retrieves a single voice memo by its ID for the authenticated user.
pub async fn get_memo(id: &str, token: &str) -> Result<Option<VoiceMemo>, Box<dyn std::error::Error>> {
    let client = Client::new();

    let res = client
        .get(&format!("{}/get_memo/{}", API_BASE_URL, id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if res.status() == 404 {
        return Ok(None);
    }

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let memo: VoiceMemo = res.json().await?;
    Ok(Some(memo))
}

/// Deletes a voice memo by its ID for the authenticated user.
pub async fn delete_memo(app: &AppHandle, id: &str, token: &str) -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    let res = client
        .delete(&format!("{}/delete_memo/{}", API_BASE_URL, id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }
    
    println!("🗑️ Memo deleted via API with ID: {}", id);
    emit_memo_updated(app);
    Ok(())
}

/// Deletes all voice memos for the authenticated user.
pub async fn delete_all_memos(app: &AppHandle, token: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = Client::new();

    let res = client
        .delete(&format!("{}/delete_all_memos", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response: MemoResponse = res.json().await?;
    println!("🗑️ All memos deleted via API. Server response: {}", response.message);
    emit_memo_updated(app);
    Ok(response.message)
}