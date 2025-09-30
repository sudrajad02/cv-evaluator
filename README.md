# CV EVALUATOR API

CV Evaluator project dengan fitur:
- Login
- Upload CV
- Evaluasi CV dengan AI

## **Persyaratan**
- Node.js v20+
- Mysql
- OpenRouter api key
- Cohere api key
- Redis
- Qdrant
- Docker (opsional)

## **Instalasi**
1. Clone repo:
   ```bash
   git clone https://github.com/sudrajad02/cv-evaluator
   cd cv-evaluator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy file `.env` dari `.env.sample` kemudian edit dengan sesuai kebutuhan:

4. Jalankan:
   ```bash
   npm run dev
   ```

## **Docker**
1. Pastikan App sudah di build, jika belum jalankan:
   ```bash
   npm run build
   ```

2. Jalankan container menggunakan docker compose v2:
   ```bash
   docker compose up -d
   ```

## **Endpoint**
1. Endpoint Utama
| Method | Endpoint                     | Deskripsi                                 |
|--------|------------------------------|-------------------------------------------|
| POST   | /api/v1/upload               | Create kandidat hanya file CV dan Project |
| POST   | /api/v1/evaluate             | Evaluasi dari CV ke LLM                   |
| GET    | /api/v1/evaluate/result/:id  | Hasil dari evaluasi                       |

2. Endpoint Tambahan
| Method | Endpoint               | Deskripsi                    |
|--------|------------------------|------------------------------|
| POST   | /api/v1/auth/login     | Login user                   |
| POST   | /api/v1/jobs           | Tambah job baru              |
| GET    | /api/v1/jobs           | Ambil data semua job         |
| GET    | /api/v1/jobs/:id       | Ambil data job by id         |
| POST   | /api/v1/candidates     | Tambah kandidat baru lengkap |
| GET    | /api/v1/candidates     | Ambil data semua kandidat    |
| GET    | /api/v1/candidates/:id | Ambil data kandidat by id    |