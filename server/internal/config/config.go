package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	TOTP     TOTPConfig
	Scraper  ScraperConfig
	MinIO    MinIOConfig
}

type AppConfig struct {
	Env  string
	Port string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret        string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
}

type TOTPConfig struct {
	Issuer string
}

type ScraperConfig struct {
	RespectRobots   bool
	DefaultDelayMs  int
	MaxRetry        int
	HeadlessEnabled bool
}

type MinIOConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	BucketName      string
}

func Load() (*Config, error) {
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./server")
	viper.AddConfigPath("../")

	// Set default values
	setDefaults()

	// Enable reading from environment variables
	viper.AutomaticEnv()

	// Try to read config file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	config := &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "dev"),
			Port: getEnv("APP_PORT", "8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     getEnv("POSTGRES_PORT", "5432"),
			User:     getEnv("POSTGRES_USER", "ees_user"),
			Password: getEnv("POSTGRES_PASSWORD", "ees_pass"),
			DBName:   getEnv("POSTGRES_DB", "eesigorta"),
			SSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", "change-me-in-production"),
			AccessTTL:     time.Duration(getEnvAsInt("JWT_ACCESS_TTL_MIN", 15)) * time.Minute,
			RefreshTTL:    time.Duration(getEnvAsInt("JWT_REFRESH_TTL_H", 168)) * time.Hour,
		},
		TOTP: TOTPConfig{
			Issuer: getEnv("TOTP_ISSUER", "EESigorta"),
		},
		Scraper: ScraperConfig{
			RespectRobots:   getEnvAsBool("SCRAPER_RESPECT_ROBOTS", true),
			DefaultDelayMs:  getEnvAsInt("SCRAPER_DEFAULT_DELAY_MS", 1250),
			MaxRetry:        getEnvAsInt("SCRAPER_MAX_RETRY", 5),
			HeadlessEnabled: getEnvAsBool("HEADLESS_ENABLED", true),
		},
		MinIO: MinIOConfig{
			Endpoint:        getEnv("MINIO_ENDPOINT", "localhost:9000"),
			AccessKeyID:     getEnv("MINIO_ACCESS_KEY", "minioadmin"),
			SecretAccessKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
			UseSSL:          getEnvAsBool("MINIO_USE_SSL", false),
			BucketName:      getEnv("MINIO_BUCKET", "eesigorta"),
		},
	}

	return config, nil
}

func setDefaults() {
	viper.SetDefault("APP_ENV", "dev")
	viper.SetDefault("APP_PORT", "8080")
	viper.SetDefault("POSTGRES_HOST", "localhost")
	viper.SetDefault("POSTGRES_PORT", "5432")
	viper.SetDefault("POSTGRES_USER", "ees_user")
	viper.SetDefault("POSTGRES_PASSWORD", "ees_pass")
	viper.SetDefault("POSTGRES_DB", "eesigorta")
	viper.SetDefault("POSTGRES_SSLMODE", "disable")
	viper.SetDefault("REDIS_ADDR", "localhost:6379")
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("REDIS_DB", 0)
	viper.SetDefault("JWT_SECRET", "change-me-in-production")
	viper.SetDefault("JWT_ACCESS_TTL_MIN", 15)
	viper.SetDefault("JWT_REFRESH_TTL_H", 168)
	viper.SetDefault("TOTP_ISSUER", "EESigorta")
	viper.SetDefault("SCRAPER_RESPECT_ROBOTS", true)
	viper.SetDefault("SCRAPER_DEFAULT_DELAY_MS", 1250)
	viper.SetDefault("SCRAPER_MAX_RETRY", 5)
	viper.SetDefault("HEADLESS_ENABLED", true)
	viper.SetDefault("MINIO_ENDPOINT", "localhost:9000")
	viper.SetDefault("MINIO_ACCESS_KEY", "minioadmin")
	viper.SetDefault("MINIO_SECRET_KEY", "minioadmin")
	viper.SetDefault("MINIO_USE_SSL", false)
	viper.SetDefault("MINIO_BUCKET", "eesigorta")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
