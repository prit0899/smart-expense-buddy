# 💰 FinTrack – Smart Expense Buddy

FinTrack is a modern expense tracking application that helps users manage income, track spending, and automatically extract data from receipts using AI-assisted scanning.

Built with a TypeScript-first architecture and powered by Supabase for backend services.

---

## 🚀 Features

### 📊 Dashboard Overview
- Real-time balance tracking
- Income vs expense summary
- Visual spending breakdown (category-wise)

### 💸 Transaction Management
- Add income and expenses بسهولة
- Categorize transactions (Food, Transport, Shopping, etc.)
- Clean transaction history with filters (All / Income / Expense)

### 🧾 Receipt Scanner (Core Feature)
- Upload or scan receipts
- Auto-detect:
  - Amount
  - Merchant
  - Category
- Quick confirm and save flow

### 🔍 Smart UI/UX
- Minimal dark theme interface
- Fast navigation (Dashboard / History / Scan)
- Mobile-first design

---

## 🛠 Tech Stack

- **Frontend:** TypeScript
- **Backend:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage (receipt images)
- **Styling:** CSS

---

## 📸 Screenshots

### Dashboard
<img width="534" height="682" alt="dashboard" src="https://github.com/user-attachments/assets/87b8b8b2-8ac8-4d5e-acd6-eb1df0efd7d5" />

### Transactions
<img width="507" height="689" alt="transactions" src="https://github.com/user-attachments/assets/c80d4dea-c7cc-4c8a-9c4a-4f5f8937068c" />

### Receipt Scanner
<img width="507" height="707" alt="Screenshot 2026-03-25 at 10 48 37 PM" src="https://github.com/user-attachments/assets/90f3ed15-31ff-4811-86c9-e52d0ee6fa0f" />


---

## ⚙️ Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/prit0899/smart-expense-buddy.git
cd smart-expense-buddy
Install dependencies:
npm install
Configure environment variables:
Create a .env file:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
Run the project:
npm run dev
🧠 How It Works
Transactions are stored in Supabase (PostgreSQL)
Receipts are uploaded to Supabase Storage
Scanner extracts key fields and pre-fills transaction data
User confirms before saving
⚠️ Limitations
OCR accuracy depends on receipt quality
No advanced analytics (yet)
No offline support
🔮 Future Improvements
Full OCR pipeline with better parsing accuracy
AI-based spending insights
Budget planning & alerts
Export data (CSV/PDF)
Authentication & multi-user support
👤 Author
Prit Yagnik
GitHub: https://github.com/prit0899
