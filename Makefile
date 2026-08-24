# Document Summary Assistant - Developer Makefile
.PHONY: setup test run-backend run-frontend clean

setup:
	@echo "Setting up backend..."
	cd backend && python -m pip install --upgrade pip && pip install -r requirements.txt
	@echo "Setting up frontend..."
	cd frontend && npm install

test:
	@echo "Running backend tests..."
	cd backend && pytest test_main.py -v

run-backend:
	@echo "Starting FastAPI backend..."
	cd backend && uvicorn main:app --reload

run-frontend:
	@echo "Starting Next.js frontend..."
	cd frontend && npm run dev

clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -f backend/test.db
