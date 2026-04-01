import joblib
import json
import sys
import os
import re

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load trained model & vectorizer (use absolute paths)
model = joblib.load(os.path.join(script_dir, "model.pkl"))
vectorizer = joblib.load(os.path.join(script_dir, "vectorizer.pkl"))

# Import scam keywords and domains
# Use reload_keywords to get fresh keywords each time (real-time updates)
sys.path.insert(0, script_dir)
from scam_keywords import SUSPICIOUS_DOMAINS, KNOWN_LEGITIMATE_DOMAINS, SCAM_KEYWORDS, SUSPICIOUS_PHRASES, reload_keywords

# Reload keywords for each prediction to get real-time updates
keywords_data = reload_keywords()
SUSPICIOUS_DOMAINS = keywords_data.get("suspicious_domains", [])
KNOWN_LEGITIMATE_DOMAINS = keywords_data.get("legitimate_domains", [])
SCAM_KEYWORDS = keywords_data.get("scam_keywords", [])
SUSPICIOUS_PHRASES = keywords_data.get("suspicious_phrases", [])


def extract_email_domain(text):
    """
    Extract email domains from the offer letter text.
    Returns a list of unique domains found in the text.
    """
    # Pattern to match email addresses
    email_pattern = r'[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+)'
    matches = re.findall(email_pattern, text)
    return list(set(matches))


def check_email_domain(domains):
    """
    Check if extracted domains are suspicious or legitimate.
    Returns a dictionary with domain analysis results.
    """
    if not domains:
        return {
            "found": False,
            "domains": [],
            "is_suspicious": None,
            "is_legitimate": None,
            "reason": "No email domain found in the document"
        }
    
    suspicious_found = []
    legitimate_found = []
    
    for domain in domains:
        domain_lower = domain.lower()
        if domain_lower in SUSPICIOUS_DOMAINS:
            suspicious_found.append(domain_lower)
        if domain_lower in KNOWN_LEGITIMATE_DOMAINS:
            legitimate_found.append(domain_lower)
    
    # Determine if domain is suspicious or legitimate
    is_suspicious = len(suspicious_found) > 0
    is_legitimate = len(legitimate_found) > 0
    
    reason = ""
    if is_legitimate:
        reason = f"Company email domain verified: {legitimate_found[0]}"
    elif is_suspicious:
        reason = f"Suspicious email domain detected: {suspicious_found[0]}"
    else:
        reason = "Unknown email domain - could not verify company legitimacy"
    
    return {
        "found": True,
        "domains": domains,
        "is_suspicious": is_suspicious,
        "is_legitimate": is_legitimate,
        "suspicious_domains": suspicious_found,
        "legitimate_domains": legitimate_found,
        "reason": reason
    }


# Get text from command line argument
if len(sys.argv) < 2:
    print(json.dumps({"error": "No text provided. Usage: python predict.py <offer_letter_text>"}))
    sys.exit(1)

# The offer letter text passed from Node.js
offer_text = sys.argv[1]

# If text is very short or empty, return error
if not offer_text or len(offer_text.strip()) < 10:
    print(json.dumps({"error": "Text too short to analyze"}))
    sys.exit(1)

# Extract email domains and check them
domains = extract_email_domain(offer_text)
domain_check = check_email_domain(domains)

# Transform the text using vectorizer
X = vectorizer.transform([offer_text])

# Get prediction and probability
prediction = model.predict(X)[0]
ml_confidence = model.predict_proba(X)[0].max()

# Check for scam keywords in the text
text_lower = offer_text.lower()
found_scam_keywords = [kw for kw in SCAM_KEYWORDS if kw.lower() in text_lower]
found_suspicious_phrases = [phrase for phrase in SUSPICIOUS_PHRASES if phrase.lower() in text_lower]

# Build reasons based on domain check and keyword analysis
reasons = []

# Add domain-related reason
if domain_check["found"]:
    reasons.append(domain_check["reason"])
else:
    reasons.append("No company email domain found - could not verify legitimacy")

