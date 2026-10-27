# How to Run Deadline Compass

This guide contains all terminal commands to run, test, and build the entire application.

---

## 1. Prerequisites Checklist

Ensure you have the following installed on your system:
- **Java Development Kit (JDK 21 or 23)**
- **Apache Maven (3.9+)**
- **Node.js (v18+) & npm (v10+)**
- **Supabase Account & Project** (with PostgreSQL database credentials)

---

## 2. Configuration Setup

Before running the backend for the first time:

1. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```
2. Copy `.env.example` to `.env` (if not already created):
   ```powershell
   cp .env.example .env
   ```
3. Open `backend/.env` in your text editor and ensure your Supabase connection parameters are filled:
   ```properties
   DB_URL=jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require
   DB_USERNAME=postgres
   DB_PASSWORD=your_supabase_database_password
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8082,http://127.0.0.1:8082
   SERVER_PORT=8081
   ```

---

## 3. Running the Application

You will need **two terminal windows**:

### Terminal 1: Backend (Spring Boot + PostgreSQL)

```powershell
# Navigate to the backend directory
cd backend

# (Optional: If maven is not permanently on your PATH)
$env:PATH += ";C:\tools\apache-maven-3.9.8\bin"

# Start the Spring Boot backend
mvn spring-boot:run
```
- **Backend Port:** `http://localhost:8081`
- **Database:** Automatically runs Flyway database migrations (`V1__create_schema.sql`) against your Supabase instance.

---

### Terminal 2: Frontend (React + Vite)

```powershell
# Navigate to project root (deadline-compass-main)
cd ..

# (First time only) Install frontend dependencies
npm install --legacy-peer-deps

# Start the development server
npm run dev
```
- **Frontend URL:** `http://localhost:3000`
- Open `http://localhost:3000` in your browser.

---

## 4. Running Automated Tests

### Backend Tests (JUnit 5 + Mockito + MockMvc)
```powershell
cd backend
$env:PATH += ";C:\tools\apache-maven-3.9.8\bin"
mvn test
```
*Runs all 30 unit and integration tests (Service logic, conflict handling, Bean validation, REST controllers).*

### Frontend Tests (Vitest)
```powershell
# In the project root
npm test
```
*Runs all 11 unit tests (`api.test.ts`, `time.test.ts`, and routing tests).*

---

## 5. Building for Production

### Frontend Production Build
```powershell
npm run build
```
*Compiles the TypeScript client bundle and SSR assets to `.output/` with zero errors.*

### Previewing the Frontend Production Build
```powershell
npx vite preview --port 3000
```

### Backend JAR Package
```powershell
cd backend
$env:PATH += ";C:\tools\apache-maven-3.9.8\bin"
mvn clean package -DskipTests
```
*Generates the executable JAR at `backend/target/deadline-manager-0.0.1-SNAPSHOT.jar`.*
