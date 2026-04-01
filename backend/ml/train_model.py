import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

# Extended training data with more examples
data = {
    "text": [
        # FAKE examples (obvious scams)
        "Pay registration fee urgently to confirm your job",
        "High salary without interview or selection process",
        "Congratulations you are selected for CEO position",
        "Company HR contacted via WhatsApp only",
        "Pay security deposit to get your offer letter",
        "Immediate joining without background verification",
        "Transfer money to reserve your position",
        "Pay training fee before starting job",
        "Unlimited salary package offered immediately",
        "No company address or official website",
        
        # SUSPECTED examples (red flags)
        "High salary with minimum experience required",
        "Company email domain looks suspicious",
        "Salary offered is above market average",
        "Vague job description provided",
        "No proper company registration details",
        "HR using personal email instead of company email",
        "Offer letter has formatting errors",
        "Missing company HR contact information",
        "Unclear about joining date and location",
        "Promises quick promotion without criteria",
        
        # GENUINE examples (real offer letters)
        "Offer letter from official company email with proper format",
        "Proper interview process and formal appointment letter",
        "Company website and official contact details provided",
        "Standard salary structure as per industry norms",
        "Background verification required before joining",
        "Formal appointment with company HR department",
        "Proper joining date and location mentioned",
        "Employee ID and official company domain",
        "Detailed job description with requirements",
        "Professional email from company HR"
    ],
    "label": [
        "Fake", "Fake", "Fake", "Fake", "Fake", "Fake", "Fake", "Fake", "Fake", "Fake",
        "Suspected", "Suspected", "Suspected", "Suspected", "Suspected", "Suspected", "Suspected", "Suspected", "Suspected", "Suspected",
        "Genuine", "Genuine", "Genuine", "Genuine", "Genuine", "Genuine", "Genuine", "Genuine", "Genuine", "Genuine"
    ]
}

df = pd.DataFrame(data)

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["text"])
y = df["label"]

model = LogisticRegression()
model.fit(X, y)

joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("✅ ML Model trained and saved with 30 samples")
print(f"Training data: {len(df)} samples")
print(f"Fake: {df['label'].value_counts()['Fake']}")
print(f"Suspected: {df['label'].value_counts()['Suspected']}")
print(f"Genuine: {df['label'].value_counts()['Genuine']}")
