package auth

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"strings"
	"time"

	"github.com/pquerna/otp/totp"
)

type TOTPManager struct {
	issuer string
}

func NewTOTPManager(issuer string) *TOTPManager {
	return &TOTPManager{
		issuer: issuer,
	}
}

type TOTPSecret struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
}

func (t *TOTPManager) GenerateSecret(email string) (*TOTPSecret, error) {
	// Generate random secret
	secretBytes := make([]byte, 20)
	if _, err := rand.Read(secretBytes); err != nil {
		return nil, fmt.Errorf("failed to generate random secret: %w", err)
	}

	secret := base32.StdEncoding.EncodeToString(secretBytes)
	secret = strings.TrimRight(secret, "=")

	// Generate QR code URL
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      t.issuer,
		AccountName: email,
		Secret:      []byte(secret),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	return &TOTPSecret{
		Secret:    secret,
		QRCodeURL: key.URL(),
	}, nil
}

func (t *TOTPManager) ValidateCode(secret, code string) bool {
	return totp.Validate(code, secret)
}

func (t *TOTPManager) GenerateCode(secret string) (string, error) {
	code, err := totp.GenerateCode(secret, time.Now())
	if err != nil {
		return "", fmt.Errorf("failed to generate TOTP code: %w", err)
	}
	return code, nil
}
