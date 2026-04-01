import json
import os

# Get the data directory path
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(os.path.dirname(script_dir), "data")
keywords_file = os.path.join(data_dir, "keywords.json")


def load_keywords():
    """
    Load keywords from the JSON file.
    Returns a dictionary with all keyword categories.
    """
    try:
        if os.path.exists(keywords_file):
            with open(keywords_file, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading keywords: {e}")
    
    # Return default values if file doesn't exist
    return {
        "scam_keywords": [
            "urgent", "limited time", "guaranteed", "no experience required",
            "easy money", "investment required", "fake company", "scam",
            "too good to be true", "advance payment", "confidential", "exclusive offer"
        ],
        "suspicious_phrases": [
            "send money first", "bank details", "wire transfer", "crypto payment"
        ],
        "suspicious_domains": [
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
            "mail.com", "protonmail.com", "icloud.com", "yandex.com", "zoho.com"
        ],
        "legitimate_domains": [
            "google.com", "microsoft.com", "amazon.com", "apple.com", "meta.com",
            "facebook.com", "netflix.com", "twitter.com", "linkedin.com", "adobe.com"
        ]
    }


# Load keywords from JSON file
keywords_data = load_keywords()

# Export as variables for backward compatibility
SCAM_KEYWORDS = keywords_data.get("scam_keywords", [])
SUSPICIOUS_PHRASES = keywords_data.get("suspicious_phrases", [])
SUSPICIOUS_DOMAINS = keywords_data.get("suspicious_domains", [])
KNOWN_LEGITIMATE_DOMAINS = keywords_data.get("legitimate_domains", [])


def get_keywords():
    """Get all keywords as a dictionary."""
    return keywords_data


def reload_keywords():
    """Reload keywords from file (for real-time updates)."""
    global keywords_data, SCAM_KEYWORDS, SUSPICIOUS_PHRASES, SUSPICIOUS_DOMAINS, KNOWN_LEGITIMATE_DOMAINS
    keywords_data = load_keywords()
    SCAM_KEYWORDS = keywords_data.get("scam_keywords", [])
    SUSPICIOUS_PHRASES = keywords_data.get("suspicious_phrases", [])
    SUSPICIOUS_DOMAINS = keywords_data.get("suspicious_domains", [])
    KNOWN_LEGITIMATE_DOMAINS = keywords_data.get("legitimate_domains", [])
    return keywords_data
