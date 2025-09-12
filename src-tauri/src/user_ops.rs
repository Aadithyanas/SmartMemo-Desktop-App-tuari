use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::error::Error;

const API_BASE_URL: &str = "http://localhost:4000/api";

// Structs for API communication
#[derive(Deserialize, Serialize)]
pub struct SignupPayload {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct SignupResponse {
    pub message: String,
    pub user_id: String,
}

#[derive(Deserialize, Serialize)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct LoginResponse {
    pub message: String,
    pub token: String,
}

/// Signs up a new user by calling the backend API.
pub async fn signup(payload: SignupPayload) -> Result<SignupResponse, Box<dyn Error>> {
    let client = Client::new();
    let res = client
        .post(&format!("{}/signup", API_BASE_URL))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown signup error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    Ok(res.json().await?)
}

/// Logs in a user by calling the backend API.
pub async fn login(payload: LoginPayload) -> Result<LoginResponse, Box<dyn Error>> {
    let client = Client::new();
    let res = client
        .post(&format!("{}/login", API_BASE_URL))
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let error_body = res.text().await.unwrap_or_else(|_| "Unknown login error".to_string());
        return Err(format!("API Error: {}", error_body).into());
    }

    Ok(res.json().await?)
}
