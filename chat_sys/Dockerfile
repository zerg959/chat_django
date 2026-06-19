FROM python:3.10-slim

# copy workdir
WORKDIR /app

# System update and installation
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collectstatic
RUN python manage.py collectstatic --noinput

# Open port
EXPOSE 8000

# Run daphne (ASGI сервер)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "chat_sys.asgi:application"]