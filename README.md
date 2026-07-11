# ReUniteAI

## AI-Powered Missing Person Identification and Reunification System

ReUniteAI is an AI-based web application designed to assist in identifying and reuniting missing persons with their families. The system uses facial recognition and image processing techniques to compare uploaded images with registered missing person records, providing fast and accurate match predictions.

## Features

* AI-powered facial recognition
* Missing person registration
* Image upload and comparison
* Real-time match prediction
* User-friendly web interface
* PostgreSQL database integration
* Secure backend APIs
* Responsive frontend

---

## Tech Stack

### Frontend

* React
* HTML
* CSS
* JavaScript

### Backend

* Python
* Flask
* TensorFlow
* OpenCV
* Face Recognition
* PostgreSQL

---

# Prerequisites

Before running the project, ensure you have the following installed:

* Python 3.10 or later
* Node.js and npm
* PostgreSQL
* Git

---

# Installation

## 1. Clone the repository

```bash
git clone https://github.com/Shuvraj12/ReUniteAI.git
cd ReUniteAI
```

## 2. Install Backend Dependencies

Navigate to the **Backend** folder and install all required packages from the `requirements.txt` file.

```bash
cd Backend
pip install -r requirements.txt
```

After installation, return to the project root.

---

## 3. Configure PostgreSQL

Create a PostgreSQL database and update the database credentials in the backend configuration (if required).

---

# Running the Project

This project includes two batch files for easy execution.

### Step 1

Run:

```text
backend.bat
```

Wait until the backend server starts successfully.

### Step 2

Run:

```text
frontend.bat
```

The frontend will automatically connect to the running backend.

> **Important:** Always start `backend.bat` first, followed by `frontend.bat`.

---

# Project Structure

```
ReUniteAI
│
├── Backend/
│   ├── requirements.txt
|   ├── backend.bat
│   ├── ...
│
├── Frontend/
    ├── frontend.bat
    ├── ...
├── README.md
└── .gitignore
```

# Future Improvements

* Live CCTV integration
* Mobile application
* Multi-language support
* Police portal integration
* Cloud deployment
* Advanced face recognition models
* Email and SMS notifications

---

# Contributing

Contributions, suggestions, and feature requests are welcome. Feel free to fork the repository and submit a pull request.

---

# License

This project is intended for educational and research purposes.

---

## Author

**Shuvraj Gaurav**

B.Tech Computer Science (AI & ML)

GitHub: https://github.com/Shuvraj12
