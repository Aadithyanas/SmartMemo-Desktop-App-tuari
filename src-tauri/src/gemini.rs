use std::error::Error;
use tokio::fs;
use reqwest::Client;
use serde_json::json;

const API_BASE_URL: &str = "https://smartmemo-backend-rust.onrender.com/api";

/// Transcribes an audio file by sending it to your backend server.
///
/// # Arguments
/// * `audio_path` - The local path to the audio file.
/// * `token` - The JWT authentication token for the user.
pub async fn transcribe_audio(audio_path: &str, token: &str) -> Result<String, Box<dyn Error>> {
    // 1. Read the audio file into bytes
    let audio_bytes = fs::read(audio_path).await?;
    if audio_bytes.is_empty() {
        return Err("No audio data provided".into());
    }

    // 2. Create the HTTP client and the request payload
    let client = Client::new();
    let payload = json!({
        "audio_bytes": audio_bytes
    });

    // 3. Send the request to your backend API
    let res = client
        .post(&format!("{}/transcribe", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    // 4. Handle the response
    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response_text = res.text().await?;
    Ok(response_text)
}

/// Translates text by sending it to your backend server.
pub async fn translate_text(
    transcript: &str,
    target_language: &str,
    token: &str,
) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    let payload = json!({
        "text": transcript,
        "lang": target_language
    });

    let res = client
        .post(&format!("{}/translate", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response_text = res.text().await?;
    Ok(response_text)
}

/// Summarizes text by sending it to your backend server.
pub async fn summarize_text(text: &str, token: &str) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    let payload = json!({
        "text": text
    });

    let res = client
        .post(&format!("{}/summary", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response_text = res.text().await?;
    Ok(response_text)
}

/// Generates a memo title by sending the transcript to your backend server.
pub async fn generate_memo_name(transcription: &str, token: &str) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    let payload = json!({
        "transcript": transcription
    });

    let res = client
        .post(&format!("{}/generate_memo_name", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response_text = res.text().await?;
    Ok(response_text)
}
