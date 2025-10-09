#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn save_food_image(app: tauri::AppHandle, file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    // مسیر مخصوص اپلیکیشن
    let app_dir: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?; // already a Result

    let images_dir = app_dir.join("images");
    fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let file_path = images_dir.join(file_name);

    fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![save_food_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