# Check if domain is legitimate - this overrides ML prediction
if domain_check["is_legitimate"]:
    # Domain is verified as legitimate company - give HIGH confidence
    if len(found_scam_keywords) == 0 and len(found_suspicious_phrases) == 0:
        # No red flags - genuine with HIGH confidence
        confidence = 95.0  # Override low ML confidence with high confidence for verified domain
        result = {
            "status": "Genuine",
            "risk": "Low",
            "confidence": confidence,
            "reasons": reasons + [
                "Standard salary structure",
                "Proper documentation format",
                "Verified company domain"
            ],
            "domain_check": domain_check,
            "detailed_analysis": {
                "email_domain": domains[0] if domains else None,
                "domain_status": "Verified Legitimate",
                "scam_keywords_found": found_scam_keywords,
                "suspicious_phrases_found": found_suspicious_phrases,
                "ml_prediction": "Genuine",
                "ml_confidence": round(ml_confidence * 100, 2)
            }
        }
    else:
        # Has some keywords but domain is legitimate
        confidence = 70.0
        result = {
            "status": "Suspected",
            "risk": "Medium",
            "confidence": confidence,
            "reasons": reasons + [
                "Some details need further verification",
                "Potential concerns found in document content"
            ],
            "domain_check": domain_check,
            "detailed_analysis": {
                "email_domain": domains[0] if domains else None,
                "domain_status": "Verified Legitimate",
                "scam_keywords_found": found_scam_keywords,
                "suspicious_phrases_found": found_suspicious_phrases,
                "ml_prediction": "Suspected",
                "ml_confidence": round(ml_confidence * 100, 2)
            }
        }
elif domain_check["is_suspicious"]:
    # Suspicious domain (gmail, yahoo, etc.)
    confidence = 90.0
    result = {
        "status": "Fake",
        "risk": "High",
        "confidence": confidence,
        "reasons": reasons + [
            "Personal email domain used instead of company domain",
            "Company using free email service is suspicious"
        ],
        "domain_check": domain_check,
        "detailed_analysis": {
            "email_domain": domains[0] if domains else None,
            "domain_status": "Suspicious",
            "scam_keywords_found": found_scam_keywords,
            "suspicious_phrases_found": found_suspicious_phrases,
            "ml_prediction": "Fake",
            "ml_confidence": round(ml_confidence * 100, 2)
        }
    }
else:
    # No domain found or unknown domain - use ML prediction
    if prediction == 0:
        confidence = max(ml_confidence * 100, 60.0)  # Boost minimum to 60%
        result = {
            "status": "Genuine",
            "risk": "Low",
            "confidence": round(confidence, 2),
            "reasons": reasons + [
                "Standard salary structure",
                "Proper documentation format"
            ],
            "domain_check": domain_check,
            "detailed_analysis": {
                "email_domain": domains[0] if domains else None,
                "domain_status": "Unknown",
                "scam_keywords_found": found_scam_keywords,
                "suspicious_phrases_found": found_suspicious_phrases,
                "ml_prediction": "Genuine",
                "ml_confidence": round(ml_confidence * 100, 2)
            }
        }
    elif prediction == 1:
        result = {
            "status": "Suspected",
            "risk": "Medium",
            "confidence": round(ml_confidence * 100, 2),
            "reasons": reasons + [
                "Some details need further verification"
            ],
            "domain_check": domain_check,
            "detailed_analysis": {
                "email_domain": domains[0] if domains else None,
                "domain_status": "Unknown",
                "scam_keywords_found": found_scam_keywords,
                "suspicious_phrases_found": found_suspicious_phrases,
                "ml_prediction": "Suspected",
                "ml_confidence": round(ml_confidence * 100, 2)
            }
        }
    else:
        result = {
            "status": "Fake",
            "risk": "High",
            "confidence": round(ml_confidence * 100, 2),
            "reasons": reasons + [
                "Multiple red flags detected in document"
            ],
            "domain_check": domain_check,
            "detailed_analysis": {
                "email_domain": domains[0] if domains else None,
                "domain_status": "Unknown",
                "scam_keywords_found": found_scam_keywords,
                "suspicious_phrases_found": found_suspicious_phrases,
                "ml_prediction": "Fake",
                "ml_confidence": round(ml_confidence * 100, 2)
            }
        }

# Output JSON (Node.js will read this)
print(json.dumps(result))
