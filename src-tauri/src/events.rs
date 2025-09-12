use tauri::{AppHandle, Emitter};


pub fn emit_memo_updated(app: &AppHandle) {
    println!("🔄 Emitting memo:updated event...");
    if let Err(e) = app.emit("memo:updated", "refresh") {
        println!("❌ Failed to emit memo:updated event: {:?}", e);
    } else {
        println!("✅ Successfully emitted memo:updated event");
    }
}
