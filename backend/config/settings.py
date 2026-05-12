"""
Django settings for Quiniela Mundial 2026
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Cargar variables de entorno
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

BASE_DIR = Path(__file__).resolve().parent.parent

# ===========================================================
# SECURITY
# ===========================================================
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

# Acepta DJANGO_ALLOWED_HOSTS o ALLOWED_HOSTS (Railway lo pone como ALLOWED_HOSTS)
_allowed_hosts_raw = os.environ.get('DJANGO_ALLOWED_HOSTS') or os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_raw.split(',')]

# CSRF — necesario para Railway/Vercel
_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]

# ===========================================================
# APPLICATIONS
# ===========================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_celery_beat',
    # Local
    'core',
    'users',
    'sync',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ===========================================================
# DATABASE — Supabase (PostgreSQL)
# ===========================================================
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # SQLite para desarrollo local sin Supabase
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ===========================================================
# AUTH
# ===========================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ===========================================================
# DJANGO REST FRAMEWORK
# ===========================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# ===========================================================
# CORS
# ===========================================================
cors_env = os.environ.get('CORS_ALLOWED_ORIGINS')
if cors_env:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_env.split(',')]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ]
CORS_ALLOW_CREDENTIALS = True

# ===========================================================
# CELERY
# ===========================================================
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# ===========================================================
# SUPABASE
# ===========================================================
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# ===========================================================
# SPORTS API
# ===========================================================
FOOTBALL_API_KEY = os.environ.get('FOOTBALL_API_KEY', '')
FOOTBALL_API_BASE_URL = os.environ.get('FOOTBALL_API_BASE_URL', 'https://api.football-data.org/v4')

# ===========================================================
# INTERNATIONALIZATION
# ===========================================================
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ===========================================================
# EMAIL
# ===========================================================
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@quiniela2026.com')

# ===========================================================
# STATIC & MEDIA — Supabase Storage
# ===========================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Configuración de Supabase como almacenamiento de medios
SUPABASE_PROJECT_ID = 'nphntxzxnweqtzjbxipl'
USE_SUPABASE_STORAGE = os.environ.get('USE_SUPABASE_STORAGE', 'False') == 'True'

if USE_SUPABASE_STORAGE:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.environ.get('SUPABASE_S3_ACCESS_KEY', '')
    AWS_SECRET_ACCESS_KEY = os.environ.get('SUPABASE_S3_SECRET_KEY', '')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('SUPABASE_S3_BUCKET', 'pagos')
    AWS_S3_REGION_NAME = 'us-east-1'
    AWS_S3_ENDPOINT_URL = 'https://nphntxzxnweqtzjbxipl.supabase.co/storage/v1/s3'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'public-read'
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    MEDIA_URL = 'https://nphntxzxnweqtzjbxipl.supabase.co/storage/v1/object/public/pagos/'
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===========================================================
# BACKEND DE AUTENTICACION
# ===========================================================
AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]
