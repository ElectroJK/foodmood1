from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    app_name: str = "FoodMood ML Service"
    host: str = "0.0.0.0"
    port: int = 4200
    log_level: str = "INFO"

    mongo_uri: str = "mongodb://mongo:27017"
    mongodb_uri: str | None = None
    mongo_db: str = "foodmood"
    fooditems_collection: str = "fooditems"
    recipes_collection: str = "recipes"
    users_collection: str = "users"
    feedback_collection: str = "recipe_feedback"

    internal_api_key: str = "change-me"

    model_dir: str = "/app/data/models"
    receipt_feedback_path: str = "/app/data/receipt_feedback.jsonl"
    auto_train_on_start: bool = True
    auto_train_on_receipt_feedback: bool = True

    tfidf_max_features: int = 3000
    tfidf_ngram_max: int = 2

    urgent_window_days: int = 3
    soon_window_days: int = 7


settings = Settings()
