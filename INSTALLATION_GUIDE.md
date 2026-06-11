# Comprehensive Installation & Deployment Guide
# CV EPIC Warehouse - Inventory Management System
# Flask Python Backend + HTML/TailwindCSS Frontend

---

## 📋 DAFTAR ISI
1. [Prasyarat & Setup Database](#prasyarat--setup-database)
2. [Backend Flask Setup](#backend-flask-setup)
3. [Frontend Setup](#frontend-setup)
4. [Konfigurasi Environment](#konfigurasi-environment)
5. [Running Application](#running-application)
6. [Testing](#testing)
7. [Deployment ke Production](#deployment-ke-production)
8. [Troubleshooting](#troubleshooting)

---

## Prasyarat & Setup Database

### System Requirements
- Python 3.8+
- MySQL Server 5.7+ atau MariaDB 10.3+
- Node.js 14+ (untuk frontend bundling, optional)
- Git

### Step 1: Install Python Dependencies

\`\`\`bash
# Navigate ke project directory
cd inventory_app

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\\Scripts\\activate
# Linux/Mac:
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
\`\`\`

### Step 2: Setup MySQL Database

\`\`\`bash
# Login ke MySQL
mysql -u root -p

# Create database
CREATE DATABASE cv_epic_warehouse_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
EXIT;

# Run SQL schema
mysql -u root -p cv_epic_warehouse_mysql < database_schema_mysql_complete.sql
\`\`\`

### Step 3: Create App Database User (Production)

\`\`\`bash
mysql -u root -p

# Create user
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password_here';

# Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP ON cv_epic_warehouse_mysql.* TO 'app_user'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

EXIT;
\`\`\`

### Step 4: Verify Database Connection

\`\`\`bash
# Test connection
mysql -u app_user -p -h localhost -D cv_epic_warehouse_mysql -e "SELECT COUNT(*) FROM users;"
\`\`\`

---

## Backend Flask Setup

### Step 1: Configure Environment Variables

\`\`\`bash
# Copy template file
cp .env.example .env

# Edit .env dengan editor favorit Anda
nano .env  # atau use VSCode
\`\`\`

### .env Configuration Example

\`\`\`env
# Flask
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Database
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=strong_password_here
DB_NAME=cv_epic_warehouse_mysql
DB_PORT=3306

# API
API_HOST=0.0.0.0
API_PORT=5000
API_DEBUG=True

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:5000

# JWT
JWT_ACCESS_TOKEN_EXPIRES=86400
JWT_REFRESH_TOKEN_EXPIRES=2592000

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
\`\`\`

### Step 2: Test Flask Setup

\`\`\`bash
# Make sure venv is activated
source venv/bin/activate  # atau venv\\Scripts\\activate di Windows

# Run Flask development server
python app.py

# Expected output:
# WARNING in werkzeug: Running on http://0.0.0.0:5000
# Click on the link to access the application
\`\`\`

### Step 3: Initialize Database & Create Default Users

\`\`\`bash
# Start Flask shell
flask shell

# Di dalam shell Python:
>>> from app import create_app, db
>>> from flask_app.models import User
>>> from flask_app.utils.auth import AuthService
>>>
>>> app = create_app()
>>> with app.app_context():
>>>     # Create tables if not exist
>>>     db.create_all()
>>>
>>>     # Create default admin user
>>>     admin_user = User(
>>>         username='admin',
>>>         email='admin@warehouse.local',
>>>         password_hash=AuthService.hash_password('admin123'),
>>>         nama_lengkap='Administrator',
>>>         role='admin',
>>>         is_active=True
>>>     )
>>>     db.session.add(admin_user)
>>>     db.session.commit()
>>>     print('Admin user created successfully')

# Exit shell
>>> exit()
\`\`\`

### Test API Endpoints

\`\`\`bash
# Health check
curl http://localhost:5000/api/health

# Login (get token)
curl -X POST http://localhost:5000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'

# Expected response dengan access_token
\`\`\`

---

## Frontend Setup

### File Structure untuk Frontend

\`\`\`
/inventory_app
├── index.html (main page)
├── css/
│   ├── style.css (TailwindCSS + custom)
│   ├── dark-mode.css
│   └── responsive.css
├── js/
│   ├── app.js (main app logic)
│   ├── api.js (API client)
│   ├── auth.js (authentication)
│   ├── modules/
│   │   ├── opname.js (Stok Opname)
│   │   ├── barcode.js (Barcode features)
│   │   ├── scan.js (Scanner)
│   │   ├── dashboard.js (Dashboard)
│   │   └── report.js (Reporting)
│   └── utils/
│       ├── toast.js (Notifications)
│       ├── modal.js (Modals)
│       └── helpers.js (Helpers)
└── pages/ (HTML pages untuk SPA routing)
    ├── opname.html
    ├── barang.html
    ├── rak.html
    └── dashboard.html
\`\`\`

### Update index.html dengan TailwindCSS

Edit `index.html` untuk include TailwindCSS CDN:

\`\`\`html
<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV EPIC Warehouse - Inventory Management</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#3B82F6',
                        secondary: '#10B981',
                        danger: '#EF4444'
                    }
                }
            }
        }
    </script>
    
    <!-- Dark Mode Support -->
    <script>
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    </script>
    
    <style>
        .dark { color-scheme: dark; }
        body { transition: background-color 0.3s, color 0.3s; }
    </style>
</head>
<body class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
    
    <!-- Sidebar Navigation -->
    <aside class="fixed left-0 top-0 h-screen w-64 bg-slate-50 dark:bg-slate-800 shadow-lg">
        <!-- Logo -->
        <div class="p-6 border-b dark:border-slate-700">
            <h1 class="text-2xl font-bold text-primary">EPIC WH</h1>
            <p class="text-sm text-slate-600 dark:text-slate-400">Warehouse System</p>
        </div>
        
        <!-- Navigation Menu -->
        <nav class="mt-6 space-y-2 px-4">
            <a href="#dashboard" class="block px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition">
                📊 Dashboard
            </a>
            <a href="#opname" class="block px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition">
                📦 Stok Opname
            </a>
            <a href="#barang" class="block px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition">
                📋 Master Barang
            </a>
            <a href="#rak" class="block px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition">
                🗄️ Manajemen Rak
            </a>
            <a href="#scan" class="block px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition">
                📱 Scanner
            </a>
            <a href="#report" class="block px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition">
                📈 Laporan
            </a>
        </nav>
    </aside>
    
    <!-- Main Content -->
    <main class="ml-64 p-8">
        <!-- Header with Dark Mode Toggle -->
        <header class="flex justify-between items-center mb-8">
            <h2 id="pageTitle" class="text-3xl font-bold">Dashboard</h2>
            <div class="flex gap-4">
                <button id="darkModeToggle" class="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                    🌙
                </button>
                <button id="userMenu" class="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                    👤 <span id="userName">User</span>
                </button>
            </div>
        </header>
        
        <!-- Content Area -->
        <div id="content" class="space-y-6">
            <!-- Dashboard Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <p class="text-sm text-slate-600 dark:text-slate-400">Total Produk</p>
                    <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2" id="totalProduk">-</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <p class="text-sm text-slate-600 dark:text-slate-400">Total Qty</p>
                    <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2" id="totalQty">-</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <p class="text-sm text-slate-600 dark:text-slate-400">Min Stok</p>
                    <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2" id="minStok">-</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <p class="text-sm text-slate-600 dark:text-slate-400">Rak Penuh</p>
                    <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2" id="rakPenuh">-</p>
                </div>
            </div>
            
            <!-- Recent Transactions -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold mb-4">Histori Transaksi Terbaru</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th class="px-4 py-2 text-left">Waktu</th>
                                <th class="px-4 py-2 text-left">Produk</th>
                                <th class="px-4 py-2 text-left">Tipe</th>
                                <th class="px-4 py-2 text-center">Qty</th>
                                <th class="px-4 py-2 text-left">User</th>
                            </tr>
                        </thead>
                        <tbody id="transactionTable">
                            <tr>
                                <td colspan="5" class="px-4 py-4 text-center text-slate-600">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
    
    <!-- Scripts -->
    <script src="/js/app.js"></script>
    <script src="/js/api.js"></script>
    <script src="/js/modules/dashboard.js"></script>
</body>
</html>
\`\`\`

### Create Basic API Client (`js/api.js`)

\`\`\`javascript
// API Client for CV EPIC Warehouse

class APIClient {
    constructor(baseURL = '/api/v1') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('access_token');
    }
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }
    
    async request(method, endpoint, data = null) {
        const url = \`\${this.baseURL}\${endpoint}\`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (this.token) {
            options.headers['Authorization'] = \`Bearer \${this.token}\`;
        }
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (response.status === 401) {
                // Token expired
                localStorage.removeItem('access_token');
                window.location.href = '/login.html';
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: error.message };
        }
    }
    
    // Auth endpoints
    login(username, password) {
        return this.request('POST', '/auth/login', { username, password });
    }
    
    // Stok Opname endpoints
    listOpnameSessions(outletId, page = 1) {
        return this.request('GET', \`/opname/session?outlet_id=\${outletId}&page=\${page}\`);
    }
    
    createOpnameSession(outletId, tglOpname, keterangan = '') {
        return this.request('POST', '/opname/session', {
            outlet_id: outletId,
            tanggal_opname: tglOpname,
            keterangan
        });
    }
    
    // Dashboard endpoints
    getOpnameStats(outletId) {
        return this.request('GET', \`/dashboard/opname-stats?outlet_id=\${outletId}\`);
    }
}

// Global API client instance
const api = new APIClient();
\`\`\`

---

## Konfigurasi Environment

### Production Environment Variables

\`\`\`env
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=<generate-strong-key>
JWT_SECRET_KEY=<generate-strong-key>

DB_HOST=<your-db-host>
DB_USER=app_user
DB_PASSWORD=<strong-password>
DB_NAME=cv_epic_warehouse_mysql
DB_PORT=3306

API_HOST=0.0.0.0
API_PORT=5000

CORS_ORIGINS=https://your-domain.com

LOG_LEVEL=WARNING
LOG_FILE=/var/log/warehouse/app.log

# Optional: Sentry error tracking
SENTRY_DSN=https://...@sentry.io/...
\`\`\`

### Generate Secure Keys

\`\`\`bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Generate JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"
\`\`\`

---

## Running Application

### Development Mode

\`\`\`bash
# Activate venv
source venv/bin/activate

# Run Flask development server
python app.py

# Server akan berjalan di http://localhost:5000
\`\`\`

### Production Mode dengan Gunicorn

\`\`\`bash
# Install gunicorn
pip install gunicorn

# Run dengan Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --access-logfile logs/access.log --error-logfile logs/error.log app:create_app()
\`\`\`

### Using Supervisor (untuk auto-restart)

Create `/etc/supervisor/conf.d/warehouse.conf`:

\`\`\`ini
[program:warehouse]
command=/path/to/inventory_app/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:create_app()
directory=/path/to/inventory_app
user=www-data
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=10
stdout_logfile=/var/log/warehouse/app.log
stderr_logfile=/var/log/warehouse/error.log
\`\`\`

Then:

\`\`\`bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start warehouse
\`\`\`

---

## Testing

### Unit Testing

\`\`\`bash
# Run tests
pytest

# Run with coverage
pytest --cov=flask_app

# Run specific test
pytest tests/test_auth.py::test_login
\`\`\`

### API Testing dengan cURL

\`\`\`bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'

# Get Opname Stats (gunakan token dari login)
curl -H "Authorization: Bearer <token>" \\
  http://localhost:5000/api/v1/dashboard/opname-stats?outlet_id=1

# Create Stok Opname Session
curl -X POST http://localhost:5000/api/v1/opname/session \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "outlet_id": 1,
    "tanggal_opname": "2024-01-15",
    "tipe_opname": "full",
    "keterangan": "Opname periode Januari"
  }'
\`\`\`

---

## Deployment ke Production

### Menggunakan Nginx sebagai Reverse Proxy

Create `/etc/nginx/sites-available/warehouse`:

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
    }

    location /static {
        alias /path/to/inventory_app/static;
        expires 30d;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

Enable site:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/warehouse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### Setup SSL dengan Let's Encrypt

\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
\`\`\`

### Database Backups

Create `/root/backup-warehouse.sh`:

\`\`\`bash
#!/bin/bash
BACKUP_DIR="/backups/warehouse"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mysqldump -u app_user -p<password> cv_epic_warehouse_mysql > \
    $BACKUP_DIR/warehouse_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/warehouse_$DATE.sql"
\`\`\`

Schedule dengan cron:

\`\`\`bash
# Edit crontab
crontab -e

# Add line for daily backup at 2 AM
0 2 * * * /root/backup-warehouse.sh
\`\`\`

---

## Troubleshooting

### Common Issues

#### 1. "ModuleNotFoundError: No module named 'flask'"

**Solution:**
\`\`\`bash
# Activate venv
source venv/bin/activate
# Reinstall requirements
pip install -r requirements.txt
\`\`\`

#### 2. "Connection refused" ke database

**Check:**
\`\`\`bash
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u app_user -p -h localhost
\`\`\`

#### 3. CORS errors di frontend

**Solution:** Update CORS_ORIGINS di .env:
\`\`\`env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:5000,https://your-domain.com
\`\`\`

#### 4. JWT token expired

Frontend harus auto-refresh token:
\`\`\`javascript
// Check response for 401 dan refresh token
if (response.status === 401) {
    // Refresh token
    const refreshed = await api.request('POST', '/auth/refresh');
    if (refreshed.success) {
        api.setToken(refreshed.data.access_token);
        // Retry original request
    }
}
\`\`\`

#### 5. Static files not loading

**Check Nginx config:**
\`\`\`bash
# Verify paths exist
ls -la /path/to/inventory_app/static/

# Update Nginx location
location /static {
    alias /path/to/inventory_app/static;
}
\`\`\`

---

## Verification Checklist

Sebelum go live, pastikan:

- [ ] Database backup sudah disetup
- [ ] Environment variables sudah dikonfigurasi dengan aman
- [ ] SSL certificate sudah aktif
- [ ] Nginx reverse proxy sudah berjalan
- [ ] Supervisor auto-restart sudah aktif
- [ ] Logging sudah dikonfigurasi
- [ ] Firewall sudah membuka port 443 (HTTPS)
- [ ] Database user terbatas hanya untuk app_user
- [ ] SECRET_KEY dan JWT_SECRET_KEY sudah di-generate baru
- [ ] CORS_ORIGINS sudah restricted ke domain Anda
- [ ] Test login dan semua fitur utama
- [ ] Backup sudah berjalan otomatis
- [ ] Monitoring sudah disetup (optional: Sentry)

---

## Support & Maintenance

Untuk masalah teknis lanjutan atau customization:
1. Check logs: `/var/log/warehouse/app.log`
2. Review error di MySQL: `SHOW ERRORS;`
3. Monitor resource: `htop`, `iostat`, `vmstat`
4. Database optimization: `ANALYZE TABLE produk;`

---

**Version**: 1.0.0
**Last Updated**: 2024
**Ready for Production**: ✓

