use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use std::error::Error;

const API_BASE_URL: &str = "http://localhost:4000/api";

#[derive(Deserialize)]
struct ApiKeyResponse {
    gemini_api_key: Option<String>,
    elevenlabs_api_key: Option<String>,
    message: String,
}

#[derive(Deserialize)]
struct HelperStatusResponse {
    status: bool,
    message: String,
}

/// Saves the Gemini API key by sending it to the backend server.
pub async fn save_api_key(token: &str, gemini_key: &str) -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let payload = json!({
        "gemini_api_key": gemini_key
    });

    let res = client
        .post(&format!("{}/api_keys/save", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    Ok(())
}

/// Retrieves the Gemini API key from the backend server.
pub async fn get_api_key(token: &str) -> Result<Option<String>, Box<dyn Error>> {
    let client = Client::new();
    let res = client
        .get(&format!("{}/api_keys/get", API_BASE_URL))
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

    let response: ApiKeyResponse = res.json().await?;
     println!("Message: {}", response.message);
    println!("ElevenLabs Key: {:?}", response.elevenlabs_api_key);
    Ok(response.gemini_api_key)
}

/// Deletes the Gemini API key from the backend server.
pub async fn delete_gemini_api_key(token: &str) -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let res = client
        .delete(&format!("{}/api_keys/gemini", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    Ok(())
}

/// Deletes the ElevenLabs API key from the backend server.
pub async fn delete_elevenlabs_api_key(token: &str) -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let res = client
        .delete(&format!("{}/api_keys/elevenlabs", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    Ok(())
}

/// Updates the helper application state on the backend server.
pub async fn update_helper_app_state(token: &str, enabled: bool) -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let payload = json!({ "status": enabled });

    let res = client
        .post(&format!("{}/helper/status", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    Ok(())
}

/// Retrieves the helper application state from the backend server.
pub async fn get_helper_app_state(token: &str) -> Result<bool, Box<dyn Error>> {
    let client = Client::new();
    let res = client
        .get(&format!("{}/helper/status", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

   

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    let response: HelperStatusResponse = res.json().await?;
     println!("Message: {}", response.message);
    println!("helper window status: {:?}", response.status);
    //  println!("response is {}", response);
    Ok(response.status)
}
