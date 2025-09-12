// use sqlx::{postgres::PgPoolOptions, Error, PgPool};
// use std::time::Duration;
// use tokio; // Required for tokio::time::sleep


// pub async fn get_db_pool() -> Result<PgPool, Error> {
//     let db_url = "postgresql://memo_0mvx_user:uX6yKmYzheYxhDLsyHQs9dZxmyNWGgvb@dpg-d1plnpffte5s73cfndhg-a.oregon-postgres.render.com/memo_0mvx";
//     let mut last_error: Option<Error> = None;
//     let max_retries = 5;

//     for attempt in 1..=max_retries {
//         match PgPoolOptions::new()
//             .max_connections(5)
//             .connect(db_url)
//             .await
//         {
//             Ok(pool) => {
//                 println!("✅ Successfully connected to the database on attempt {}", attempt);
//                 return Ok(pool);
//             }
//             Err(e) => {
//                 println!("⚠️ Database connection attempt {} failed: {}", attempt, e);
//                 last_error = Some(e);
//                 if attempt < max_retries {
//                     let sleep_duration = Duration::from_secs(attempt);
//                     println!("Retrying in {} seconds...", sleep_duration.as_secs());
//                     tokio::time::sleep(sleep_duration).await; // Use tokio's async sleep
//                 }
//             }
//         }
//     }
//     Err(last_error.unwrap())
// }

// pub async fn init_db() -> Result<(), Error> {
//     let pool = get_db_pool().await?;

//     // Users table
//     sqlx::query(
//         "CREATE TABLE IF NOT EXISTS users (
//             user_id TEXT PRIMARY KEY,
//             username TEXT NOT NULL,
//             email TEXT NOT NULL,
//             password TEXT NOT NULL,
//             created_at TEXT NOT NULL
//         )"
//     )
//     .execute(&pool)
//     .await?;

//     // Voice memos table with foreign key to users
//     sqlx::query(
//         "CREATE TABLE IF NOT EXISTS voice_memos1 (
//             id TEXT PRIMARY KEY,
//             user_id TEXT NOT NULL,
//             name TEXT NOT NULL,
//             date TEXT NOT NULL,
//             duration INTEGER NOT NULL,
//             audio_blob BYTEA NOT NULL,
//             transcription TEXT,
//             translate TEXT,
//             summary TEXT,
//             tags TEXT,
//             FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
//         )"
//     )
//     .execute(&pool)
//     .await?;

    
//     sqlx::query(
//         "CREATE TABLE IF NOT EXISTS helperApp (
//             user_id TEXT PRIMARY KEY,
//             gemini_key TEXT NOT NULL,
//             elelabs_key TEXT NOT NULL,
//             created_at TEXT NOT NULL,
//             helper_app_enabled BOOLEAN NOT NULL DEFAULT FALSE,
//             FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
//         )"
//     )
//     .execute(&pool)
//     .await?;

//     println!("✅ Database tables initialized successfully.");
//     Ok(())
// }
