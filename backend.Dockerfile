# Use lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements file if available, otherwise just use requirements inline (actually we have requirements in ckned)
COPY ckned/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY ckned/ .

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Run the FastAPI server using uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
