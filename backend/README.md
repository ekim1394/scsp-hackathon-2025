# Backend

Tech stack

- FastAPI
- SQLModel
- Alembic

## DB Migration

1. Update `models.py`
2. Run `alembic revision --autogenerate -m "add a message here"`
3. If success, run `alembic upgrade head`

## Run App

`fastapi dev app/main.py`
