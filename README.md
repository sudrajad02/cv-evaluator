# CMS Blog API

CMS sederhana untuk blog dengan fitur:
- Login
- Upload CV
- Evaluasi CV dengan AI

## **Persyaratan**
- Node.js v20+
- Mysql
- Docker (opsional)

## **Instalasi**
1. Clone repo:
   ```bash
   git clone https://github.com/sudrajad02/cv-evaluator
   cd cms-blog
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

## **Endpoint Utama**