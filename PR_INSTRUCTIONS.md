Branch: ui/dashboard-redesign

Langkah untuk push dan buat PR ke origin/main:

1. Pastikan Anda sudah login ke GitHub dan memiliki akses push.
2. Sinkronkan dengan origin/main:

   git fetch origin
   git rebase origin/main

3. Push branch lokal:

   git push origin ui/dashboard-redesign

4. Buka GitHub, buat Pull Request dari `ui/dashboard-redesign` ke `main`.

Catatan jika push gagal dengan 403:
- Siapkan Personal Access Token (PAT) dengan `repo` scope dan gunakan credential manager atau set remote URL `https://<PAT>@github.com/<owner>/<repo>.git`.
- Alternatif: gunakan SSH remote dan pastikan public key terdaftar di GitHub.

Neon / Database setup (untuk menjalankan backend terhubung ke Neon):

- Atur `DATABASE_URL` environment variable pada mesin lokal (format biasanya diberikan oleh Neon), contohnya:

   export DATABASE_URL="postgresql+psycopg2://user:password@host:port/dbname?sslmode=require"

- Pastikan paket `psycopg2-binary` terpasang di virtualenv:

   .venv\Scripts\python -m pip install psycopg2-binary

- Jika Anda menggunakan Windows WSL/Posgres tools atau Docker, pastikan SSL/pg biner tersedia. Neon biasanya menyediakan connection string lengkap termasuk SSL.

- Jalankan migrasi (jika ada) atau biarkan app membuat tabel ketika kompatibel:

   set DATABASE_URL="..." && set SECRET_KEY=... && set JWT_SECRET_KEY=... && .venv\Scripts\python app.py

Catatan: lokal dev sebelumnya menggunakan SQLite untuk iterasi UI; bila Anda ingin backend terhubung ke Neon, set `DATABASE_URL` dan jalankan.

Jika Anda mau, saya bisa:
- Membuat patch (`git format-patch origin/main..ui/dashboard-redesign`) dan menyimpan file patch di repo untuk diunggah secara manual.
- Menyederhanakan commit history (squash) sebelum push.
