from pydantic import BaseModel
from app.main import get_session
from app.models import User
from fastapi import Depends
from sqlmodel import Session, select
from fastapi import APIRouter, HTTPException

app = APIRouter()


class UserView(BaseModel):
    id: int
    username: str
    email: str
    role: str
    organization: str | None = None


class UserUpdate(BaseModel):
    organization: str | None = None


@app.get("/users")
def read_users(skip: int = 0, limit: int = 10, session: Session = Depends(get_session)):
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "organization": u.organization if u.organization else "None",
        }
        for u in users
    ]


@app.get("/users/{user_id}")
def read_user(user_id: int, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "organization": user.organization if user.organization else "None",
    }


@app.put("/users/{user_id}", response_model=UserView)
def update_user_organization(
    user_id: int, user_update: UserUpdate, session: Session = Depends(get_session)
):
    user_to_update = session.exec(select(User).where(User.id == user_id)).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_update.organization = (
        user_update.organization if hasattr(user_update, "organization") else None
    )

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    return {
        "id": str(user_to_update.id),
        "username": user_to_update.username,
        "email": user_to_update.email,
        "role": user_to_update.role,
        "organization": user_to_update.organization,
    }


@app.delete("/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user_to_delete = session.exec(select(User).where(User.id == user_id)).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    session.delete(user_to_delete)
    session.commit()
    return {"detail": "User deleted successfully"}
